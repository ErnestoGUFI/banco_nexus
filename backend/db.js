// db.js
// Banco Nexus - Conexion modular y reutilizable a MongoDB
// Importar con: const { getDB, conectar, cerrar } = require('./db');

const { MongoClient } = require('mongodb');

const URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'banco_nexus';

let clienteDB = null;
let db = null;

async function conectar() {
  if (db) return db; // ya conectado, reutilizar
  clienteDB = new MongoClient(URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });
  await clienteDB.connect();
  db = clienteDB.db(DB_NAME);
  console.log(`✅ MongoDB conectado: ${URI} → ${DB_NAME}`);
  return db;
}

function getDB() {
  if (!db) throw new Error('Base de datos no inicializada. Llama a conectar() primero.');
  return db;
}

async function cerrar() {
  if (clienteDB) {
    await clienteDB.close();
    db = null;
    clienteDB = null;
    console.log('🔌 Conexion MongoDB cerrada.');
  }
}

// Cierre limpio al terminar el proceso
process.on('SIGINT', async () => { await cerrar(); process.exit(0); });
process.on('SIGTERM', async () => { await cerrar(); process.exit(0); });

module.exports = { conectar, getDB, cerrar };
