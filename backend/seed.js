// Banco Nexus - deterministic MongoDB seed script.

const { close, connect } = require("./src/db");
const { Client, Account, Transaction } = require("./src/models");
const { serializeTransaction } = require("./transactions");

const clients = [
  new Client({
    nombre: "Ana Gabriela Ruiz Mendoza",
    curp: "RUMA900101MDFXXX01",
    telefono: "5551001001",
    email: "ana.ruiz@email.com",
  }),
  new Client({
    nombre: "Luis Alberto Pérez Torres",
    curp: "PETL850203HDFXXX02",
    telefono: "5551001002",
    email: "luis.perez@email.com",
  }),
  new Client({
    nombre: "María Fernanda López García",
    curp: "LOGM920515MDFXXX03",
    telefono: "5551001003",
    email: "mf.lopez@email.com",
  }),
  new Client({
    nombre: "Carlos Eduardo Martínez Soto",
    curp: "MASC880714HDFXXX04",
    telefono: "5551001004",
    email: "carlos.martinez@email.com",
  }),
  new Client({
    nombre: "Sofía Alejandra Hernández Cruz",
    curp: "HECS950320MDFXXX05",
    telefono: "5551001005",
    email: "sofia.hernandez@email.com",
  }),
  new Client({
    nombre: "Jorge Antonio Ramírez Vega",
    curp: "RAVJ791108HDFXXX06",
    telefono: "5551001006",
    email: "jorge.ramirez@email.com",
  }),
  new Client({
    nombre: "Valentina Torres Jiménez",
    curp: "TOJV010630MDFXXX07",
    telefono: "5551001007",
    email: "valentina.torres@email.com",
  }),
  new Client({
    nombre: "Roberto Carlos Díaz Fuentes",
    curp: "DIFR830922HDFXXX08",
    telefono: "5551001008",
    email: "roberto.diaz@email.com",
  }),
  new Client({
    nombre: "Paola Itzel Morales Castillo",
    curp: "MOCP961215MDFXXX09",
    telefono: "5551001009",
    email: "paola.morales@email.com",
  }),
  new Client({
    nombre: "Alejandro Gutiérrez Navarro",
    curp: "GUNA870417HDFXXX10",
    telefono: "5551001010",
    email: "alejandro.gutierrez@email.com",
  }),
  new Client({
    nombre: "Isabella Vargas Reyes",
    curp: "VARI030825MDFXXX11",
    telefono: "5551001011",
    email: "isabella.vargas@email.com",
  }),
  new Client({
    nombre: "Miguel Ángel Flores Ortega",
    curp: "FLOM910602HDFXXX12",
    telefono: "5551001012",
    email: "miguel.flores@email.com",
  }),
  new Client({
    nombre: "Daniela Ruiz Santana",
    curp: "RUSD000118MDFXXX13",
    telefono: "5551001013",
    email: "daniela.ruiz@email.com",
  }),
  new Client({
    nombre: "Eduardo Salinas Bravo",
    curp: "SABE761130HDFXXX14",
    telefono: "5551001014",
    email: "eduardo.salinas@email.com",
  }),
  new Client({
    nombre: "Camila Estrada Medina",
    curp: "ESMC040303MDFXXX15",
    telefono: "5551001015",
    email: "camila.estrada@email.com",
  }),
];

const accounts = [
  new Account({
    cuenta: "1000000001",
    cliente: "RUMA900101MDFXXX01",
    tipo: "ahorro",
    saldo: 18750.45,
    fechaApertura: new Date("2024-01-15T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000002",
    cliente: "PETL850203HDFXXX02",
    tipo: "corriente",
    saldo: 32400.0,
    fechaApertura: new Date("2023-09-02T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000003",
    cliente: "LOGM920515MDFXXX03",
    tipo: "nómina",
    saldo: 12890.75,
    fechaApertura: new Date("2024-03-19T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000004",
    cliente: "MASC880714HDFXXX04",
    tipo: "ahorro",
    saldo: 45620.1,
    fechaApertura: new Date("2022-11-08T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000005",
    cliente: "HECS950320MDFXXX05",
    tipo: "corriente",
    saldo: 9850.5,
    fechaApertura: new Date("2023-06-27T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000006",
    cliente: "RAVJ791108HDFXXX06",
    tipo: "nómina",
    saldo: 27610.25,
    fechaApertura: new Date("2024-05-04T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000007",
    cliente: "TOJV010630MDFXXX07",
    tipo: "ahorro",
    saldo: 15120.0,
    fechaApertura: new Date("2023-12-12T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000008",
    cliente: "DIFR830922HDFXXX08",
    tipo: "corriente",
    saldo: 38990.35,
    fechaApertura: new Date("2022-08-21T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000009",
    cliente: "MOCP961215MDFXXX09",
    tipo: "nómina",
    saldo: 22175.8,
    fechaApertura: new Date("2024-02-01T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000010",
    cliente: "GUNA870417HDFXXX10",
    tipo: "ahorro",
    saldo: 50600.0,
    fechaApertura: new Date("2023-04-18T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000011",
    cliente: "VARI030825MDFXXX11",
    tipo: "corriente",
    saldo: 7340.2,
    fechaApertura: new Date("2024-07-09T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000012",
    cliente: "FLOM910602HDFXXX12",
    tipo: "nómina",
    saldo: 19480.6,
    fechaApertura: new Date("2023-01-30T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000013",
    cliente: "RUSD000118MDFXXX13",
    tipo: "ahorro",
    saldo: 11325.9,
    fechaApertura: new Date("2024-06-14T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000014",
    cliente: "SABE761130HDFXXX14",
    tipo: "corriente",
    saldo: 41780.45,
    fechaApertura: new Date("2022-10-05T10:00:00.000Z"),
  }),
  new Account({
    cuenta: "1000000015",
    cliente: "ESMC040303MDFXXX15",
    tipo: "nómina",
    saldo: 16840.3,
    fechaApertura: new Date("2024-04-23T10:00:00.000Z"),
  }),
];

const transactions = [
  new Transaction({
    cuenta: "1000000001",
    tipo: "deposito",
    monto: 12000.0,
    saldoResultante: 12000.0,
    fecha: new Date("2024-01-15T10:30:00.000Z"),
    descripcion: "Depósito inicial",
  }),
  new Transaction({
    cuenta: "1000000001",
    tipo: "deposito",
    monto: 5500.45,
    saldoResultante: 17500.45,
    fecha: new Date("2024-02-10T12:00:00.000Z"),
    descripcion: "Depósito en ventanilla",
  }),
  new Transaction({
    cuenta: "1000000001",
    tipo: "retiro",
    monto: 1250.0,
    saldoResultante: 16250.45,
    fecha: new Date("2024-03-04T18:20:00.000Z"),
    descripcion: "Retiro en cajero",
  }),
  new Transaction({
    cuenta: "1000000001",
    tipo: "deposito",
    monto: 2500.0,
    saldoResultante: 18750.45,
    fecha: new Date("2024-04-22T09:15:00.000Z"),
    descripcion: "Transferencia recibida",
  }),
  new Transaction({
    cuenta: "1000000002",
    tipo: "deposito",
    monto: 30000.0,
    saldoResultante: 30000.0,
    fecha: new Date("2023-09-02T10:30:00.000Z"),
    descripcion: "Depósito inicial",
  }),
  new Transaction({
    cuenta: "1000000002",
    tipo: "deposito",
    monto: 5600.0,
    saldoResultante: 35600.0,
    fecha: new Date("2023-10-11T15:45:00.000Z"),
    descripcion: "Depósito en ventanilla",
  }),
  new Transaction({
    cuenta: "1000000002",
    tipo: "retiro",
    monto: 3200.0,
    saldoResultante: 32400.0,
    fecha: new Date("2023-11-17T11:05:00.000Z"),
    descripcion: "Retiro en cajero",
  }),
  new Transaction({
    cuenta: "1000000003",
    tipo: "deposito",
    monto: 11000.0,
    saldoResultante: 11000.0,
    fecha: new Date("2024-03-19T10:30:00.000Z"),
    descripcion: "Depósito inicial",
  }),
  new Transaction({
    cuenta: "1000000003",
    tipo: "deposito",
    monto: 2890.75,
    saldoResultante: 13890.75,
    fecha: new Date("2024-04-01T13:20:00.000Z"),
    descripcion: "Pago de nómina",
  }),
  new Transaction({
    cuenta: "1000000003",
    tipo: "retiro",
    monto: 1000.0,
    saldoResultante: 12890.75,
    fecha: new Date("2024-04-15T17:10:00.000Z"),
    descripcion: "Retiro en cajero",
  }),
  new Transaction({
    cuenta: "1000000004",
    tipo: "deposito",
    monto: 42000.0,
    saldoResultante: 42000.0,
    fecha: new Date("2022-11-08T10:30:00.000Z"),
    descripcion: "Depósito inicial",
  }),
  new Transaction({
    cuenta: "1000000004",
    tipo: "deposito",
    monto: 5120.1,
    saldoResultante: 47120.1,
    fecha: new Date("2023-01-10T14:00:00.000Z"),
    descripcion: "Depósito en ventanilla",
  }),
  new Transaction({
    cuenta: "1000000004",
    tipo: "retiro",
    monto: 1500.0,
    saldoResultante: 45620.1,
    fecha: new Date("2023-02-03T16:25:00.000Z"),
    descripcion: "Retiro en cajero",
  }),
  new Transaction({
    cuenta: "1000000005",
    tipo: "deposito",
    monto: 9000.0,
    saldoResultante: 9000.0,
    fecha: new Date("2023-06-27T10:30:00.000Z"),
    descripcion: "Depósito inicial",
  }),
  new Transaction({
    cuenta: "1000000005",
    tipo: "deposito",
    monto: 1350.5,
    saldoResultante: 10350.5,
    fecha: new Date("2023-07-08T11:40:00.000Z"),
    descripcion: "Transferencia recibida",
  }),
  new Transaction({
    cuenta: "1000000005",
    tipo: "retiro",
    monto: 500.0,
    saldoResultante: 9850.5,
    fecha: new Date("2023-08-09T19:30:00.000Z"),
    descripcion: "Retiro en cajero",
  }),
  new Transaction({
    cuenta: "1000000006",
    tipo: "deposito",
    monto: 25000.0,
    saldoResultante: 25000.0,
    fecha: new Date("2024-05-04T10:30:00.000Z"),
    descripcion: "Depósito inicial",
  }),
  new Transaction({
    cuenta: "1000000006",
    tipo: "deposito",
    monto: 3110.25,
    saldoResultante: 28110.25,
    fecha: new Date("2024-05-15T08:45:00.000Z"),
    descripcion: "Pago de nómina",
  }),
  new Transaction({
    cuenta: "1000000006",
    tipo: "retiro",
    monto: 500.0,
    saldoResultante: 27610.25,
    fecha: new Date("2024-05-29T20:05:00.000Z"),
    descripcion: "Retiro en cajero",
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
    const client = clients.find((item) => item.curp === account.cliente);
    console.log(
      `  ${account.cuenta} | ${client.nombre.padEnd(38)} | $${account.saldo.toFixed(2)}`,
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
