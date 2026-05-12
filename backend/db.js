// Banco Nexus - reusable MongoDB connection module.

const { MongoClient } = require('mongodb');

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'banco_nexus';

let databaseClient = null;
let db = null;

async function connect() {
  if (db) return db;

  databaseClient = new MongoClient(URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await databaseClient.connect();
  db = databaseClient.db(DB_NAME);
  console.log(`MongoDB conectado: ${URI} -> ${DB_NAME}`);
  return db;
}

function getDb() {
  if (!db) throw new Error('Base de datos no inicializada. Llama a connect() primero.');
  return db;
}

async function close() {
  if (databaseClient) {
    await databaseClient.close();
    db = null;
    databaseClient = null;
    console.log('Conexion MongoDB cerrada.');
  }
}

process.on('SIGINT', async () => { await close(); process.exit(0); });
process.on('SIGTERM', async () => { await close(); process.exit(0); });

module.exports = { connect, getDb, close };
