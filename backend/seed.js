// Banco Nexus - deterministic MongoDB seed script.

const { close, connect } = require("./src/db");
const { Client, Account, Transaction } = require("./src/models");
const { serializeTransaction } = require("./transactions");

const clients = [
  new Client({
    name: "Ana Gabriela Ruiz Mendoza",
    curp: "RUMA900101MDFXXX01",
    phone: "5551001001",
    email: "ana.ruiz@email.com",
  }),
  new Client({
    name: "Luis Alberto Pérez Torres",
    curp: "PETL850203HDFXXX02",
    phone: "5551001002",
    email: "luis.perez@email.com",
  }),
  new Client({
    name: "María Fernanda López García",
    curp: "LOGM920515MDFXXX03",
    phone: "5551001003",
    email: "mf.lopez@email.com",
  }),
  new Client({
    name: "Carlos Eduardo Martínez Soto",
    curp: "MASC880714HDFXXX04",
    phone: "5551001004",
    email: "carlos.martinez@email.com",
  }),
  new Client({
    name: "Sofía Alejandra Hernández Cruz",
    curp: "HECS950320MDFXXX05",
    phone: "5551001005",
    email: "sofia.hernandez@email.com",
  }),
  new Client({
    name: "Jorge Antonio Ramírez Vega",
    curp: "RAVJ791108HDFXXX06",
    phone: "5551001006",
    email: "jorge.ramirez@email.com",
  }),
  new Client({
    name: "Valentina Torres Jiménez",
    curp: "TOJV010630MDFXXX07",
    phone: "5551001007",
    email: "valentina.torres@email.com",
  }),
  new Client({
    name: "Roberto Carlos Díaz Fuentes",
    curp: "DIFR830922HDFXXX08",
    phone: "5551001008",
    email: "roberto.diaz@email.com",
  }),
  new Client({
    name: "Paola Itzel Morales Castillo",
    curp: "MOCP961215MDFXXX09",
    phone: "5551001009",
    email: "paola.morales@email.com",
  }),
  new Client({
    name: "Alejandro Gutiérrez Navarro",
    curp: "GUNA870417HDFXXX10",
    phone: "5551001010",
    email: "alejandro.gutierrez@email.com",
  }),
  new Client({
    name: "Isabella Vargas Reyes",
    curp: "VARI030825MDFXXX11",
    phone: "5551001011",
    email: "isabella.vargas@email.com",
  }),
  new Client({
    name: "Miguel Ángel Flores Ortega",
    curp: "FLOM910602HDFXXX12",
    phone: "5551001012",
    email: "miguel.flores@email.com",
  }),
  new Client({
    name: "Daniela Ruiz Santana",
    curp: "RUSD000118MDFXXX13",
    phone: "5551001013",
    email: "daniela.ruiz@email.com",
  }),
  new Client({
    name: "Eduardo Salinas Bravo",
    curp: "SABE761130HDFXXX14",
    phone: "5551001014",
    email: "eduardo.salinas@email.com",
  }),
  new Client({
    name: "Camila Estrada Medina",
    curp: "ESMC040303MDFXXX15",
    phone: "5551001015",
    email: "camila.estrada@email.com",
  }),
];

const accounts = [
  new Account({
    accountNumber: "1000000001",
    client: "RUMA900101MDFXXX01",
    accountType: "ahorro",
    balance: 18750.45,
    openedAt: new Date("2024-01-15T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000002",
    client: "PETL850203HDFXXX02",
    accountType: "corriente",
    balance: 32400.0,
    openedAt: new Date("2023-09-02T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000003",
    client: "LOGM920515MDFXXX03",
    accountType: "nómina",
    balance: 12890.75,
    openedAt: new Date("2024-03-19T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000004",
    client: "MASC880714HDFXXX04",
    accountType: "ahorro",
    balance: 45620.1,
    openedAt: new Date("2022-11-08T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000005",
    client: "HECS950320MDFXXX05",
    accountType: "corriente",
    balance: 9850.5,
    openedAt: new Date("2023-06-27T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000006",
    client: "RAVJ791108HDFXXX06",
    accountType: "nómina",
    balance: 27610.25,
    openedAt: new Date("2024-05-04T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000007",
    client: "TOJV010630MDFXXX07",
    accountType: "ahorro",
    balance: 15120.0,
    openedAt: new Date("2023-12-12T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000008",
    client: "DIFR830922HDFXXX08",
    accountType: "corriente",
    balance: 38990.35,
    openedAt: new Date("2022-08-21T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000009",
    client: "MOCP961215MDFXXX09",
    accountType: "nómina",
    balance: 22175.8,
    openedAt: new Date("2024-02-01T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000010",
    client: "GUNA870417HDFXXX10",
    accountType: "ahorro",
    balance: 50600.0,
    openedAt: new Date("2023-04-18T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000011",
    client: "VARI030825MDFXXX11",
    accountType: "corriente",
    balance: 7340.2,
    openedAt: new Date("2024-07-09T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000012",
    client: "FLOM910602HDFXXX12",
    accountType: "nómina",
    balance: 19480.6,
    openedAt: new Date("2023-01-30T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000013",
    client: "RUSD000118MDFXXX13",
    accountType: "ahorro",
    balance: 11325.9,
    openedAt: new Date("2024-06-14T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000014",
    client: "SABE761130HDFXXX14",
    accountType: "corriente",
    balance: 41780.45,
    openedAt: new Date("2022-10-05T10:00:00.000Z"),
  }),
  new Account({
    accountNumber: "1000000015",
    client: "ESMC040303MDFXXX15",
    accountType: "nómina",
    balance: 16840.3,
    openedAt: new Date("2024-04-23T10:00:00.000Z"),
  }),
];

const transactions = [
  new Transaction({
    accountNumber: "1000000001",
    type: "deposit",
    amount: 12000.0,
    resultingBalance: 12000.0,
    date: new Date("2024-01-15T10:30:00.000Z"),
    description: "Depósito inicial",
  }),
  new Transaction({
    accountNumber: "1000000001",
    type: "deposit",
    amount: 5500.45,
    resultingBalance: 17500.45,
    date: new Date("2024-02-10T12:00:00.000Z"),
    description: "Depósito en ventanilla",
  }),
  new Transaction({
    accountNumber: "1000000001",
    type: "withdrawal",
    amount: 1250.0,
    resultingBalance: 16250.45,
    date: new Date("2024-03-04T18:20:00.000Z"),
    description: "Retiro en cajero",
  }),
  new Transaction({
    accountNumber: "1000000001",
    type: "deposit",
    amount: 2500.0,
    resultingBalance: 18750.45,
    date: new Date("2024-04-22T09:15:00.000Z"),
    description: "Transferencia recibida",
  }),
  new Transaction({
    accountNumber: "1000000002",
    type: "deposit",
    amount: 30000.0,
    resultingBalance: 30000.0,
    date: new Date("2023-09-02T10:30:00.000Z"),
    description: "Depósito inicial",
  }),
  new Transaction({
    accountNumber: "1000000002",
    type: "deposit",
    amount: 5600.0,
    resultingBalance: 35600.0,
    date: new Date("2023-10-11T15:45:00.000Z"),
    description: "Depósito en ventanilla",
  }),
  new Transaction({
    accountNumber: "1000000002",
    type: "withdrawal",
    amount: 3200.0,
    resultingBalance: 32400.0,
    date: new Date("2023-11-17T11:05:00.000Z"),
    description: "Retiro en cajero",
  }),
  new Transaction({
    accountNumber: "1000000003",
    type: "deposit",
    amount: 11000.0,
    resultingBalance: 11000.0,
    date: new Date("2024-03-19T10:30:00.000Z"),
    description: "Depósito inicial",
  }),
  new Transaction({
    accountNumber: "1000000003",
    type: "deposit",
    amount: 2890.75,
    resultingBalance: 13890.75,
    date: new Date("2024-04-01T13:20:00.000Z"),
    description: "Pago de nómina",
  }),
  new Transaction({
    accountNumber: "1000000003",
    type: "withdrawal",
    amount: 1000.0,
    resultingBalance: 12890.75,
    date: new Date("2024-04-15T17:10:00.000Z"),
    description: "Retiro en cajero",
  }),
  new Transaction({
    accountNumber: "1000000004",
    type: "deposit",
    amount: 42000.0,
    resultingBalance: 42000.0,
    date: new Date("2022-11-08T10:30:00.000Z"),
    description: "Depósito inicial",
  }),
  new Transaction({
    accountNumber: "1000000004",
    type: "deposit",
    amount: 5120.1,
    resultingBalance: 47120.1,
    date: new Date("2023-01-10T14:00:00.000Z"),
    description: "Depósito en ventanilla",
  }),
  new Transaction({
    accountNumber: "1000000004",
    type: "withdrawal",
    amount: 1500.0,
    resultingBalance: 45620.1,
    date: new Date("2023-02-03T16:25:00.000Z"),
    description: "Retiro en cajero",
  }),
  new Transaction({
    accountNumber: "1000000005",
    type: "deposit",
    amount: 9000.0,
    resultingBalance: 9000.0,
    date: new Date("2023-06-27T10:30:00.000Z"),
    description: "Depósito inicial",
  }),
  new Transaction({
    accountNumber: "1000000005",
    type: "deposit",
    amount: 1350.5,
    resultingBalance: 10350.5,
    date: new Date("2023-07-08T11:40:00.000Z"),
    description: "Transferencia recibida",
  }),
  new Transaction({
    accountNumber: "1000000005",
    type: "withdrawal",
    amount: 500.0,
    resultingBalance: 9850.5,
    date: new Date("2023-08-09T19:30:00.000Z"),
    description: "Retiro en cajero",
  }),
  new Transaction({
    accountNumber: "1000000006",
    type: "deposit",
    amount: 25000.0,
    resultingBalance: 25000.0,
    date: new Date("2024-05-04T10:30:00.000Z"),
    description: "Depósito inicial",
  }),
  new Transaction({
    accountNumber: "1000000006",
    type: "deposit",
    amount: 3110.25,
    resultingBalance: 28110.25,
    date: new Date("2024-05-15T08:45:00.000Z"),
    description: "Pago de nómina",
  }),
  new Transaction({
    accountNumber: "1000000006",
    type: "withdrawal",
    amount: 500.0,
    resultingBalance: 27610.25,
    date: new Date("2024-05-29T20:05:00.000Z"),
    description: "Retiro en cajero",
  }),
];

async function clearCollections() {
  await Client.deleteMany({});
  await Account.deleteMany({});
  await Transaction.deleteMany({});
}

async function insertSeedData() {
  const insertedClients = await Client.insertMany(clients);
  const insertedAccounts = await Account.insertMany(accounts);
  const insertedTransactions = await Transaction.insertMany(
    transactions.map(serializeTransaction),
  );

  return {
    clients: insertedClients.length,
    accounts: insertedAccounts.length,
    transactions: insertedTransactions.length,
  };
}

async function createIndexes() {
  await Client.syncIndexes();
  await Account.syncIndexes();
  await Transaction.syncIndexes();
}

function printSummary(insertedCounts) {
  console.log("\nBanco Nexus seed completed.");
  console.log(`Clientes insertados: ${insertedCounts.clients}`);
  console.log(`Cuentas insertadas: ${insertedCounts.accounts}`);
  console.log(`Transacciones insertadas: ${insertedCounts.transactions}`);
  console.log("\nCuentas de prueba:");
  accounts.forEach((account) => {
    const client = clients.find((item) => item.curp === account.client);
    console.log(
      `  ${account.accountNumber} | ${client.name.padEnd(38)} | $${account.balance.toFixed(2)}`,
    );
  });
}

async function seedDatabase() {
  try {
    await connect();

    await clearCollections();
    console.log("Collections cleared.");

    const insertedCounts = await insertSeedData();
    await createIndexes();
    console.log("Indexes created.");

    printSummary(insertedCounts);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await close();
    console.log("\nMongoDB connection closed.");
  }
}

seedDatabase();
