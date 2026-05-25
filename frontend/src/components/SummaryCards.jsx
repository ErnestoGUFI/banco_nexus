import { formatCurrency, formatDate } from "../utils/formatters";

export default function SummaryCards({ account }) {
  return (
    <section className="summary-grid">
      <article className="card">
        <div className="card-label">Saldo actual</div>
        <div className="card-value">{formatCurrency(account.balance)}</div>
        <div className="card-subtitle">Tipo: {account.accountType}</div>
      </article>
      <article className="card">
        <div className="card-label">Titular</div>
        <div className="card-value card-value-small">{account.client.name}</div>
        <div className="card-subtitle">{account.client.email}</div>
      </article>
      <article className="card">
        <div className="card-label">Apertura</div>
        <div className="card-value card-value-small">{formatDate(account.openedAt)}</div>
        <div className="card-subtitle">CURP: {account.client.curp}</div>
      </article>
    </section>
  );
}
