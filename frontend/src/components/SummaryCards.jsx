import { formatCurrency, formatDate } from "../utils/formatters";

export default function SummaryCards({ account }) {
  return (
    <section className="summary-grid">
      <article className="card">
        <div className="card-label">Saldo actual</div>
        <div className="card-value">{formatCurrency(account.saldo)}</div>
        <div className="card-subtitle">Tipo: {account.tipo}</div>
      </article>
      <article className="card">
        <div className="card-label">Titular</div>
        <div className="card-value card-value-small">{account.cliente.nombre}</div>
        <div className="card-subtitle">{account.cliente.email}</div>
      </article>
      <article className="card">
        <div className="card-label">Apertura</div>
        <div className="card-value card-value-small">{formatDate(account.fechaApertura)}</div>
        <div className="card-subtitle">CURP: {account.cliente.curp}</div>
      </article>
    </section>
  );
}
