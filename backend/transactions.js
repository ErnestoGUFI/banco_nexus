const BRANCHES = ["CDMX", "GDL", "MTY", "PUE", "TIJ"];
const DEFAULT_BRANCH = "CDMX";

const { Account, Transaction } = require("./src/models");

class TransactionError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "TransactionError";
    this.statusCode = statusCode;
  }
}

// Helper functions.

function normalizeBranch(branch) {
  const normalized =
    typeof branch === "string" ? branch.trim().toUpperCase() : "";
  return BRANCHES.includes(normalized) ? normalized : DEFAULT_BRANCH;
}

function roundAmount(value) {
  return parseFloat(value.toFixed(2));
}

function serializeTransaction(transaction) {
  const baseTransaction =
    transaction && typeof transaction.toObject === "function"
      ? transaction.toObject()
      : transaction;

  return {
    ...baseTransaction,
    sucursal: normalizeBranch(baseTransaction.sucursal),
  };
}

function validateOperationPayload({ cuenta, monto, tipo }) {
  if (!cuenta || monto === undefined) {
    throw new TransactionError(
      400,
      "Faltan campos: cuenta y monto son requeridos",
    );
  }

  if (typeof monto !== "number" || Number.isNaN(monto) || monto <= 0) {
    throw new TransactionError(400, "El monto debe ser un número positivo");
  }

  if (!["deposito", "retiro"].includes(tipo)) {
    throw new TransactionError(400, "Tipo de operación no soportado");
  }
}

// Simulation

async function createBankOperation(
  { AccountModel = Account, TransactionModel = Transaction } = {},
  { cuenta, monto, sucursal, tipo, descripcion },
) {
  validateOperationPayload({ cuenta, monto, tipo });

  const account = await AccountModel.findOne({ cuenta }).lean();
  if (!account) {
    throw new TransactionError(404, "Cuenta no encontrada");
  }

  if (!account.activa) {
    throw new TransactionError(403, "La cuenta está inactiva");
  }

  if (tipo === "retiro" && account.saldo < monto) {
    throw new TransactionError(400, "Saldo insuficiente");
  }

  const normalizedBranch = normalizeBranch(sucursal);
  const roundedAmount = roundAmount(monto);
  const balanceDelta = tipo === "deposito" ? roundedAmount : -roundedAmount;
  const newBalance = roundAmount(account.saldo + balanceDelta);

  const updateResult = await AccountModel.updateOne(
    { cuenta },
    { $set: { saldo: newBalance } },
  );

  if (!updateResult.matchedCount) {
    throw new TransactionError(404, "Cuenta no encontrada");
  }

  const transaction = serializeTransaction({
    cuenta,
    tipo,
    monto: roundedAmount,
    saldoResultante: newBalance,
    fecha: new Date(),
    sucursal: normalizedBranch,
    descripcion:
      descripcion || (tipo === "deposito" ? "Depósito" : "Retiro en cajero"),
  });

  const createdTransaction = await TransactionModel.create(transaction);

  return {
    mensaje:
      tipo === "deposito"
        ? "Depósito realizado con éxito"
        : "Retiro realizado con éxito",
    saldoAnterior: account.saldo,
    nuevoSaldo: newBalance,
    transaction: serializeTransaction(createdTransaction.toObject()),
  };
}

module.exports = {
  BRANCHES,
  DEFAULT_BRANCH,
  TransactionError,
  createBankOperation,
  normalizeBranch,
  serializeTransaction,
};
