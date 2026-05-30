const mongoose = require("mongoose");
const fs = require("fs");

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

const DB_NAME = envOrFile("DB_NAME", "banco_nexus");
const REPLICA_SET = envOrFile("MONGO_REPLICA_SET", "rsBanco");
const URI =
  envOrFile("MONGO_URI") ||
  `mongodb://localhost:27017,localhost:27018,localhost:27019/${DB_NAME}?replicaSet=${REPLICA_SET}`;
const LATENCY_WARNING_MS = Number(process.env.DB_LATENCY_WARNING_MS || 1000);

const DB_STATES = {
  0: "desconectado",
  1: "conectado",
  2: "conectando",
  3: "desconectando",
};

let listenersRegistered = false;

function redactUri(uri) {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:***@");
}

function registerConnectionListeners() {
  if (listenersRegistered) {
    return;
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB conectado al replica set.");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB desconectado. Esperando reconexion del replica set.");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconectado al replica set.");
  });

  mongoose.connection.on("error", (error) => {
    console.error("Error de MongoDB:", error.message);
  });

  listenersRegistered = true;
}

async function connect() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  registerConnectionListeners();

  await mongoose.connect(URI, {
    dbName: DB_NAME,
    retryWrites: true,
    w: "majority",
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 2000,
  });

  console.log(`MongoDB conectado con Mongoose: ${redactUri(URI)} -> ${DB_NAME}`);
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

function isDbAvailabilityError(error) {
  const availabilityErrors = new Set([
    "MongoNetworkError",
    "MongoNetworkTimeoutError",
    "MongoNotConnectedError",
    "MongoServerClosedError",
    "MongoServerSelectionError",
    "MongooseServerSelectionError",
  ]);

  return (
    availabilityErrors.has(error?.name) ||
    /not connected|server selection|timed out|ECONNREFUSED|topology/i.test(
      error?.message || "",
    )
  );
}

async function getReplicaSetHealth() {
  const baseHealth = {
    status: "DOWN",
    dbName: DB_NAME,
    replicaSet: REPLICA_SET,
    readyState: DB_STATES[mongoose.connection.readyState] || "desconocido",
    primary: null,
    me: null,
    isWritablePrimary: false,
    latencyMs: null,
    members: [],
    managedCluster: Boolean(process.env.MONGO_URI),
  };

  if (mongoose.connection.readyState !== 1) {
    return {
      ...baseHealth,
      error: "La conexion de MongoDB no esta disponible.",
    };
  }

  const startedAt = Date.now();
  const admin = mongoose.connection.db.admin();

  try {
    await admin.command({ ping: 1 });
    const latencyMs = Date.now() - startedAt;
    const hello = await admin.command({ hello: 1 });
    let status = null;

    try {
      status = await admin.command({ replSetGetStatus: 1 });
    } catch (statusError) {
      status = null;
    }

    const primaryMember = status?.members?.find(
      (member) => member.stateStr === "PRIMARY",
    );

    return {
      ...baseHealth,
      status: latencyMs > LATENCY_WARNING_MS ? "DEGRADED" : "OK",
      readyState: DB_STATES[mongoose.connection.readyState] || "desconocido",
      primary: primaryMember?.name || hello.primary || null,
      me: hello.me || null,
      isWritablePrimary: Boolean(hello.isWritablePrimary || hello.ismaster),
      latencyMs,
      members:
        status?.members?.map((member) => ({
          name: member.name,
          stateStr: member.stateStr,
          health: member.health,
          uptime: member.uptime,
          optimeDate: member.optimeDate,
          lastHeartbeatMessage: member.lastHeartbeatMessage,
        })) || [],
      warning:
        latencyMs > LATENCY_WARNING_MS
          ? `Latencia alta en MongoDB (${latencyMs} ms).`
          : null,
    };
  } catch (error) {
    return {
      ...baseHealth,
      latencyMs: Date.now() - startedAt,
      error: error.message,
    };
  }
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

module.exports = {
  close,
  connect,
  getDb,
  getReplicaSetHealth,
  isDbAvailabilityError,
};
