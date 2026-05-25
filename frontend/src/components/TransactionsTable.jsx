import { formatCurrency, formatDate } from "../utils/formatters";

export default function TransactionsTable({ transactions }) {
  return (
    <section className="card">
      <div className="section-title">Transacciones de la cuenta</div>
      {transactions.length === 0 ? (
        <div className="empty-state">Sin movimientos registrados.</div>
      ) : (
        <>
          <div className="transactions-header">
            <span>Fecha</span>
            <span>Tipo</span>
            <span>Descripción</span>
            <span>Sucursal</span>
            <span>Monto</span>
            <span>Saldo resultante</span>
          </div>
          {transactions.map((transaction) => (
            <div className={`transaction-row transaction-${transaction.type}`} key={transaction._id || `${transaction.accountNumber}-${transaction.date}-${transaction.amount}`}>
              <span>{formatDate(transaction.date)}</span>
              <span>
                <span className={`transaction-badge transaction-badge-${transaction.type}`}>
                  {transaction.type}
                </span>
              </span>
              <span className="transaction-description">{transaction.description}</span>
              <span>
                <span className="transaction-badge transaction-badge-branch">
                  {transaction.branch || "CDMX"}
                </span>
              </span>
              <span className="transaction-amount">
                {transaction.type === "deposit" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </span>
              <span>{formatCurrency(transaction.resultingBalance)}</span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
