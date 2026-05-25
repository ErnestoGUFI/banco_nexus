// Banco Nexus - ejecutar con Docker desde la raiz del proyecto:
// make db-replica-init

const config = {
  _id: "rsBanco",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" },
  ],
};

try {
  const status = rs.status();

  if (status.ok === 1) {
    print("Replica set rsBanco ya estaba inicializado.");
  }
} catch (error) {
  if (error.codeName !== "NotYetInitialized") {
    throw error;
  }

  rs.initiate(config);
  print("Replica set rsBanco inicializado.");
}

printjson(rs.status());
