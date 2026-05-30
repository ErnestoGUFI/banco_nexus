const express = require("express");
const cors = require("cors");

const { getDb, getReplicaSetHealth, isDbAvailabilityError } = require("./db");
const { Account, AuditLog, Beneficiary, Client, Transaction } = require("./models");
const {
  BankingError,
  createBeneficiary,
  executeTransfer,
  getClientByToken,
  getDashboard,
  loginClient,
  registerClient,
  serializeBeneficiary,
  serializeTransaction,
  updateProfile,
  validateAccountNumber,
} = require("./banking");

function createApp() {
  const app = express();
  const corsOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigins.length ? corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", async (_, res) => {
    const health = await getReplicaSetHealth();
    const statusCode = health.status === "DOWN" ? 503 : 200;

    res.status(statusCode).json({
      ...health,
      timestamp: new Date(),
    });
  });

  app.use("/api", (_, res, next) => {
    try {
      getDb();
      next();
    } catch {
      res.status(503).json({
        error: "La base de datos administrada no esta disponible",
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = await registerClient(req.body, { req });
      res.status(201).json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = await loginClient(req.body, { req });
      res.json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.use("/api", authenticate);

  app.get("/api/me", async (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  app.patch("/api/me", async (req, res) => {
    try {
      const user = await updateProfile(req.user, req.body, { req });
      res.json({ user });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const dashboard = await getDashboard(req.user);
      res.json(dashboard);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/beneficiaries", async (req, res) => {
    try {
      const beneficiaries = await Beneficiary.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

      res.json(beneficiaries.map(serializeBeneficiary));
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/beneficiaries", async (req, res) => {
    try {
      const beneficiary = await createBeneficiary(req.user, req.body, { req });
      res.status(201).json(beneficiary);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.post("/api/transfers", async (req, res) => {
    try {
      const result = await executeTransfer(req.user, req.body, { req });
      res.status(201).json(result);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await Transaction.find({
        accountNumber: req.user.accountNumber,
      })
        .sort({ date: -1 })
        .limit(100)
        .lean();

      res.json(transactions.map(serializeTransaction));
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/audit", async (req, res) => {
    try {
      const auditLogs = await AuditLog.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      res.json(auditLogs);
    } catch (error) {
      handleError(error, res);
    }
  });

  app.get("/api/accounts/:accountNumber", async (req, res) => {
    try {
      const accountNumber = validateAccountNumber(req.params.accountNumber);
      const account = await Account.findOne({ accountNumber }).lean();

      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      const client = await Client.findById(account.owner).lean();
      const transactions = await Transaction.find({ accountNumber })
        .sort({ date: -1 })
        .lean();

      res.json({
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        openedAt: account.openedAt,
        active: account.active,
        client: {
          name: client?.name || "Desconocido",
          email: client?.email,
          phone: client?.phone,
        },
        transactions: transactions.map(serializeTransaction),
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  async function authenticate(req, res, next) {
    try {
      req.user = await getClientByToken(req.headers.authorization);
      next();
    } catch (error) {
      handleError(error, res);
    }
  }

  return app;
}

function publicUser(client) {
  return {
    id: String(client._id),
    name: client.name,
    email: client.email,
    phone: client.phone,
    accountNumber: client.accountNumber,
    accountSequence: client.accountSequence,
  };
}

function handleError(error, res) {
  if (error instanceof BankingError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  if (isDbAvailabilityError(error)) {
    console.error("Base de datos no disponible:", error.message);
    return res.status(503).json({
      error: "La base de datos administrada no esta disponible",
    });
  }

  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

module.exports = { createApp };
