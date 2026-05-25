const { MongoClient } = require("mongodb");

const DEFAULT_DB_NAME = "banco_nexus";
const DB_NAME = process.env.DB_NAME || DEFAULT_DB_NAME;
const STEP_DOWN_SECONDS = Number(process.env.STEP_DOWN_SECONDS || 60);
const URI =
  process.env.MONGO_URI ||
  `mongodb://localhost:27017,localhost:27018,localhost:27019/${DB_NAME}?replicaSet=rsBanco`;

function isExpectedStepDownError(error) {
  return /not primary|node is recovering|interrupted|connection|closed/i.test(
    error?.message || "",
  );
}

async function stepDownPrimary() {
  const client = new MongoClient(URI, {
    serverSelectionTimeoutMS: 8000,
  });

  try {
    await client.connect();
    const admin = client.db("admin");
    const hello = await admin.command({ hello: 1 });
    const primary = hello.primary || hello.me || "primario detectado";

    console.log(`Degradando primario actual: ${primary}`);
    await admin.command({ replSetStepDown: STEP_DOWN_SECONDS, force: true });
    console.log(`Primario degradado por ${STEP_DOWN_SECONDS} segundos.`);
  } catch (error) {
    if (isExpectedStepDownError(error)) {
      console.log(
        "Primario degradado; la conexion se cerro durante la eleccion, lo cual es esperado.",
      );
      return;
    }

    console.error("No se pudo degradar el primario:", error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

stepDownPrimary();
