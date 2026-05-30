// Banco Nexus - API REST con Express + Mongoose.

require("dotenv").config();

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
      console.log("  POST /api/auth/register");
      console.log("  POST /api/auth/login");
      console.log("  GET  /api/dashboard");
      console.log("  PATCH /api/me");
      console.log("  POST /api/beneficiaries");
      console.log("  POST /api/transfers");
      console.log("  GET  /api/audit");
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a MongoDB:", error.message);
    process.exit(1);
  });
