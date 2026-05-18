const mongoose = require("mongoose");

const URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "banco_nexus";

async function connect() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(URI, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  console.log(`MongoDB conectado con Mongoose: ${URI} -> ${DB_NAME}`);
  return mongoose.connection;
}

function getDb() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error(
      "Base de datos no inicializada. Llama a connect() primero.",
    );
  }

  return mongoose.connection;
}

async function close() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("Conexion Mongoose cerrada.");
  }
}

process.on("SIGINT", async () => {
  await close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await close();
  process.exit(0);
});

module.exports = { connect, getDb, close };
