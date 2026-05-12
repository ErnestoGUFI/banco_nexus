import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPlainAmount } from "../utils/formatters";

function BalanceTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">${formatPlainAmount(payload[0].value)}</div>
    </div>
  );
}

export default function BalanceChart({ history }) {
  if (history.length === 0) {
    return null;
  }

  return (
    <section className="card chart-card">
      <div className="section-title">Evolución del saldo</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
          <XAxis dataKey="fecha" tick={{ fill: "#546e8a", fontSize: 11 }} />
          <YAxis tick={{ fill: "#546e8a", fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip content={<BalanceTooltip />} />
          <Line type="monotone" dataKey="saldo" stroke="#4fc3f7" strokeWidth={2} dot={{ fill: "#4fc3f7", r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
