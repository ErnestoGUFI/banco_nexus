const { executeBranchOperation } = require("./branchOperation");

executeBranchOperation({
  cuenta: process.env.ACCOUNT || "1000000001",
  monto: Number.parseFloat(process.env.AMOUNT || "60.25"),
  sucursal: "MTY",
  tipo: process.env.TYPE || "deposito",
})
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
