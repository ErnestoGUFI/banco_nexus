const { executeBranchOperation } = require("./branchOperation");

executeBranchOperation({
  accountNumber: process.env.ACCOUNT || "1000000001",
  amount: Number.parseFloat(process.env.AMOUNT || "40.75"),
  branch: "PUE",
  type: process.env.TYPE || "deposit",
})
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
