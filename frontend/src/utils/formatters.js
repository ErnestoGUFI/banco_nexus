export function formatCurrency(value) {
  return value?.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) ?? "-";
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("es-MX");
}

export function formatHistory(transactions) {
  return transactions.map((transaction) => ({
    fecha: formatDate(transaction.fecha),
    saldo: transaction.saldoResultante,
  }));
}

export function formatPlainAmount(value) {
  return value.toLocaleString("es-MX", { minimumFractionDigits: 2 });
}
