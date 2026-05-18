const express = require("express");
const cors = require("cors");

const { getDb } = require("./db");
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
  app.use((_, res, next) => {
    try {
      getDb();
      next();
    } catch {
      res.status(503).json({ error: "Base de datos no disponible" });
    }
  });

  // Rutas de la API.

  app.get("/health", (_, res) => {
    res.json({ estado: "OK", timestamp: new Date() });
  });

  app.get("/api/clientes", async (_, res) => {
    try {
      const clientes = await Client.find({}).lean();
      res.json(clientes);
    } catch {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.get("/api/cuenta/:cuenta", async (req, res) => {
    try {
      const { cuenta } = req.params;

      const cuentaDoc = await Account.findOne({ cuenta }).lean();
      if (!cuentaDoc) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      const clienteDoc = await Client.findOne({ curp: cuentaDoc.cliente }).lean();

      const transacciones = await Transaction.find({ cuenta })
        .sort({ fecha: -1 })
        .lean();

      res.json({
        cuenta: cuentaDoc.cuenta,
        tipo: cuentaDoc.tipo,
        saldo: cuentaDoc.saldo,
        fechaApertura: cuentaDoc.fechaApertura,
        activa: cuentaDoc.activa,
        cliente: {
          nombre: clienteDoc?.nombre || "Desconocido",
          curp: clienteDoc?.curp,
          email: clienteDoc?.email,
          telefono: clienteDoc?.telefono,
        },
        transacciones: transacciones.map(serializeTransaction),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.get("/api/historial/:cuenta", async (req, res) => {
    try {
      const { cuenta } = req.params;

      const cuentaDoc = await Account.findOne({ cuenta }).lean();
      if (!cuentaDoc) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }

      const historial = await Transaction.find({ cuenta })
        .sort({ fecha: 1 })
        .lean();

      res.json(historial.map(serializeTransaction));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/deposito", async (req, res) => {
    try {
      const result = await createBankOperation(
        { AccountModel: Account, TransactionModel: Transaction },
        {
        ...req.body,
        tipo: "deposito",
        },
      );

      res.json({
        mensaje: result.mensaje,
        saldoAnterior: result.saldoAnterior,
        montoDepositado: result.transaction.monto,
        nuevoSaldo: result.nuevoSaldo,
        sucursal: result.transaction.sucursal,
      });
    } catch (error) {
      handleOperationError(error, res);
    }
  });

  app.post("/api/retiro", async (req, res) => {
    try {
      const result = await createBankOperation(
        { AccountModel: Account, TransactionModel: Transaction },
        {
        ...req.body,
        tipo: "retiro",
        },
      );

      res.json({
        mensaje: result.mensaje,
        saldoAnterior: result.saldoAnterior,
        montoRetirado: result.transaction.monto,
        nuevoSaldo: result.nuevoSaldo,
        sucursal: result.transaction.sucursal,
      });
    } catch (error) {
      handleOperationError(error, res);
    }
  });

  return app;
}

function handleOperationError(error, res) {
  if (error instanceof TransactionError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

module.exports = { createApp };
