const bcrypt = require("bcryptjs");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const {
  Account,
  AuditLog,
  Beneficiary,
  Client,
  Counter,
  Transaction,
} = require("./models");

const ACCOUNT_PREFIX = "180";
const ACCOUNT_NUMBER_REGEX = /^\d{10}$/;
const ACCOUNT_SEQUENCE_LIMIT = 999999;
const DEFAULT_INITIAL_BALANCE = 5000;
const DEFAULT_JWT_SECRET = "banco-nexus-dev-secret";
const JWT_SECRET = envOrFile("JWT_SECRET", DEFAULT_JWT_SECRET);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

if (process.env.NODE_ENV === "production" && JWT_SECRET === DEFAULT_JWT_SECRET) {
  throw new Error("JWT_SECRET es obligatorio en produccion");
}

class BankingError extends Error {
  constructor(statusCode, message, code = "BANKING_ERROR") {
    super(message);
    this.name = "BankingError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function envOrFile(name, fallback) {
  if (process.env[name]) {
    return process.env[name];
  }

  const filePath = process.env[`${name}_FILE`];

  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf8").trim();
  }

  return fallback;
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function roundAmount(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function assertPositiveAmount(amount) {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new BankingError(400, "El monto debe ser un numero positivo");
  }

  return roundAmount(parsedAmount);
}

function validateAccountNumber(accountNumber) {
  const normalized = normalizeText(accountNumber);

  if (!ACCOUNT_NUMBER_REGEX.test(normalized)) {
    throw new BankingError(
      400,
      "El numero de cuenta debe contener exactamente 10 digitos",
      "INVALID_ACCOUNT_NUMBER",
    );
  }

  return normalized;
}

function calculateCheckDigit(baseAccountNumber) {
  const sum = baseAccountNumber
    .split("")
    .reduce((total, digit) => total + Number(digit), 0);

  return sum % 10;
}

function generateAccountNumber(sequenceId) {
  const sequence = Number(sequenceId);

  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new BankingError(500, "Secuencia de cuenta invalida");
  }

  if (sequence > ACCOUNT_SEQUENCE_LIMIT) {
    throw new BankingError(500, "Se alcanzo el limite de cuentas disponibles");
  }

  const sequenceBlock = String(sequence).padStart(6, "0");
  const baseAccountNumber = `${ACCOUNT_PREFIX}${sequenceBlock}`;

  return `${baseAccountNumber}${calculateCheckDigit(baseAccountNumber)}`;
}

function toClientPayload(client) {
  return {
    id: String(client._id),
    name: client.name,
    email: client.email,
    phone: client.phone,
    accountNumber: client.accountNumber,
    accountSequence: client.accountSequence,
  };
}

function createToken(client) {
  return jwt.sign(
    {
      sub: String(client._id),
      accountNumber: client.accountNumber,
      email: client.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function serializeTransaction(transaction) {
  const baseTransaction =
    transaction && typeof transaction.toObject === "function"
      ? transaction.toObject()
      : transaction;

  return {
    id: String(baseTransaction._id || ""),
    accountNumber: baseTransaction.accountNumber,
    type: baseTransaction.type,
    amount: baseTransaction.amount,
    resultingBalance: baseTransaction.resultingBalance,
    date: baseTransaction.date,
    description: baseTransaction.description,
    sourceAccount: baseTransaction.sourceAccount,
    destinationAccount: baseTransaction.destinationAccount,
    transferId: baseTransaction.transferId
      ? String(baseTransaction.transferId)
      : undefined,
  };
}

function serializeBeneficiary(beneficiary) {
  return {
    id: String(beneficiary._id),
    alias: beneficiary.alias,
    accountNumber: beneficiary.accountNumber,
    holderName: beneficiary.holderName,
    createdAt: beneficiary.createdAt,
  };
}

function getRequestMetadata(req) {
  if (!req) {
    return {};
  }

  return {
    ip: req.ip || req.headers?.["x-forwarded-for"] || "",
    userAgent: req.headers?.["user-agent"] || "",
  };
}

async function writeAuditLog(
  {
    user,
    accountNumber,
    action,
    status,
    detail = {},
    req,
    session,
  },
  { AuditLogModel = AuditLog } = {},
) {
  const metadata = getRequestMetadata(req);
  const docs = [
    {
      user: user || undefined,
      accountNumber,
      action,
      status,
      detail,
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    },
  ];

  if (session) {
    const [createdLog] = await AuditLogModel.create(docs, {
      session,
      ordered: true,
    });
    return createdLog;
  }

  const [createdLog] = await AuditLogModel.create(docs);
  return createdLog;
}

function mapDuplicateError(error) {
  if (error?.code !== 11000) {
    return null;
  }

  const fields = Object.keys(error.keyPattern || error.keyValue || {});

  if (fields.includes("email")) {
    return new BankingError(409, "Ya existe un cliente con ese correo");
  }

  if (fields.includes("accountNumber")) {
    return new BankingError(409, "El numero de cuenta ya existe");
  }

  if (fields.includes("alias")) {
    return new BankingError(409, "Ya tienes una cuenta destino con ese alias");
  }

  return new BankingError(409, "El registro ya existe");
}

async function registerClient(payload, { req } = {}) {
  const name = normalizeText(payload.name);
  const phone = normalizeText(payload.phone);
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : "";
  const initialBalance = DEFAULT_INITIAL_BALANCE;

  if (!name || !phone || !email || !password) {
    throw new BankingError(
      400,
      "Nombre, telefono, correo y contrasena son requeridos",
    );
  }

  if (password.length < 8) {
    throw new BankingError(
      400,
      "La contrasena debe tener al menos 8 caracteres",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const session = await mongoose.startSession();
  let createdClient;
  let createdAccount;

  try {
    await session.withTransaction(async () => {
      const existingClient = await Client.findOne({ email }).session(session);

      if (existingClient) {
        throw new BankingError(409, "Ya existe un cliente con ese correo");
      }

      const counter = await Counter.findOneAndUpdate(
        { name: "account" },
        { $inc: { seq: 1 } },
        { returnDocument: "after", upsert: true, session },
      );
      const accountNumber = generateAccountNumber(counter.seq);

      [createdClient] = await Client.create(
        [
          {
            name,
            phone,
            email,
            passwordHash,
            accountNumber,
            accountSequence: counter.seq,
          },
        ],
        { session, ordered: true },
      );

      [createdAccount] = await Account.create(
        [
          {
            accountNumber,
            owner: createdClient._id,
            accountType: "ahorro",
            balance: roundAmount(initialBalance),
            openedAt: new Date(),
            active: true,
          },
        ],
        { session, ordered: true },
      );

      await Transaction.create(
        [
          {
            accountNumber,
            type: "deposit",
            amount: roundAmount(initialBalance),
            resultingBalance: roundAmount(initialBalance),
            date: new Date(),
            description: "Saldo inicial de apertura",
            destinationAccount: accountNumber,
          },
        ],
        { session, ordered: true },
      );

      await writeAuditLog(
        {
          user: createdClient._id,
          accountNumber,
          action: "registro_cliente",
          status: "exitoso",
          detail: { email },
          req,
          session,
        },
      );
    });
  } catch (error) {
    const duplicateError = mapDuplicateError(error);
    throw duplicateError || error;
  } finally {
    await session.endSession();
  }

  return {
    token: createToken(createdClient),
    user: toClientPayload(createdClient),
    account: {
      accountNumber: createdAccount.accountNumber,
      accountType: createdAccount.accountType,
      balance: createdAccount.balance,
      openedAt: createdAccount.openedAt,
      active: createdAccount.active,
    },
  };
}

async function loginClient(payload, { req } = {}) {
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    throw new BankingError(400, "Correo y contrasena son requeridos");
  }

  const client = await Client.findOne({ email });

  if (!client) {
    await writeAuditLog({
      action: "login_fallido",
      status: "fallido",
      detail: { email, reason: "cliente_no_encontrado" },
      req,
    });
    throw new BankingError(401, "Credenciales invalidas");
  }

  const passwordMatches = await bcrypt.compare(password, client.passwordHash);

  if (!passwordMatches) {
    await writeAuditLog({
      user: client._id,
      accountNumber: client.accountNumber,
      action: "login_fallido",
      status: "fallido",
      detail: { email, reason: "contrasena_incorrecta" },
      req,
    });
    throw new BankingError(401, "Credenciales invalidas");
  }

  await writeAuditLog({
    user: client._id,
    accountNumber: client.accountNumber,
    action: "login_exitoso",
    status: "exitoso",
    detail: { email },
    req,
  });

  const account = await Account.findOne({ owner: client._id }).lean();

  return {
    token: createToken(client),
    user: toClientPayload(client),
    account,
  };
}

async function getClientByToken(authHeader) {
  const [scheme, token] = String(authHeader || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new BankingError(401, "Token de autenticacion requerido");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const client = await Client.findById(payload.sub);

    if (!client) {
      throw new BankingError(401, "Sesion invalida");
    }

    return client;
  } catch (error) {
    if (error instanceof BankingError) {
      throw error;
    }

    throw new BankingError(401, "Sesion expirada o invalida");
  }
}

async function getDashboard(client) {
  const [account, transactions, beneficiaries, auditLogs] = await Promise.all([
    Account.findOne({ owner: client._id }).lean(),
    Transaction.find({ accountNumber: client.accountNumber })
      .sort({ date: -1 })
      .limit(50)
      .lean(),
    Beneficiary.find({ owner: client._id }).sort({ createdAt: -1 }).lean(),
    AuditLog.find({ user: client._id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return {
    user: toClientPayload(client),
    account,
    transactions: transactions.map(serializeTransaction),
    beneficiaries: beneficiaries.map(serializeBeneficiary),
    auditLogs,
  };
}

async function updateProfile(client, payload, { req } = {}) {
  const update = {};

  if (payload.name !== undefined) {
    const name = normalizeText(payload.name);

    if (!name) {
      throw new BankingError(400, "El nombre no puede quedar vacio");
    }

    update.name = name;
  }

  if (payload.phone !== undefined) {
    const phone = normalizeText(payload.phone);

    if (!phone) {
      throw new BankingError(400, "El telefono no puede quedar vacio");
    }

    update.phone = phone;
  }

  if (payload.accountNumber !== undefined) {
    throw new BankingError(400, "El numero de cuenta no puede editarse");
  }

  const updatedClient = await Client.findByIdAndUpdate(client._id, update, {
    returnDocument: "after",
    runValidators: true,
  });

  await writeAuditLog({
    user: client._id,
    accountNumber: client.accountNumber,
    action: "actualizacion_perfil",
    status: "exitoso",
    detail: { fields: Object.keys(update) },
    req,
  });

  return toClientPayload(updatedClient);
}

async function createBeneficiary(client, payload, { req } = {}) {
  const accountNumber = validateAccountNumber(payload.accountNumber);
  let alias = normalizeText(payload.alias);

  if (accountNumber === client.accountNumber) {
    throw new BankingError(400, "No puedes registrar tu propia cuenta");
  }

  const destinationAccount = await Account.findOne({ accountNumber })
    .populate("owner", "name")
    .lean();

  if (!destinationAccount || !destinationAccount.active) {
    await writeAuditLog({
      user: client._id,
      accountNumber: client.accountNumber,
      action: "alta_cuenta_destino",
      status: "fallido",
      detail: { destinationAccount: accountNumber, reason: "cuenta_invalida" },
      req,
    });
    throw new BankingError(404, "La cuenta destino no existe o esta inactiva");
  }

  const holderName = destinationAccount.owner?.name || "Titular Banco Nexus";

  if (!alias) {
    alias = holderName;
  }

  try {
    const beneficiary = await Beneficiary.create({
      owner: client._id,
      accountNumber,
      alias,
      holderName,
    });

    await writeAuditLog({
      user: client._id,
      accountNumber: client.accountNumber,
      action: "alta_cuenta_destino",
      status: "exitoso",
      detail: { destinationAccount: accountNumber, alias },
      req,
    });

    return serializeBeneficiary(beneficiary);
  } catch (error) {
    const duplicateError = mapDuplicateError(error);

    if (duplicateError) {
      throw duplicateError;
    }

    throw error;
  }
}

async function writeTransferFailureAudit({
  client,
  destinationAccount,
  beneficiaryId,
  amount,
  message,
  reason,
  req,
}) {
  await writeAuditLog({
    user: client._id,
    accountNumber: client.accountNumber,
    action: "transferencia_rechazada",
    status: "fallido",
    detail: {
      sourceAccount: client.accountNumber,
      destinationAccount: destinationAccount || null,
      beneficiaryId: beneficiaryId || null,
      amount: Number.isFinite(amount) ? amount : null,
      message,
      reason,
    },
    req,
  }).catch((auditError) => {
    console.error("No se pudo registrar auditoria fallida:", auditError.message);
  });
}

async function executeTransfer(client, payload, { req } = {}) {
  let amount = Number(payload.amount);
  const message = normalizeText(payload.message) || "Transferencia Banco Nexus";
  const beneficiaryId = normalizeText(payload.beneficiaryId);
  let destinationAccountNumber = normalizeText(payload.destinationAccountNumber);
  let destinationNumber = destinationAccountNumber;
  let session;
  let transferResult;

  try {
    amount = assertPositiveAmount(payload.amount);

    if (beneficiaryId) {
      if (!mongoose.Types.ObjectId.isValid(beneficiaryId)) {
        throw new BankingError(400, "Cuenta destino registrada invalida");
      }

      const beneficiary = await Beneficiary.findOne({
        _id: beneficiaryId,
        owner: client._id,
      }).lean();

      if (!beneficiary) {
        throw new BankingError(404, "La cuenta destino registrada no existe");
      }

      destinationAccountNumber = beneficiary.accountNumber;
    }

    destinationNumber = validateAccountNumber(destinationAccountNumber);

    if (destinationNumber === client.accountNumber) {
      throw new BankingError(400, "No puedes transferir a tu propia cuenta");
    }

    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const originAccount = await Account.findOne({
        owner: client._id,
        active: true,
      }).session(session);
      const destinationAccount = await Account.findOne({
        accountNumber: destinationNumber,
        active: true,
      }).session(session);

      if (!originAccount) {
        throw new BankingError(404, "Cuenta origen no encontrada");
      }

      if (!destinationAccount) {
        throw new BankingError(404, "Cuenta destino no encontrada");
      }

      if (originAccount.balance < amount) {
        throw new BankingError(400, "Saldo insuficiente");
      }

      const debitResult = await Account.updateOne(
        {
          _id: originAccount._id,
          active: true,
          balance: { $gte: amount },
        },
        { $inc: { balance: -amount } },
        { session },
      );

      if (debitResult.matchedCount !== 1) {
        throw new BankingError(400, "Saldo insuficiente");
      }

      await Account.updateOne(
        { _id: destinationAccount._id, active: true },
        { $inc: { balance: amount } },
        { session },
      );

      const updatedOrigin = await Account.findById(originAccount._id)
        .session(session)
        .lean();
      const updatedDestination = await Account.findById(destinationAccount._id)
        .session(session)
        .lean();
      const transferId = new mongoose.Types.ObjectId();
      const now = new Date();

      const [debitTransaction, creditTransaction] = await Transaction.create(
        [
          {
            accountNumber: updatedOrigin.accountNumber,
            type: "transfer_out",
            amount,
            resultingBalance: roundAmount(updatedOrigin.balance),
            date: now,
            description: message,
            sourceAccount: updatedOrigin.accountNumber,
            destinationAccount: updatedDestination.accountNumber,
            transferId,
          },
          {
            accountNumber: updatedDestination.accountNumber,
            type: "transfer_in",
            amount,
            resultingBalance: roundAmount(updatedDestination.balance),
            date: now,
            description: `Transferencia recibida: ${message}`,
            sourceAccount: updatedOrigin.accountNumber,
            destinationAccount: updatedDestination.accountNumber,
            transferId,
          },
        ],
        { session, ordered: true },
      );

      await writeAuditLog(
        {
          user: client._id,
          accountNumber: client.accountNumber,
          action: "transferencia_aprobada",
          status: "exitoso",
          detail: {
            sourceAccount: updatedOrigin.accountNumber,
            destinationAccount: updatedDestination.accountNumber,
            amount,
            transferId: String(transferId),
            message,
          },
          req,
          session,
        },
      );

      transferResult = {
        transferId: String(transferId),
        message: "Transferencia realizada con exito",
        amount,
        sourceAccount: updatedOrigin.accountNumber,
        destinationAccount: updatedDestination.accountNumber,
        previousBalance: roundAmount(originAccount.balance),
        newBalance: roundAmount(updatedOrigin.balance),
        destinationBalance: roundAmount(updatedDestination.balance),
        transaction: serializeTransaction(debitTransaction),
        counterpartyTransaction: serializeTransaction(creditTransaction),
      };
    });
  } catch (error) {
    if (error instanceof BankingError) {
      await writeTransferFailureAudit({
        client,
        destinationAccount: destinationNumber,
        beneficiaryId,
        amount,
        message,
        reason: error.message,
        req,
      });
      throw error;
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }

  return transferResult;
}

module.exports = {
  ACCOUNT_NUMBER_REGEX,
  ACCOUNT_PREFIX,
  BankingError,
  assertPositiveAmount,
  calculateCheckDigit,
  createBeneficiary,
  executeTransfer,
  generateAccountNumber,
  getClientByToken,
  getDashboard,
  loginClient,
  registerClient,
  roundAmount,
  serializeBeneficiary,
  serializeTransaction,
  updateProfile,
  validateAccountNumber,
  writeAuditLog,
};
