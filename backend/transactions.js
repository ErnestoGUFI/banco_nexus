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
    branch: normalizeBranch(baseTransaction.branch),
  };
}

function validateOperationPayload({ accountNumber, amount, type }) {
  if (!accountNumber || amount === undefined) {
    throw new TransactionError(
      400,
      "Faltan campos: cuenta y monto son requeridos",
    );
  }

  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    throw new TransactionError(400, "El monto debe ser un número positivo");
  }

  if (!["deposit", "withdrawal"].includes(type)) {
    throw new TransactionError(400, "Tipo de operación no soportado");
  }
}

// Simulation

async function createBankOperation(
  { AccountModel = Account, TransactionModel = Transaction } = {},
  { accountNumber, amount, branch, type, description },
) {
  validateOperationPayload({ accountNumber, amount, type });

  const account = await AccountModel.findOne({ accountNumber }).lean();
  if (!account) {
    throw new TransactionError(404, "Cuenta no encontrada");
  }

  if (!account.active) {
    throw new TransactionError(403, "La cuenta está inactiva");
  }

  if (type === "withdrawal" && account.balance < amount) {
    throw new TransactionError(400, "Saldo insuficiente");
  }

  const normalizedBranch = normalizeBranch(branch);
  const roundedAmount = roundAmount(amount);
  const balanceDelta = type === "deposit" ? roundedAmount : -roundedAmount;
  const newBalance = roundAmount(account.balance + balanceDelta);

  const updateResult = await AccountModel.updateOne(
    { accountNumber },
    { $set: { balance: newBalance } },
  );

  if (!updateResult.matchedCount) {
    throw new TransactionError(404, "Cuenta no encontrada");
  }

  const transaction = serializeTransaction({
    accountNumber,
    type,
    amount: roundedAmount,
    resultingBalance: newBalance,
    date: new Date(),
    branch: normalizedBranch,
    description:
      description || (type === "deposit" ? "Depósito" : "Retiro en cajero"),
  });

  const createdTransaction = await TransactionModel.create(transaction);

  return {
    message:
      type === "deposit"
        ? "Depósito realizado con éxito"
        : "Retiro realizado con éxito",
    previousBalance: account.balance,
    newBalance,
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
