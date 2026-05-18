const DEFAULT_BASE_URL = process.env.API_URL || "http://localhost:3001";
const DEFAULT_ACCOUNT = process.env.ACCOUNT || "1000000001";
const DEFAULT_RUNS = Number.parseInt(process.env.RUNS || "3", 10);

const BRANCH_OPERATIONS = [
  { sucursal: "CDMX", tipo: "deposito", monto: 120.0 },
  { sucursal: "GDL", tipo: "deposito", monto: 85.5 },
  { sucursal: "MTY", tipo: "deposito", monto: 60.25 },
  { sucursal: "PUE", tipo: "deposito", monto: 40.75 },
  { sucursal: "TIJ", tipo: "deposito", monto: 95.0 },
];

async function parseJsonResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al ejecutar operación remota");
  }

  return data;
}

async function executeBranchOperation({
  cuenta = DEFAULT_ACCOUNT,
  monto,
  sucursal,
  tipo = "deposito",
  descripcion,
  baseUrl = DEFAULT_BASE_URL,
}) {
  const response = await fetch(`${baseUrl}/api/${tipo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cuenta,
      monto,
      sucursal,
      descripcion: descripcion || `Operacion remota desde ${sucursal}`,
    }),
  });

  return parseJsonResponse(response);
}

async function fetchAccountSnapshot(cuenta = DEFAULT_ACCOUNT, baseUrl = DEFAULT_BASE_URL) {
  const response = await fetch(`${baseUrl}/api/cuenta/${cuenta}`);
  return parseJsonResponse(response);
}

async function fetchAccountHistory(cuenta = DEFAULT_ACCOUNT, baseUrl = DEFAULT_BASE_URL) {
  const response = await fetch(`${baseUrl}/api/historial/${cuenta}`);
  return parseJsonResponse(response);
}

function buildSimulationOperations(cuenta = DEFAULT_ACCOUNT) {
  return BRANCH_OPERATIONS.map((operation) => ({
    ...operation,
    cuenta,
    descripcion: `Simulacion concurrente desde ${operation.sucursal}`,
  }));
}

function calculateExpectedBalance(initialBalance, operations) {
  const delta = operations.reduce((sum, operation) => {
    return sum + (operation.tipo === "deposito" ? operation.monto : -operation.monto);
  }, 0);

  return Number.parseFloat((initialBalance + delta).toFixed(2));
}

async function simulateConcurrentBranches({
  cuenta = DEFAULT_ACCOUNT,
  baseUrl = DEFAULT_BASE_URL,
  runs = DEFAULT_RUNS,
} = {}) {
  const reports = [];

  for (let index = 0; index < runs; index += 1) {
    const operations = buildSimulationOperations(cuenta);
    const initialAccount = await fetchAccountSnapshot(cuenta, baseUrl);
    const initialHistory = await fetchAccountHistory(cuenta, baseUrl);

    const results = await Promise.allSettled(
      operations.map((operation) => executeBranchOperation({ ...operation, baseUrl })),
    );

    const finalAccount = await fetchAccountSnapshot(cuenta, baseUrl);
    const finalHistory = await fetchAccountHistory(cuenta, baseUrl);
    const expectedBalance = calculateExpectedBalance(initialAccount.saldo, operations);
    const successfulOperations = results.filter((result) => result.status === "fulfilled");
    const failedOperations = results.filter((result) => result.status === "rejected");

    reports.push({
      corrida: index + 1,
      cuenta,
      saldoInicial: initialAccount.saldo,
      saldoEsperado: expectedBalance,
      saldoObservado: finalAccount.saldo,
      diferencia: Number.parseFloat((finalAccount.saldo - expectedBalance).toFixed(2)),
      inconsistencias: finalAccount.saldo !== expectedBalance,
      transaccionesIniciales: initialHistory.length,
      transaccionesFinales: finalHistory.length,
      transaccionesNuevas: finalHistory.length - initialHistory.length,
      operacionesExitosas: successfulOperations.length,
      operacionesFallidas: failedOperations.length,
      resultados: results.map((result, resultIndex) => ({
        sucursal: operations[resultIndex].sucursal,
        tipo: operations[resultIndex].tipo,
        monto: operations[resultIndex].monto,
        estado: result.status,
        detalle:
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
