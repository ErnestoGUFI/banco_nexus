// App.jsx
// Banco Nexus - Frontend React completo
// Integrante 3: Programador Frontend
// Ejecutar con: npm create vite@latest banco-nexus -- --template react
// Luego copiar este archivo a src/App.jsx
// npm install recharts

import { useState } from "react";
import {
  LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const API = "http://localhost:3001";

// ─── COLORES Y ESTILOS BASE ────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1e",
    color: "#e8eaf0",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    padding: "0",
  },
  header: {
    background: "#0d1424",
    borderBottom: "1px solid #1e2d4a",
    padding: "1.5rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#4fc3f7",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  logoSub: { fontSize: "0.65rem", color: "#546e8a", letterSpacing: "0.15em" },
  statusDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#4caf50", display: "inline-block", marginRight: 8,
    boxShadow: "0 0 6px #4caf50",
  },
  main: { maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" },
  searchBox: {
    background: "#0d1424",
    border: "1px solid #1e2d4a",
    borderRadius: 8,
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  label: { fontSize: "0.7rem", color: "#546e8a", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 },
  inputRow: { display: "flex", gap: 12 },
  input: {
    flex: 1, padding: "0.7rem 1rem",
    background: "#0a0f1e", border: "1px solid #1e2d4a",
    borderRadius: 6, color: "#e8eaf0",
    fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.95rem",
    outline: "none",
  },
  btnPrimary: {
    padding: "0.7rem 1.8rem",
    background: "#4fc3f7", color: "#0a0f1e",
    border: "none", borderRadius: 6,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: "700", fontSize: "0.85rem",
    letterSpacing: "0.08em", cursor: "pointer",
    textTransform: "uppercase",
  },
  btnSecondary: {
    padding: "0.6rem 1.2rem",
    background: "transparent",
    border: "1px solid",
    borderRadius: 6,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: "700", fontSize: "0.8rem",
    letterSpacing: "0.08em", cursor: "pointer",
    textTransform: "uppercase",
  },
  errorBox: {
    background: "#1a0d0d", border: "1px solid #b71c1c",
    borderRadius: 6, padding: "0.8rem 1rem",
    color: "#ef9a9a", fontSize: "0.85rem", marginTop: 12,
  },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" },
  card: {
    background: "#0d1424", border: "1px solid #1e2d4a",
    borderRadius: 8, padding: "1.2rem",
  },
  cardLabel: { fontSize: "0.65rem", color: "#546e8a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 },
  cardValue: { fontSize: "1.5rem", fontWeight: "700", color: "#4fc3f7" },
  cardSub: { fontSize: "0.75rem", color: "#546e8a", marginTop: 4 },
  section: { marginBottom: "1.5rem" },
  sectionTitle: {
    fontSize: "0.7rem", color: "#546e8a",
    letterSpacing: "0.15em", textTransform: "uppercase",
    borderBottom: "1px solid #1e2d4a", paddingBottom: 8, marginBottom: 12,
  },
  clientCard: {
    background: "#0d1424", border: "1px solid #1e2d4a",
    borderRadius: 8, padding: "1.2rem",
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "0.8rem", marginBottom: "1.5rem",
  },
  clientField: {},
  txRow: (tipo) => ({
    display: "grid", gridTemplateColumns: "120px 1fr 130px 130px",
    gap: 12, padding: "0.7rem 0",
    borderBottom: "1px solid #0d1424",
    fontSize: "0.82rem",
    color: tipo === "deposito" ? "#81c784" : "#e57373",
  }),
  txHeader: {
    display: "grid", gridTemplateColumns: "120px 1fr 130px 130px",
    gap: 12, padding: "0 0 0.5rem",
    fontSize: "0.65rem", color: "#546e8a",
    letterSpacing: "0.1em", textTransform: "uppercase",
    borderBottom: "1px solid #1e2d4a",
  },
  badge: (tipo) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: "700",
    letterSpacing: "0.05em",
    background: tipo === "deposito" ? "#0d2112" : "#1a0d0d",
    color: tipo === "deposito" ? "#81c784" : "#e57373",
    border: `1px solid ${tipo === "deposito" ? "#1b5e20" : "#b71c1c"}`,
  }),
  operaciones: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem",
  },
  opCard: {
    background: "#0d1424", border: "1px solid #1e2d4a",
    borderRadius: 8, padding: "1.2rem",
  },
  montoInput: {
    width: "100%", padding: "0.6rem 0.9rem",
    background: "#0a0f1e", border: "1px solid #1e2d4a",
    borderRadius: 6, color: "#e8eaf0",
    fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem",
    outline: "none", marginTop: 8, boxSizing: "border-box",
  },
  successMsg: {
    background: "#0d2112", border: "1px solid #1b5e20",
    borderRadius: 6, padding: "0.7rem 1rem",
    color: "#81c784", fontSize: "0.82rem", marginTop: 10,
  },
};

// ─── TOOLTIP PERSONALIZADO ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#0d1424", border: "1px solid #1e2d4a", borderRadius: 6, padding: "0.6rem 1rem", fontSize: "0.8rem" }}>
        <div style={{ color: "#546e8a", marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#4fc3f7", fontWeight: "700" }}>${payload[0].value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</div>
      </div>
    );
  }
  return null;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────
export default function App() {
  const [cuentaInput, setCuentaInput] = useState("");
  const [datos, setDatos] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [montoDeposito, setMontoDeposito] = useState("");
  const [montoRetiro, setMontoRetiro] = useState("");
  const [msgDeposito, setMsgDeposito] = useState("");
  const [msgRetiro, setMsgRetiro] = useState("");
  const [opLoading, setOpLoading] = useState(false);

  async function buscarCuenta() {
    if (!cuentaInput.trim()) return;
    setLoading(true);
    setError("");
    setDatos(null);
    setHistorial([]);
    setMsgDeposito("");
    setMsgRetiro("");
    try {
      const [resCuenta, resHistorial] = await Promise.all([
        fetch(`${API}/api/cuenta/${cuentaInput.trim()}`),
        fetch(`${API}/api/historial/${cuentaInput.trim()}`),
      ]);
      if (!resCuenta.ok) {
        const e = await resCuenta.json();
        throw new Error(e.error || "Cuenta no encontrada");
      }
      const dataCuenta = await resCuenta.json();
      const dataHistorial = resHistorial.ok ? await resHistorial.json() : [];

      setDatos(dataCuenta);
      setHistorial(dataHistorial.map(t => ({
        fecha: new Date(t.fecha).toLocaleDateString("es-MX"),
        saldo: t.saldoResultante,
      })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function operacion(tipo) {
    const monto = parseFloat(tipo === "deposito" ? montoDeposito : montoRetiro);
    if (!monto || monto <= 0) return;
    setOpLoading(true);
    try {
      const res = await fetch(`${API}/api/${tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuenta: datos.cuenta, monto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (tipo === "deposito") {
        setMsgDeposito(`✓ Depósito de $${monto.toLocaleString("es-MX")} realizado. Nuevo saldo: $${data.nuevoSaldo.toLocaleString("es-MX")}`);
        setMontoDeposito("");
      } else {
        setMsgRetiro(`✓ Retiro de $${monto.toLocaleString("es-MX")} realizado. Nuevo saldo: $${data.nuevoSaldo.toLocaleString("es-MX")}`);
        setMontoRetiro("");
      }
      // Recargar datos
      await buscarCuenta();
    } catch (e) {
      if (tipo === "deposito") setMsgDeposito(`✗ ${e.message}`);
      else setMsgRetiro(`✗ ${e.message}`);
    } finally {
      setOpLoading(false);
    }
  }

  function formatSaldo(n) {
    return n?.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) ?? "-";
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>⬡ Banco Nexus</div>
          <div style={styles.logoSub}>Sistema de Gestión Distribuida</div>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#546e8a" }}>
          <span style={styles.statusDot} />
          Sistema en línea
        </div>
      </header>

      <main style={styles.main}>
        {/* BUSCADOR */}
        <div style={styles.searchBox}>
          <label style={styles.label}>Número de cuenta</label>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              placeholder="Ej: 1000000001"
              value={cuentaInput}
              onChange={e => setCuentaInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buscarCuenta()}
            />
            <button
              style={styles.btnPrimary}
              onClick={buscarCuenta}
              disabled={loading}
            >
              {loading ? "..." : "Consultar"}
            </button>
          </div>
          {error && <div style={styles.errorBox}>✗ {error}</div>}
        </div>

        {datos && (
          <>
            {/* TARJETAS RESUMEN */}
            <div style={styles.grid3}>
              <div style={styles.card}>
                <div style={styles.cardLabel}>Saldo actual</div>
                <div style={styles.cardValue}>{formatSaldo(datos.saldo)}</div>
                <div style={styles.cardSub}>Tipo: {datos.tipo}</div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardLabel}>Titular</div>
                <div style={{ ...styles.cardValue, fontSize: "1rem", lineHeight: 1.4 }}>{datos.cliente.nombre}</div>
                <div style={styles.cardSub}>{datos.cliente.email}</div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardLabel}>Apertura</div>
                <div style={{ ...styles.cardValue, fontSize: "1rem" }}>
                  {new Date(datos.fechaApertura).toLocaleDateString("es-MX")}
                </div>
                <div style={styles.cardSub}>CURP: {datos.cliente.curp}</div>
              </div>
            </div>

            {/* GRÁFICA */}
            {historial.length > 0 && (
              <div style={{ ...styles.card, marginBottom: "1.5rem" }}>
                <div style={styles.sectionTitle}>Evolución del saldo</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={historial} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis dataKey="fecha" tick={{ fill: "#546e8a", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#546e8a", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="saldo" stroke="#4fc3f7" strokeWidth={2} dot={{ fill: "#4fc3f7", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* OPERACIONES */}
            <div style={styles.operaciones}>
              {/* DEPÓSITO */}
              <div style={styles.opCard}>
                <div style={styles.sectionTitle}>Depósito</div>
                <label style={styles.cardLabel}>Monto a depositar (MXN)</label>
                <input
                  type="number" min="1"
                  style={styles.montoInput}
                  placeholder="0.00"
                  value={montoDeposito}
                  onChange={e => setMontoDeposito(e.target.value)}
                />
                <button
                  style={{ ...styles.btnSecondary, borderColor: "#81c784", color: "#81c784", marginTop: 10, width: "100%" }}
                  onClick={() => operacion("deposito")}
                  disabled={opLoading}
                >
                  + Depositar
                </button>
                {msgDeposito && (
                  <div style={msgDeposito.startsWith("✓") ? styles.successMsg : styles.errorBox}>
                    {msgDeposito}
                  </div>
                )}
              </div>

              {/* RETIRO */}
              <div style={styles.opCard}>
                <div style={styles.sectionTitle}>Retiro</div>
                <label style={styles.cardLabel}>Monto a retirar (MXN)</label>
                <input
                  type="number" min="1"
                  style={styles.montoInput}
                  placeholder="0.00"
                  value={montoRetiro}
                  onChange={e => setMontoRetiro(e.target.value)}
                />
                <button
                  style={{ ...styles.btnSecondary, borderColor: "#e57373", color: "#e57373", marginTop: 10, width: "100%" }}
                  onClick={() => operacion("retiro")}
                  disabled={opLoading}
                >
                  − Retirar
                </button>
                {msgRetiro && (
                  <div style={msgRetiro.startsWith("✓") ? styles.successMsg : styles.errorBox}>
                    {msgRetiro}
                  </div>
                )}
              </div>
            </div>

            {/* TRANSACCIONES */}
            <div style={styles.card}>
              <div style={styles.sectionTitle}>Últimas transacciones</div>
              {datos.transacciones.length === 0 ? (
                <div style={{ color: "#546e8a", fontSize: "0.85rem" }}>Sin movimientos registrados.</div>
              ) : (
                <>
                  <div style={styles.txHeader}>
                    <span>Fecha</span>
                    <span>Descripción</span>
                    <span>Monto</span>
                    <span>Saldo resultante</span>
                  </div>
                  {datos.transacciones.map((tx, i) => (
                    <div key={i} style={styles.txRow(tx.tipo)}>
                      <span>{new Date(tx.fecha).toLocaleDateString("es-MX")}</span>
                      <span>
                        <span style={styles.badge(tx.tipo)}>{tx.tipo}</span>
                        {" "}{tx.descripcion}
                      </span>
                      <span style={{ fontWeight: 700 }}>
                        {tx.tipo === "deposito" ? "+" : "−"}
                        {formatSaldo(tx.monto)}
                      </span>
                      <span>{formatSaldo(tx.saldoResultante)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
