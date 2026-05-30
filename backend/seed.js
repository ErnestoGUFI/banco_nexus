// Banco Nexus - datos deterministas para desarrollo local.

const bcrypt = require("bcryptjs");

const { close, connect } = require("./src/db");
const {
  Account,
  AuditLog,
  Beneficiary,
  Client,
  Counter,
  Transaction,
} = require("./src/models");
const { generateAccountNumber, roundAmount } = require("./src/banking");

const seedClients = [
  {
    name: "Ana Gabriela Ruiz Mendoza",
    phone: "5551001001",
    email: "ana.ruiz@email.com",
    password: "Banco123!",
    balance: 18750.45,
  },
  {
    name: "Luis Alberto Perez Torres",
    phone: "5551001002",
    email: "luis.perez@email.com",
    password: "Banco123!",
    balance: 32400,
  },
  {
    name: "Maria Fernanda Lopez Garcia",
    phone: "5551001003",
    email: "mf.lopez@email.com",
    password: "Banco123!",
    balance: 12890.75,
  },
  {
    name: "Carlos Eduardo Martinez Soto",
    phone: "5551001004",
    email: "carlos.martinez@email.com",
    password: "Banco123!",
    balance: 45620.1,
  },
];

async function seed() {
  await connect();

  await Promise.all([
    Account.deleteMany({}),
    AuditLog.deleteMany({}),
    Beneficiary.deleteMany({}),
    Client.deleteMany({}),
    Counter.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  const insertedClients = [];

  for (let index = 0; index < seedClients.length; index += 1) {
    const source = seedClients[index];
    const sequence = index + 1;
    const accountNumber = generateAccountNumber(sequence);
    const passwordHash = await bcrypt.hash(source.password, 12);
    const [client] = await Client.create([
      {
        name: source.name,
        phone: source.phone,
        email: source.email,
        passwordHash,
        accountNumber,
        accountSequence: sequence,
      },
    ]);

    await Account.create({
      accountNumber,
      owner: client._id,
      accountType: "ahorro",
      balance: roundAmount(source.balance),
      openedAt: new Date("2026-05-01T10:00:00.000Z"),
      active: true,
    });

    await Transaction.create({
      accountNumber,
      type: "deposit",
      amount: roundAmount(source.balance),
      resultingBalance: roundAmount(source.balance),
      date: new Date("2026-05-01T10:10:00.000Z"),
      description: "Saldo inicial de prueba",
      destinationAccount: accountNumber,
    });

    await AuditLog.create({
      user: client._id,
      accountNumber,
      action: "seed_cliente",
      status: "exitoso",
      detail: { email: source.email },
    });

    insertedClients.push(client);
  }

  await Counter.create({ name: "account", seq: seedClients.length });

  await Beneficiary.create({
    owner: insertedClients[0]._id,
    accountNumber: insertedClients[1].accountNumber,
    alias: "Luis - renta",
    holderName: insertedClients[1].name,
  });

  await Beneficiary.create({
    owner: insertedClients[1]._id,
    accountNumber: insertedClients[0].accountNumber,
    alias: "Ana - ahorro",
    holderName: insertedClients[0].name,
  });

  console.log("Seed completado.");
  console.table(
    insertedClients.map((client) => ({
      nombre: client.name,
      email: client.email,
      password: "Banco123!",
      cuenta: client.accountNumber,
    })),
  );
}

seed()
  .catch((error) => {
    console.error("Error al cargar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await close();
  });
