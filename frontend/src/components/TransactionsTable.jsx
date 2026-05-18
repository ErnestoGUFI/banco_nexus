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
            <div className={`transaction-row transaction-${transaction.tipo}`} key={transaction._id || `${transaction.cuenta}-${transaction.fecha}-${transaction.monto}`}>
              <span>{formatDate(transaction.fecha)}</span>
              <span>
                <span className={`transaction-badge transaction-badge-${transaction.tipo}`}>
                  {transaction.tipo}
                </span>
              </span>
              <span className="transaction-description">{transaction.descripcion}</span>
              <span>
                <span className="transaction-badge transaction-badge-branch">
                  {transaction.sucursal || "CDMX"}
                </span>
              </span>
              <span className="transaction-amount">
                {transaction.tipo === "deposito" ? "+" : "-"}
                {formatCurrency(transaction.monto)}
              </span>
              <span>{formatCurrency(transaction.saldoResultante)}</span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
