// Banco Nexus - API REST con Express + Mongoose.

const { connect } = require("./src/db");
const { createApp } = require("./src/app");

const PORT = process.env.PORT || 3001;
const app = createApp();

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor Banco Nexus en http://localhost:${PORT}`);
      console.log("Rutas disponibles:");
      console.log("  GET  /health");
      console.log("  GET  /api/clients");
      console.log("  GET  /api/accounts/:accountNumber");
      console.log("  GET  /api/accounts/:accountNumber/history");
      console.log("  POST /api/deposits");
      console.log("  POST /api/withdrawals");
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a MongoDB:", error.message);
    process.exit(1);
  });
