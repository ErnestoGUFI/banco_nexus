const API_URL = "http://localhost:3001";

async function parseJsonResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al conectar con Banco Nexus");
  }

  return data;
}

export async function getSystemHealth() {
  const response = await fetch(`${API_URL}/health`);
  return parseJsonResponse(response);
}

export async function getAccount(accountNumber) {
  const response = await fetch(`${API_URL}/api/accounts/${accountNumber}`);
  return parseJsonResponse(response);
}

export async function getAccountHistory(accountNumber) {
  const response = await fetch(`${API_URL}/api/accounts/${accountNumber}/history`);

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function createTransaction(type, accountNumber, amount, branch) {
  const operationPath = type === "deposit" ? "deposits" : "withdrawals";
  const response = await fetch(`${API_URL}/api/${operationPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountNumber,
      amount,
      branch,
    }),
  });

  return parseJsonResponse(response);
}
