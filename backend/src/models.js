const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    curp: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
  },
  {
    collection: "clients",
    versionKey: false,
  },
);

const accountSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, required: true, unique: true, trim: true },
    client: { type: String, required: true, trim: true },
    accountType: { type: String, required: true, trim: true },
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
    branch: { type: String, default: "CDMX", trim: true },
  },
  {
    collection: "transactions",
    versionKey: false,
  },
);

accountSchema.index({ client: 1 });
transactionSchema.index({ date: -1 });

const Client =
  mongoose.models.Client || mongoose.model("Client", clientSchema);
const Account =
  mongoose.models.Account || mongoose.model("Account", accountSchema);
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

module.exports = {
  Client,
  Account,
  Transaction,
};
