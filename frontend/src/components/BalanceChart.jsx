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
          <CartesianGrid strokeDasharray="3 3" stroke="#202a67" />
          <XAxis dataKey="date" tick={{ fill: "#b2b5ca", fontSize: 11 }} />
          <YAxis tick={{ fill: "#b2b5ca", fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip content={<BalanceTooltip />} />
          <Line type="monotone" dataKey="balance" stroke="#6d75ff" strokeWidth={3} dot={{ fill: "#0d17e7", stroke: "#d8dcff", strokeWidth: 2, r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
