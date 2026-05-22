// Banco Nexus - ejecutar una sola vez con:
// mongosh --port 27017 scripts/IniciarReplica.js

rs.initiate({
  _id: "rsBanco",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" },
  ],
});

print("Replica set rsBanco inicializado.");
printjson(rs.status());
