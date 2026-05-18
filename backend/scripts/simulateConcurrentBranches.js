const { simulateConcurrentBranches } = require("./branchOperation");

simulateConcurrentBranches({
  cuenta: process.env.ACCOUNT || "1000000001",
  runs: Number.parseInt(process.env.RUNS || "3", 10),
})
  .then((reports) => {
    console.log(JSON.stringify(reports, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
