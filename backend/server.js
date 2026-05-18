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
      console.log("  GET  /api/clientes");
      console.log("  GET  /api/cuenta/:cuenta");
      console.log("  GET  /api/historial/:cuenta");
      console.log("  POST /api/deposito");
      console.log("  POST /api/retiro");
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a MongoDB:", error.message);
    process.exit(1);
  });
