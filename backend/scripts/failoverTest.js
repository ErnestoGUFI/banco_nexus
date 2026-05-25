const { MongoClient } = require("mongodb");

const DEFAULT_DB_NAME = "banco_nexus";
const DB_NAME = process.env.DB_NAME || DEFAULT_DB_NAME;
const URI =
  process.env.MONGO_URI ||
  `mongodb://localhost:27017,localhost:27018,localhost:27019/${DB_NAME}?replicaSet=rsBanco`;

function getDirectNodeUri(memberName) {
  return `mongodb://${memberName}/${DB_NAME}?directConnection=true&readPreference=secondary`;
}

async function readFromSecondaries(members) {
  const secondaryMembers = members.filter((member) => member.stateStr === "SECONDARY");

  for (const member of secondaryMembers) {
    const secondaryClient = new MongoClient(getDirectNodeUri(member.name), {
      serverSelectionTimeoutMS: 5000,
    });

    try {
      await secondaryClient.connect();
      const count = await secondaryClient
        .db(DB_NAME)
        .collection("transactions")
        .countDocuments();

      console.log(`${member.name} | lectura secundaria OK | transactions: ${count}`);
    } catch (error) {
      console.warn(`${member.name} | lectura secundaria fallida: ${error.message}`);
    } finally {
      await secondaryClient.close();
    }
  }
}

async function testFailover() {
  const client = new MongoClient(URI, {
    retryWrites: true,
    serverSelectionTimeoutMS: 8000,
    w: "majority",
  });

  try {
    await client.connect();
    console.log("Conectado al Replica Set rsBanco.");

    const admin = client.db("admin");
    const status = await admin.command({ replSetGetStatus: 1 });
    const hello = await admin.command({ hello: 1 });
    const primary = status.members.find((member) => member.stateStr === "PRIMARY");

    console.log("\nEstado del Replica Set:");
    status.members.forEach((member) => {
      console.log(`${member.name} | Estado: ${member.stateStr} | health: ${member.health}`);
    });

    console.log(`\nNodo actual: ${hello.me}`);
    console.log(`Primario detectado: ${primary?.name || hello.primary || "no disponible"}`);
    console.log(`Puede escribir: ${Boolean(hello.isWritablePrimary || hello.ismaster)}`);

    const transactions = client.db(DB_NAME).collection("transactions");
    const result = await transactions.insertOne(
      {
        accountNumber: "1000000001",
        type: "deposit",
        amount: 1000,
        resultingBalance: 1000,
        date: new Date(),
        description: "Prueba automatizada de failover",
        branch: "CDMX",
      },
      { writeConcern: { w: "majority" } },
    );

    console.log(`\nTransaccion insertada con mayoria: ${result.insertedId}`);
    await readFromSecondaries(status.members);

    console.log("\nPrueba completada. Puedes apagar o degradar el primario y repetirla.");
  } catch (error) {
    console.error("Error en la prueba de failover:", error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

testFailover();
