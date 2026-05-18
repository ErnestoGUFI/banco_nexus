const { executeBranchOperation } = require("./branchOperation");

executeBranchOperation({
  cuenta: process.env.ACCOUNT || "1000000001",
  monto: Number.parseFloat(process.env.AMOUNT || "40.75"),
  sucursal: "PUE",
  tipo: process.env.TYPE || "deposito",
})
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
