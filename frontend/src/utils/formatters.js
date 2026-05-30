export function formatCurrency(value) {
  return value?.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) ?? "-";
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("es-MX");
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatHistory(transactions) {
  return transactions
    .slice()
    .reverse()
    .map((transaction) => ({
      date: formatDate(transaction.date),
      balance: transaction.resultingBalance,
    }));
}

export function formatPlainAmount(value) {
  return value.toLocaleString("es-MX", { minimumFractionDigits: 2 });
}
