const DEFAULT_BASE_URL = process.env.API_URL || "http://localhost:3001";
const DEFAULT_ACCOUNT = process.env.ACCOUNT || "1000000001";
const DEFAULT_RUNS = Number.parseInt(process.env.RUNS || "3", 10);

const BRANCH_OPERATIONS = [
  { branch: "CDMX", type: "deposit", amount: 120.0 },
  { branch: "GDL", type: "deposit", amount: 85.5 },
  { branch: "MTY", type: "deposit", amount: 60.25 },
  { branch: "PUE", type: "deposit", amount: 40.75 },
  { branch: "TIJ", type: "deposit", amount: 95.0 },
];

async function parseJsonResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al ejecutar operación remota");
  }

  return data;
}

async function executeBranchOperation({
  accountNumber = DEFAULT_ACCOUNT,
  amount,
  branch,
  type = "deposit",
  description,
  baseUrl = DEFAULT_BASE_URL,
}) {
  const operationPath = type === "deposit" ? "deposits" : "withdrawals";
  const response = await fetch(`${baseUrl}/api/${operationPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountNumber,
      amount,
      branch,
      description: description || `Operacion remota desde ${branch}`,
    }),
  });

  return parseJsonResponse(response);
}

async function fetchAccountSnapshot(accountNumber = DEFAULT_ACCOUNT, baseUrl = DEFAULT_BASE_URL) {
  const response = await fetch(`${baseUrl}/api/accounts/${accountNumber}`);
  return parseJsonResponse(response);
}

async function fetchAccountHistory(accountNumber = DEFAULT_ACCOUNT, baseUrl = DEFAULT_BASE_URL) {
  const response = await fetch(`${baseUrl}/api/accounts/${accountNumber}/history`);
  return parseJsonResponse(response);
}

function buildSimulationOperations(accountNumber = DEFAULT_ACCOUNT) {
  return BRANCH_OPERATIONS.map((operation) => ({
    ...operation,
    accountNumber,
    description: `Simulacion concurrente desde ${operation.branch}`,
  }));
}

function calculateExpectedBalance(initialBalance, operations) {
  const delta = operations.reduce((sum, operation) => {
    return sum + (operation.type === "deposit" ? operation.amount : -operation.amount);
  }, 0);

  return Number.parseFloat((initialBalance + delta).toFixed(2));
}

async function simulateConcurrentBranches({
  accountNumber = DEFAULT_ACCOUNT,
  baseUrl = DEFAULT_BASE_URL,
  runs = DEFAULT_RUNS,
} = {}) {
  const reports = [];

  for (let index = 0; index < runs; index += 1) {
    const operations = buildSimulationOperations(accountNumber);
    const initialAccount = await fetchAccountSnapshot(accountNumber, baseUrl);
    const initialHistory = await fetchAccountHistory(accountNumber, baseUrl);

    const results = await Promise.allSettled(
      operations.map((operation) => executeBranchOperation({ ...operation, baseUrl })),
    );

    const finalAccount = await fetchAccountSnapshot(accountNumber, baseUrl);
    const finalHistory = await fetchAccountHistory(accountNumber, baseUrl);
    const expectedBalance = calculateExpectedBalance(initialAccount.balance, operations);
    const successfulOperations = results.filter((result) => result.status === "fulfilled");
    const failedOperations = results.filter((result) => result.status === "rejected");

    reports.push({
      run: index + 1,
      accountNumber,
      initialBalance: initialAccount.balance,
      expectedBalance,
      observedBalance: finalAccount.balance,
      difference: Number.parseFloat((finalAccount.balance - expectedBalance).toFixed(2)),
      hasInconsistencies: finalAccount.balance !== expectedBalance,
      initialTransactions: initialHistory.length,
      finalTransactions: finalHistory.length,
      newTransactions: finalHistory.length - initialHistory.length,
      successfulOperations: successfulOperations.length,
      failedOperations: failedOperations.length,
      results: results.map((result, resultIndex) => ({
        branch: operations[resultIndex].branch,
        type: operations[resultIndex].type,
        amount: operations[resultIndex].amount,
        status: result.status,
        details:
          result.status === "fulfilled"
            ? result.value
            : { error: result.reason.message },
      })),
    });
  }

  return reports;
}

module.exports = {
  BRANCH_OPERATIONS,
  DEFAULT_ACCOUNT,
  DEFAULT_BASE_URL,
  DEFAULT_RUNS,
  buildSimulationOperations,
  calculateExpectedBalance,
  executeBranchOperation,
  fetchAccountHistory,
  fetchAccountSnapshot,
  simulateConcurrentBranches,
};
