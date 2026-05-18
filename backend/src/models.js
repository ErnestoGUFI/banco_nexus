const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    curp: { type: String, required: true, unique: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
  },
  {
    collection: "clientes",
    versionKey: false,
  },
);

const accountSchema = new mongoose.Schema(
  {
    cuenta: { type: String, required: true, unique: true, trim: true },
    cliente: { type: String, required: true, trim: true },
    tipo: { type: String, required: true, trim: true },
    saldo: { type: Number, required: true },
    fechaApertura: { type: Date, required: true },
    activa: { type: Boolean, default: true },
  },
  {
    collection: "cuentas",
    versionKey: false,
  },
);

const transactionSchema = new mongoose.Schema(
  {
    cuenta: { type: String, required: true, trim: true, index: true },
    tipo: { type: String, required: true, trim: true },
    monto: { type: Number, required: true },
    saldoResultante: { type: Number, required: true },
    fecha: { type: Date, required: true },
    descripcion: { type: String, required: true, trim: true },
    sucursal: { type: String, default: "CDMX", trim: true },
  },
  {
    collection: "transacciones",
    versionKey: false,
  },
);

accountSchema.index({ cliente: 1 });
transactionSchema.index({ fecha: -1 });

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
