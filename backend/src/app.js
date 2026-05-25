const express = require("express");
const cors = require("cors");

const { getDb, getReplicaSetHealth, isDbAvailabilityError } = require("./db");
const { Account, Client, Transaction } = require("./models");
const {
  TransactionError,
  createBankOperation,
  serializeTransaction,
} = require("../transactions");

function createApp() {
  const app = express();

  // Middlewares de configuración.

  app.use(cors());
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
        error: "Replica set de MongoDB no disponible",
      });
    }
  });

  // Rutas de la API.

  app.get("/api/clients", async (_, res) => {
    try {
      const clients = await Client.find({}).lean();
      res.json(clients);
    } catch (error) {
      handleDbError(error, res);
    }
  });

  app.get("/api/accounts/:accountNumber", async (req, res) => {
    try {
      const { accountNumber } = req.params;

      const account = await Account.findOne({ accountNumber }).lean();
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      const client = await Client.findOne({ curp: account.client }).lean();

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
          curp: client?.curp,
          email: client?.email,
          phone: client?.phone,
        },
        transactions: transactions.map(serializeTransaction),
      });
    } catch (error) {
      handleDbError(error, res);
    }
  });

  app.get("/api/accounts/:accountNumber/history", async (req, res) => {
    try {
      const { accountNumber } = req.params;

      const account = await Account.findOne({ accountNumber }).lean();
      if (!account) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      const history = await Transaction.find({ accountNumber })
        .sort({ date: 1 })
        .lean();

      res.json(history.map(serializeTransaction));
    } catch (error) {
      handleDbError(error, res);
    }
  });

  app.post("/api/deposits", async (req, res) => {
    try {
      const result = await createBankOperation(
        { AccountModel: Account, TransactionModel: Transaction },
        {
          ...req.body,
          type: "deposit",
        },
      );

      res.json({
        message: result.message,
        previousBalance: result.previousBalance,
        depositedAmount: result.transaction.amount,
        newBalance: result.newBalance,
        branch: result.transaction.branch,
      });
    } catch (error) {
      handleOperationError(error, res);
    }
  });

  app.post("/api/withdrawals", async (req, res) => {
    try {
      const result = await createBankOperation(
        { AccountModel: Account, TransactionModel: Transaction },
        {
          ...req.body,
          type: "withdrawal",
        },
      );

      res.json({
        message: result.message,
        previousBalance: result.previousBalance,
        withdrawnAmount: result.transaction.amount,
        newBalance: result.newBalance,
        branch: result.transaction.branch,
      });
    } catch (error) {
      handleOperationError(error, res);
    }
  });

  return app;
}

function handleDbError(error, res) {
  if (isDbAvailabilityError(error)) {
    console.error("MongoDB no disponible:", error.message);
    return res.status(503).json({
      error: "Replica set de MongoDB no disponible",
    });
  }

  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

function handleOperationError(error, res) {
  if (error instanceof TransactionError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return handleDbError(error, res);
}

module.exports = { createApp };
