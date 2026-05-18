const API_URL = "http://localhost:3001";

async function parseJsonResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al conectar con Banco Nexus");
  }

  return data;
}

export async function getAccount(accountNumber) {
  const response = await fetch(`${API_URL}/api/cuenta/${accountNumber}`);
  return parseJsonResponse(response);
}

export async function getAccountHistory(accountNumber) {
  const response = await fetch(`${API_URL}/api/historial/${accountNumber}`);

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function createTransaction(type, accountNumber, amount, branch) {
  const response = await fetch(`${API_URL}/api/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cuenta: accountNumber,
      monto: amount,
      sucursal: branch,
    }),
  });

  return parseJsonResponse(response);
}
