const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    accountNumber: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      unique: true,
    },
    accountSequence: {
      type: Number,
      required: true,
      immutable: true,
      unique: true,
    },
  },
  {
    collection: "clients",
    timestamps: true,
    versionKey: false,
  },
);

const accountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      unique: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    accountType: { type: String, required: true, trim: true, default: "ahorro" },
    balance: { type: Number, required: true },
    openedAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  {
    collection: "accounts",
    versionKey: false,
  },
);

const transactionSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    resultingBalance: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    sourceAccount: { type: String, trim: true, index: true },
    destinationAccount: { type: String, trim: true, index: true },
    transferId: { type: mongoose.Schema.Types.ObjectId, index: true },
    branch: { type: String, default: "CDMX", trim: true },
  },
  {
    collection: "transactions",
    versionKey: false,
  },
);

const beneficiarySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    accountNumber: { type: String, required: true, trim: true },
    alias: { type: String, required: true, trim: true },
    holderName: { type: String, required: true, trim: true },
  },
  {
    collection: "beneficiaries",
    timestamps: true,
    versionKey: false,
  },
);

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Client", index: true },
    accountNumber: { type: String, trim: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["exitoso", "fallido", "pendiente"],
      required: true,
      index: true,
    },
    detail: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    collection: "audit_logs",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    seq: { type: Number, required: true, default: 0 },
  },
  {
    collection: "counters",
    versionKey: false,
  },
);

beneficiarySchema.index({ owner: 1, accountNumber: 1 }, { unique: true });
beneficiarySchema.index({ owner: 1, alias: 1 }, { unique: true });
transactionSchema.index({ date: -1 });
transactionSchema.index({ accountNumber: 1, date: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

const Client =
  mongoose.models.Client || mongoose.model("Client", clientSchema);
const Account =
  mongoose.models.Account || mongoose.model("Account", accountSchema);
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
const Beneficiary =
  mongoose.models.Beneficiary ||
  mongoose.model("Beneficiary", beneficiarySchema);
const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

module.exports = {
  Client,
  Account,
  Transaction,
  Beneficiary,
  AuditLog,
  Counter,
};
