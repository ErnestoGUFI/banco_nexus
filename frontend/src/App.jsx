import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  History,
  Home,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Moon,
  Palette,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  TrendingDown,
  TrendingUp,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  createBeneficiary,
  createTransfer,
  getAccountByNumber,
  getDashboard,
  getSystemHealth,
  hasSession,
  loginClient,
  logout,
  registerClient,
  updateProfile,
} from "./api/bankApi";
import { Typewriter } from "@/components/ui/typewriter";
import { blockInvalidAmountKey, sanitizeAmountInput } from "./utils/amountInput";
import { formatCurrency, formatDateTime } from "./utils/formatters";
import "./styles.css";

const HEALTH_POLL_MS = 15000;
const EMPTY_AUTH_FORM = {
  name: "",
  phone: "",
  email: "",
  password: "",
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "bitacora", label: "Auditoría", icon: Shield },
  { id: "cuentas", label: "Cuentas", icon: CreditCard },
  { id: "transferencias", label: "Transferencias", icon: ArrowLeftRight },
  { id: "historial", label: "Reportes", icon: PieChart },
  { id: "perfil", label: "Perfil", icon: User },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "transferencias", label: "Enviar", icon: Send },
  { id: "historial", label: "Reportes", icon: PieChart },
  { id: "cuentas", label: "Cuentas", icon: CreditCard },
  { id: "perfil", label: "Perfil", icon: User },
];

const PERIOD_OPTIONS = [
  { id: "day", label: "Hoy", shortLabel: "1D", days: 1 },
  { id: "week", label: "Últimos 7 dias", shortLabel: "7D", days: 7 },
  { id: "month", label: "Este mes", shortLabel: "1M", days: 30 },
  { id: "year", label: "Este año", shortLabel: "1Y", days: 365 },
];

const ACCENT_OPTIONS = [
  {
    id: "silver",
    label: "Plateado",
    description: "Grafito y plata pulida",
    colors: ["#f2f3f4", "#bfc4ca", "#6f757b"],
  },
  {
    id: "gold",
    label: "Dorado",
    description: "Oro sobrio y premium",
    colors: ["#f0d687", "#c79435", "#8a6320"],
  },
  {
    id: "red",
    label: "Rojo metálico",
    description: "Rojo profundo con brillo",
    colors: ["#ff8a98", "#c93046", "#67111e"],
  },
  {
    id: "purple",
    label: "Morado",
    description: "Violeta eléctrico",
    colors: ["#ceb9ff", "#8760da", "#422274"],
  },
  {
    id: "sapphire",
    label: "Azul acero",
    description: "Azul frío bancario",
    colors: ["#b8d4ff", "#3b76d6", "#17366b"],
  },
  {
    id: "emerald",
    label: "Esmeralda",
    description: "Verde financiero",
    colors: ["#a0efd5", "#21a17e", "#0d4939"],
  },
  {
    id: "copper",
    label: "Cobre",
    description: "Metal cálido",
    colors: ["#f3bf8e", "#c8783d", "#75401d"],
  },
];

const NEXUS_CAPABILITIES = [
  "consulta saldos en tiempo real",
  "ejecuta transferencias seguras",
  "registra cuentas destino",
  "valida fondos antes de mover dinero",
  "audita accesos y operaciones",
  "visualiza ingresos, gastos y reportes",
  "personaliza tema, modo y color",
];

function getStatusCopy(health) {
  if (!health) {
    return "Verificando sistema";
  }

  if (health.status === "DOWN") {
    return "Base sin respuesta";
  }

  if (health.status === "DEGRADED") {
    return `Latencia ${health.latencyMs} ms`;
  }

  return "Sistema en linea";
}

function getStatusTone(health) {
  if (health?.status === "DOWN") {
    return "error";
  }

  if (health?.status === "DEGRADED") {
    return "warning";
  }

  return "ok";
}

function typeLabel(type) {
  const labels = {
    deposit: "Abono",
    withdrawal: "Cargo",
    transfer_in: "Transferencia recibida",
    transfer_out: "Transferencia enviada",
  };

  return labels[type] || type;
}

function actionLabel(action = "", status = "") {
  const labels = {
    alta_cuenta_destino: "Alta de cuenta destino",
    login_exitoso: "Inicio de sesion exitoso",
    login_fallido: "Inicio de sesion fallido",
    registro_cliente: "Registro de cliente",
    seed_cliente: "Cliente de prueba",
    transferencia_aprobada: status === "fallido" ? "Transferencia rechazada" : "Transferencia aprobada",
    transferencia_rechazada: "Transferencia rechazada",
  };

  return (labels[action] || action)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isCredit(transaction) {
  return transaction.type === "deposit" || transaction.type === "transfer_in";
}

function statusIcon(status) {
  if (status === "exitoso") {
    return <CheckCircle size={14} />;
  }

  if (status === "fallido") {
    return <AlertCircle size={14} />;
  }

  return <Clock size={14} />;
}

function getPeriodOption(period) {
  return PERIOD_OPTIONS.find((option) => option.id === period) || PERIOD_OPTIONS[2];
}

function transactionTime(transaction) {
  const time = new Date(transaction.date).getTime();
  return Number.isFinite(time) ? time : 0;
}

function filterTransactionsByPeriod(transactions, period) {
  const option = getPeriodOption(period);
  const threshold = Date.now() - option.days * 24 * 60 * 60 * 1000;

  return transactions.filter((transaction) => transactionTime(transaction) >= threshold);
}

function sumTransactions(transactions, predicate) {
  return transactions
    .filter(predicate)
    .reduce((total, item) => total + Number(item.amount || 0), 0);
}

function getSpendingCategory(transaction) {
  if (transaction.type === "transfer_out") {
    return "Transferencias";
  }

  if (transaction.type === "withdrawal") {
    return "Retiros";
  }

  return "Otros";
}

function getSpendingBreakdown(transactions) {
  const outgoing = transactions.filter((item) => !isCredit(item));
  const totals = outgoing.reduce((groups, transaction) => {
    const category = getSpendingCategory(transaction);
    groups[category] = (groups[category] || 0) + Number(transaction.amount || 0);
    return groups;
  }, {});
  const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0);

  if (total === 0) {
    return {
      total: 0,
      categories: [
        { label: "Sin cargos", amount: 0, percentage: 0 },
      ],
    };
  }

  return {
    total,
    categories: Object.entries(totals)
      .map(([label, amount]) => ({
        label,
        amount,
        percentage: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount),
  };
}

function buildBalanceSeries(transactions, currentBalance) {
  const sorted = [...transactions]
    .filter((transaction) => Number.isFinite(Number(transaction.resultingBalance)))
    .sort((a, b) => transactionTime(a) - transactionTime(b));
  const values = sorted.map((transaction) => Number(transaction.resultingBalance));

  if (values.length === 0) {
    return [Number(currentBalance || 0), Number(currentBalance || 0)];
  }

  if (values.length === 1) {
    return [values[0], values[0]];
  }

  return values.slice(-8);
}

function buildLineGeometry(values) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(1, maxValue - minValue);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 180 : 20 + (index * 320) / (values.length - 1);
    const y = 118 - ((value - minValue) / range) * 92;
    return { x, y, value };
  });
  const [firstPoint] = points;
  const lastPoint = points[points.length - 1];
  const line = points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX.toFixed(1)} ${previous.y.toFixed(1)}, ${controlX.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, `M ${firstPoint.x.toFixed(1)} ${firstPoint.y.toFixed(1)}`);
  const area = `${line} L ${lastPoint.x.toFixed(1)} 130 L ${firstPoint.x.toFixed(1)} 130 Z`;

  return { line, area, minValue, maxValue, points };
}

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function isWithinDateRange(dateValue, from, to) {
  const time = new Date(dateValue).getTime();

  if (!Number.isFinite(time)) {
    return false;
  }

  if (from) {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    if (Number.isFinite(fromTime) && time < fromTime) {
      return false;
    }
  }

  if (to) {
    const toTime = new Date(`${to}T23:59:59`).getTime();
    if (Number.isFinite(toTime) && time > toTime) {
      return false;
    }
  }

  return true;
}

function auditDetailEntries(log) {
  const detail = log?.detail || {};
  const entries = [];

  if (detail.sourceAccount) entries.push(["Origen", detail.sourceAccount]);
  if (detail.destinationAccount) entries.push(["Destino", detail.destinationAccount]);
  if (Number.isFinite(Number(detail.amount))) entries.push(["Monto", formatCurrency(Number(detail.amount))]);
  if (detail.alias) entries.push(["Alias", detail.alias]);
  if (detail.email) entries.push(["Correo", detail.email]);
  if (detail.message) entries.push(["Mensaje", detail.message]);
  if (detail.reason) entries.push(["Motivo", detail.reason]);
  if (detail.transferId) entries.push(["ID transferencia", detail.transferId]);
  if (detail.beneficiaryId) entries.push(["ID beneficiario", detail.beneficiaryId]);
  if (Array.isArray(detail.fields) && detail.fields.length > 0) entries.push(["Campos", detail.fields.join(", ")]);

  Object.entries(detail).forEach(([key, value]) => {
    const knownKeys = new Set([
      "sourceAccount",
      "destinationAccount",
      "amount",
      "alias",
      "email",
      "message",
      "reason",
      "transferId",
      "beneficiaryId",
      "fields",
    ]);

    if (knownKeys.has(key) || value === undefined || value === null || value === "") {
      return;
    }

    entries.push([
      key.replace(/([A-Z])/g, " $1").replace(/_/g, " "),
      typeof value === "object" ? JSON.stringify(value) : String(value),
    ]);
  });

  return entries.length ? entries : [["Detalle", "Sin detalle adicional"]];
}

function auditDetailText(log) {
  return auditDetailEntries(log)
    .map(([label, value]) => `${label} ${value}`)
    .join(" ");
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function useAccountLookup(accountNumber, { enabled = true } = {}) {
  const normalizedAccount = String(accountNumber || "").replace(/\D/g, "").slice(0, 10);
  const [lookup, setLookup] = useState({
    account: null,
    error: "",
    loading: false,
  });

  useEffect(() => {
    if (!enabled || normalizedAccount.length !== 10) {
      setLookup({ account: null, error: "", loading: false });
      return undefined;
    }

    let active = true;
    setLookup({ account: null, error: "", loading: true });

    const timeoutId = window.setTimeout(async () => {
      try {
        const account = await getAccountByNumber(normalizedAccount);
        if (active) {
          setLookup({ account, error: "", loading: false });
        }
      } catch (error) {
        if (active) {
          setLookup({ account: null, error: error.message, loading: false });
        }
      }
    }, 260);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [enabled, normalizedAccount]);

  return {
    ...lookup,
    accountNumber: normalizedAccount,
  };
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem("banco-nexus-theme") || "dark";
  });
  const [accentPalette, setAccentPalette] = useState(() => {
    if (typeof window === "undefined") {
      return "silver";
    }

    const savedAccent = window.localStorage.getItem("banco-nexus-accent");
    const savedTheme = window.localStorage.getItem("banco-nexus-theme") || "dark";
    return savedAccent || (savedTheme === "light" ? "gold" : "silver");
  });
  const transitionTimeoutRef = useRef(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(EMPTY_AUTH_FORM);
  const [dashboard, setDashboard] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [transferReceipt, setTransferReceipt] = useState(null);
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    alias: "",
    accountNumber: "",
  });
  const [transferForm, setTransferForm] = useState({
    beneficiaryId: "",
    destinationAccountNumber: "",
    amount: "",
    message: "",
  });

  const transactions = dashboard?.transactions || [];
  const beneficiaries = dashboard?.beneficiaries || [];
  const auditLogs = dashboard?.auditLogs || [];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("banco-nexus-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accentPalette;
    window.localStorage.setItem("banco-nexus-accent", accentPalette);
  }, [accentPalette]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (hasSession()) {
      loadDashboard({ silent: true });
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkHealth() {
      try {
        const response = await getSystemHealth();
        if (active) {
          setHealth(response);
        }
      } catch (error) {
        if (active) {
          setHealth({ status: "DOWN", error: error.message });
        }
      }
    }

    checkHealth();
    const intervalId = window.setInterval(checkHealth, HEALTH_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  function showNotice(type, message) {
    setNotice({ type, message });
  }

  async function loadDashboard({ silent = false } = {}) {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const data = await getDashboard();
      setDashboard(data);
      setProfileForm({
        name: data.user.name,
        phone: data.user.phone,
      });
    } catch (error) {
      showNotice("error", error.message);
      if (/sesion|token|autenticacion|expirada/i.test(error.message)) {
        logout();
        setDashboard(null);
      }
    } finally {
      setRefreshing(false);
    }
  }

  function updateAuthField(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const action = authMode === "login" ? loginClient : registerClient;
      const result = await action(authForm);
      setDashboard({
        user: result.user,
        account: result.account,
        transactions: [],
        beneficiaries: [],
        auditLogs: [],
      });
      setAuthForm(EMPTY_AUTH_FORM);
      setCurrentSection("dashboard");
      await loadDashboard({ silent: true });
      showNotice(
        "success",
        authMode === "login"
          ? "Sesion iniciada correctamente."
          : `Cuenta creada: ${result.user.accountNumber}.`,
      );
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitProfile(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(profileForm);
      setDashboard((current) => ({
        ...current,
        user: result.user,
      }));
      await loadDashboard({ silent: true });
      showNotice("success", "Perfil actualizado correctamente.");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitBeneficiary(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await createBeneficiary(beneficiaryForm);
      setBeneficiaryForm({ alias: "", accountNumber: "" });
      await loadDashboard({ silent: true });
      showNotice("success", "Cuenta destino registrada.");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitTransfer(event) {
    event.preventDefault();
    setNotice(null);

    const selectedBeneficiary = beneficiaries.find((beneficiary) => beneficiary.id === transferForm.beneficiaryId);
    const destinationAccountNumber = selectedBeneficiary?.accountNumber || transferForm.destinationAccountNumber;
    const amount = Number(transferForm.amount);
    const message = transferForm.message.trim() || "Transferencia Banco Nexus";

    if (!/^\d{10}$/.test(destinationAccountNumber || "")) {
      showNotice("error", "La cuenta destino debe tener exactamente 10 digitos.");
      return;
    }

    if (destinationAccountNumber === dashboard.user.accountNumber) {
      showNotice("error", "No puedes transferir a tu propia cuenta.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showNotice("error", "El monto debe ser un numero positivo.");
      return;
    }

    setLoading(true);

    try {
      const accountInfo = selectedBeneficiary
        ? null
        : await getAccountByNumber(destinationAccountNumber);

      setPendingTransfer({
        amount,
        message,
        beneficiaryId: transferForm.beneficiaryId,
        beneficiaryAlias: selectedBeneficiary?.alias || "",
        holderName: selectedBeneficiary?.holderName || accountInfo?.client?.name || "Titular Banco Nexus",
        sourceAccount: dashboard.user.accountNumber,
        destinationAccountNumber,
      });
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmTransfer() {
    if (!pendingTransfer) {
      return;
    }

    setLoading(true);

    try {
      const [result] = await Promise.all([
        createTransfer({
          beneficiaryId: pendingTransfer.beneficiaryId,
          destinationAccountNumber: pendingTransfer.destinationAccountNumber,
          amount: pendingTransfer.amount,
          message: pendingTransfer.message,
        }),
        wait(1120),
      ]);
      setTransferForm({
        beneficiaryId: "",
        destinationAccountNumber: "",
        amount: "",
        message: "",
      });
      setTransferReceipt({
        ...result,
        approvedAt: result.transaction?.date || new Date().toISOString(),
        holderName: pendingTransfer.holderName,
        message: pendingTransfer.message,
        status: "aprobada",
      });
      await loadDashboard({ silent: true });
      showNotice(
        "success",
        `${result.message}. Nuevo saldo: ${formatCurrency(result.newBalance)}.`,
      );
      setCurrentSection("historial");
    } catch (error) {
      setPendingTransfer(null);
      showNotice("error", error.message);
    } finally {
      setLoading(false);
    }
  }

  function closeSession() {
    logout();
    setDashboard(null);
    setNotice(null);
    setPendingTransfer(null);
    setTransferReceipt(null);
    setCurrentSection("dashboard");
  }

  function selectSection(section) {
    setCurrentSection(section);
    setMobileMenuOpen(false);
  }

  function playAppearanceTransition() {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.remove("theme-transitioning");
    void root.offsetWidth;
    root.classList.add("theme-transitioning");

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 980);
  }

  function selectTheme(nextTheme) {
    if (nextTheme === theme || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const applyTheme = () => {
      root.dataset.theme = nextTheme;
      window.localStorage.setItem("banco-nexus-theme", nextTheme);
      setTheme(nextTheme);
    };

    playAppearanceTransition();

    if (!prefersReducedMotion && document.startViewTransition) {
      document.startViewTransition(applyTheme);
      return;
    }

    window.requestAnimationFrame(applyTheme);
  }

  function selectAccentPalette(nextPalette) {
    if (nextPalette === accentPalette || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const applyAccent = () => {
      root.dataset.accent = nextPalette;
      window.localStorage.setItem("banco-nexus-accent", nextPalette);
      setAccentPalette(nextPalette);
    };

    playAppearanceTransition();

    if (!prefersReducedMotion && document.startViewTransition) {
      document.startViewTransition(applyAccent);
      return;
    }

    window.requestAnimationFrame(applyAccent);
  }

  const hasBeneficiarySelection = Boolean(transferForm.beneficiaryId);
  const creditTotal = transactions
    .filter(isCredit)
    .reduce((total, item) => total + item.amount, 0);
  const debitTotal = transactions
    .filter((item) => !isCredit(item))
    .reduce((total, item) => total + item.amount, 0);

  if (!dashboard) {
    return (
      <div className="auth-screen">
        <div className="auth-brand">
          <div className="brand-mark brand-mark-large">
            <Building2 size={32} />
          </div>
          <h1 className="brand-title">
            <span>Banco Nexus</span>
            <span className="brand-title-typewriter">
              <Typewriter
                text={NEXUS_CAPABILITIES}
                speed={42}
                initialDelay={350}
                waitTime={1650}
                deleteSpeed={24}
                className="brand-typewriter"
                cursorChar="_"
                cursorClassName="brand-typewriter-cursor"
              />
            </span>
          </h1>
          <p>Banca digital segura para saldos, cuentas destino, auditoría, reportes y transferencias en MXN.</p>
          <div className={`status-pill status-${getStatusTone(health)}`}>
            <span />
            {getStatusCopy(health)}
          </div>
          <ThemeToggle theme={theme} onThemeChange={selectTheme} />
        </div>

        <form className="auth-card" onSubmit={submitAuth}>
          {notice && (
            <div className={`notice notice-${notice.type}`}>
              {notice.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {notice.message}
            </div>
          )}

          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "active" : ""}
              type="button"
              onClick={() => setAuthMode("login")}
            >
              <LogIn size={16} />
              Iniciar Sesion
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              type="button"
              onClick={() => setAuthMode("register")}
            >
              <UserPlus size={16} />
              Crear Cuenta
            </button>
          </div>

          <div>
            <h2>{authMode === "login" ? "Acceso a tu cuenta" : "Registro de cliente"}</h2>
            <p>
              {authMode === "login"
                ? "Ingresa tus credenciales para entrar al dashboard."
                : "El sistema asignara automaticamente tu cuenta de 10 digitos."}
            </p>
          </div>

          {authMode === "register" && (
            <>
              <label className="form-field">
                Nombre completo
                <input
                  value={authForm.name}
                  onChange={(event) => updateAuthField("name", event.target.value)}
                  placeholder="Ana Gabriela Ruiz Mendoza"
                />
              </label>
              <label className="form-field">
                Telefono
                <input
                  value={authForm.phone}
                  onChange={(event) => updateAuthField("phone", event.target.value)}
                  placeholder="+52 55 1234 5678"
                />
              </label>
            </>
          )}

          <label className="form-field">
            Correo Electronico
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => updateAuthField("email", event.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </label>
          <label className="form-field">
            Contrasena
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => updateAuthField("password", event.target.value)}
              placeholder="********"
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : authMode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? "Procesando..." : authMode === "login" ? "Iniciar Sesion" : "Crear Cuenta"}
          </button>
          <div className="test-credentials">Prueba local: ana.ruiz@email.com / Banco123!</div>
        </form>
      </div>
    );
  }

  return (
    <div className="bank-app">
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-button" type="button" onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="brand-mark">
            <Building2 size={20} />
          </div>
          <div>
            <div className="brand-name">Banco Nexus</div>
            <div className="brand-subtitle" aria-label="Capacidades de Banco Nexus">
              <Typewriter
                text={NEXUS_CAPABILITIES}
                speed={34}
                initialDelay={180}
                waitTime={1600}
                deleteSpeed={22}
                className="topbar-typewriter"
                cursorChar="_"
                cursorClassName="topbar-typewriter-cursor"
              />
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <ThemeToggle theme={theme} onThemeChange={selectTheme} />
          <div className={`status-pill status-${getStatusTone(health)}`}>
            <span />
            {getStatusCopy(health)}
          </div>
          <div className="user-summary">
            <strong>{dashboard.user.name}</strong>
            <span>Cuenta: {dashboard.user.accountNumber}</span>
          </div>
          <button className="ghost-button" type="button" onClick={closeSession}>
            <LogOut size={17} />
            Salir
          </button>
        </div>
      </header>

      <div className="app-shell">
        {mobileMenuOpen && (
          <button
            aria-label="Cerrar menu"
            className="sidebar-backdrop"
            type="button"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
          <div className="sidebar-welcome">
            <div className="avatar-image">
              {dashboard.user.name
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </div>
            <span>{new Date().toLocaleDateString("es-MX", { weekday: "long", month: "long", day: "numeric" })}</span>
            <strong>Bienvenido, {dashboard.user.name.split(" ")[0]}.</strong>
          </div>

          <nav className="sidebar-nav-card" aria-label="Secciones principales">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={currentSection === item.id ? "active" : ""}
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item.id)}
                >
                  <Icon size={19} />
                  {item.label}
                </button>
              );
            })}
          </nav>

        </aside>

        <main className="content">
          {notice && (
            <div className={`notice notice-${notice.type}`}>
              {notice.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {notice.message}
            </div>
          )}

          {currentSection === "dashboard" && (
            <DashboardView
              auditLogs={auditLogs}
              beneficiaries={beneficiaries}
              dashboard={dashboard}
              isRefreshing={refreshing}
              onNavigate={selectSection}
              onRefresh={() => loadDashboard()}
              transactions={transactions}
            />
          )}

          {currentSection === "transferencias" && (
            <TransferView
              beneficiaries={beneficiaries}
              form={transferForm}
              hasBeneficiarySelection={hasBeneficiarySelection}
              loading={loading}
              ownAccountNumber={dashboard.user.accountNumber}
              onChange={setTransferForm}
              onSubmit={submitTransfer}
            />
          )}

          {currentSection === "cuentas" && (
            <BeneficiariesView
              beneficiaries={beneficiaries}
              form={beneficiaryForm}
              loading={loading}
              ownAccountNumber={dashboard.user.accountNumber}
              onChange={setBeneficiaryForm}
              onSubmit={submitBeneficiary}
            />
          )}

          {currentSection === "perfil" && (
            <ProfileView
              dashboard={dashboard}
              form={profileForm}
              loading={loading}
              onChange={setProfileForm}
              onSubmit={submitProfile}
            />
          )}

          {currentSection === "configuracion" && (
            <SettingsView
              accentPalette={accentPalette}
              onAccentChange={selectAccentPalette}
              onThemeChange={selectTheme}
              theme={theme}
            />
          )}

          {currentSection === "historial" && (
            <HistoryView
              creditTotal={creditTotal}
              debitTotal={debitTotal}
              transactions={transactions}
            />
          )}

          {currentSection === "bitacora" && (
            <AuditView auditLogs={auditLogs} />
          )}
        </main>
      </div>

      <MobileBottomNav currentSection={currentSection} isMenuOpen={mobileMenuOpen} onNavigate={selectSection} />

      {pendingTransfer && (
        <TransferConfirmModal
          loading={loading}
          receipt={transferReceipt}
          transfer={pendingTransfer}
          onCancel={() => {
            setPendingTransfer(null);
            setTransferReceipt(null);
          }}
          onConfirm={confirmTransfer}
          onReceiptClose={() => {
            setPendingTransfer(null);
            setTransferReceipt(null);
          }}
        />
      )}

      {transferReceipt && !pendingTransfer && (
        <TransferReceiptModal
          receipt={transferReceipt}
          onClose={() => setTransferReceipt(null)}
        />
      )}
    </div>
  );
}

function MobileBottomNav({ currentSection, isMenuOpen, onNavigate }) {
  return (
    <nav className={`mobile-bottom-nav ${isMenuOpen ? "is-hidden" : ""}`} aria-label="Navegacion movil">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentSection === item.id;

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "active" : ""}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="section-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function ThemeToggle({ theme, onThemeChange }) {
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      aria-label={theme === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      aria-pressed={theme === "light"}
      className={`theme-switch ${theme}`}
      type="button"
      onClick={() => onThemeChange(nextTheme)}
      title={theme === "light" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
    >
      <Moon className="theme-switch-icon moon-icon" size={16} />
      <Sun className="theme-switch-icon sun-icon" size={16} />
      <span className="theme-switch-knob" />
    </button>
  );
}

function TransferConfirmModal({ loading, onCancel, onConfirm, onReceiptClose, receipt, transfer }) {
  const isReceipt = Boolean(receipt);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className={`modal-card transfer-modal-card ${isReceipt ? "receipt-card is-receipt" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={isReceipt ? "receipt-title" : "confirm-transfer-title"}
      >
        {isReceipt ? (
          <div className="receipt-morph-view">
            <TransferReceiptContent receipt={receipt} onClose={onReceiptClose} />
          </div>
        ) : (
          <div className={`confirm-morph-view ${loading ? "is-confirming" : ""}`}>
            <div className="modal-heading">
              <div className="modal-icon">
                <Send size={20} />
              </div>
              <div>
                <h2 id="confirm-transfer-title">Confirmar transferencia</h2>
                <p>Revisa los datos antes de autorizar el movimiento.</p>
              </div>
            </div>

            <div className="receipt-grid">
              <ReceiptField label="Origen" value={transfer.sourceAccount} />
              <ReceiptField label="Destino" value={transfer.destinationAccountNumber} />
              <ReceiptField label="Titular / Alias" value={transfer.beneficiaryAlias || transfer.holderName} />
              <ReceiptField label="Monto" value={formatCurrency(transfer.amount)} strong />
              <ReceiptField label="Concepto" value={transfer.message} wide />
            </div>

            <div className={`modal-actions confirm-actions ${loading ? "is-confirming" : ""}`}>
              <button className="outline-button confirm-secondary-button" type="button" onClick={onCancel} disabled={loading}>
                Cancelar
              </button>
              <button
                className="primary-button fit-button confirm-primary-button"
                type="button"
                onClick={onConfirm}
                disabled={loading}
              >
                <span className="confirm-button-label">
                  <CheckCircle size={18} />
                  Confirmar
                </span>
              </button>
              {loading && (
                <span className="confirm-merged-check" role="status" aria-label="Confirmando transferencia">
                  <CheckCircle size={28} />
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function TransferReceiptModal({ onClose, receipt }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card receipt-card" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <TransferReceiptContent receipt={receipt} onClose={onClose} />
      </section>
    </div>
  );
}

function TransferReceiptContent({ onClose, receipt }) {
  return (
    <>
      <div className="receipt-topline">
        <div className="receipt-brand">
          <div className="brand-mark">
            <Building2 size={18} />
          </div>
          <div>
            <strong>Banco Nexus</strong>
            <span>Comprobante digital</span>
          </div>
        </div>
        <span className="badge badge-success">
          <CheckCircle size={13} />
          {receipt.status}
        </span>
      </div>

      <div className="receipt-hero">
        <span>Transferencia enviada</span>
        <h2 id="receipt-title">{formatCurrency(receipt.amount)}</h2>
        <p>{formatDateTime(receipt.approvedAt)}</p>
      </div>

      <div className="receipt-parties">
        <div>
          <span>Origen</span>
          <strong>{receipt.sourceAccount}</strong>
        </div>
        <div className="receipt-arrow" aria-hidden="true">
          <ArrowLeftRight size={18} />
        </div>
        <div>
          <span>Destino</span>
          <strong>{receipt.destinationAccount}</strong>
          <small>{receipt.holderName}</small>
        </div>
      </div>

      <div className="receipt-details">
        <ReceiptField label="Nuevo saldo" value={formatCurrency(receipt.newBalance)} strong />
        <ReceiptField label="Concepto" value={receipt.message} />
        <ReceiptField label="ID de transferencia" value={receipt.transferId} wide />
      </div>

      <div className="modal-actions">
        <button className="primary-button fit-button" type="button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </>
  );
}

function ReceiptField({ label, value, strong = false, wide = false }) {
  return (
    <div className={`receipt-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong className={strong ? "receipt-amount" : ""}>{value || "-"}</strong>
    </div>
  );
}

function DashboardView({
  auditLogs,
  beneficiaries,
  dashboard,
  isRefreshing,
  onNavigate,
  onRefresh,
  transactions,
}) {
  const [period, setPeriod] = useState("month");
  const firstName = dashboard.user.name.split(" ")[0];
  const periodOption = getPeriodOption(period);
  const periodTransactions = filterTransactionsByPeriod(transactions, period);
  const recentTransactions = periodTransactions.slice(0, 5);

  return (
    <div className="section-stack nexus-section">
      <SectionHeader
        title="Dashboard"
        description={`Bienvenido, ${firstName}. Tu panel financiero esta listo.`}
        action={
          <div className="widget-toolbar">
            <button className="toolbar-pill" type="button" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={isRefreshing ? "spin" : ""} size={16} />
              Actualizar
            </button>
            <button className="add-widget-button" type="button" onClick={() => onNavigate("transferencias")}>
              <Send size={17} />
              Nueva transferencia
            </button>
          </div>
        }
      />

      <section className="nexus-dashboard-grid">
        <NexusSummaryCard auditLogs={auditLogs} beneficiaries={beneficiaries} periodLabel={periodOption.label} transactions={periodTransactions} />
        <BalanceOverviewCard
          accountNumber={dashboard.user.accountNumber}
          balance={dashboard.account?.balance || 0}
          period={period}
          transactions={periodTransactions}
          onPeriodChange={setPeriod}
        />
        <EarningsGaugeCard periodOption={periodOption} transactions={periodTransactions} />
        <TransactionsWidget onNavigate={onNavigate} transactions={recentTransactions} />
        <SpendingWidget periodLabel={periodOption.label} transactions={periodTransactions} />
      </section>
    </div>
  );
}

function NexusSummaryCard({ auditLogs, beneficiaries, periodLabel, transactions }) {
  const transferCount = transactions.filter((item) => item.type?.startsWith("transfer")).length;
  const failedEvents = auditLogs.filter((log) => log.status === "fallido").length;

  return (
    <article className="nexus-widget nexus-summary-card">
      <div className="widget-kicker">
        <ShieldCheck size={18} />
        Banco Nexus
      </div>
      <div className="summary-visual" aria-hidden="true">
        <span />
        <i />
        <b />
      </div>
      <div className="summary-card-copy">
        <h2>Panel de transferencias</h2>
        <p>
          {transferCount > 0
            ? `${transferCount} transferencia(s) en ${periodLabel.toLowerCase()}.`
            : `Sin transferencias en ${periodLabel.toLowerCase()}.`}
        </p>
      </div>
      <div className="summary-chip-row">
        <span>{beneficiaries.length} cuentas destino</span>
        <span>{failedEvents} eventos fallidos</span>
      </div>
    </article>
  );
}

function BalanceOverviewCard({ accountNumber, balance, period, transactions, onPeriodChange }) {
  const credits = sumTransactions(transactions, isCredit);
  const debits = sumTransactions(transactions, (item) => !isCredit(item));
  const netChange = credits - debits;
  const chartValues = buildBalanceSeries(transactions, balance);

  return (
    <article className="nexus-widget balance-overview-card">
      <div className="widget-header">
        <div>
          <span>Resumen de saldo</span>
          <strong>{formatCurrency(balance)}</strong>
        </div>
        <div className="account-badge">
          <CreditCard size={16} />
          {accountNumber}
        </div>
      </div>
      <div className="balance-tabs" role="tablist" aria-label="Periodo del saldo">
        {PERIOD_OPTIONS.map((option) => (
          <button
            aria-pressed={period === option.id}
            className={period === option.id ? "active" : ""}
            key={option.id}
            type="button"
            onClick={() => onPeriodChange(option.id)}
          >
            {option.shortLabel}
          </button>
        ))}
      </div>
      <MiniLineChart key={`chart-${period}`} values={chartValues} />
      <div className="balance-footer">
        <div>
          <small>Cambio neto</small>
          <b className={netChange >= 0 ? "money-in" : "money-out"}>{formatCurrency(netChange)}</b>
        </div>
        <div>
          <small>Categorías</small>
          <b>{Math.max(1, new Set(transactions.map((item) => item.type)).size)}</b>
        </div>
      </div>
    </article>
  );
}

function EarningsGaugeCard({ periodOption, transactions }) {
  const credits = sumTransactions(transactions, isCredit);
  const debits = sumTransactions(transactions, (item) => !isCredit(item));
  const dailyAverage = credits / periodOption.days;
  const retained = credits > 0 ? Math.max(0, credits - debits) : 0;
  const retention = credits > 0 ? Math.round((retained / credits) * 100) : 0;

  return (
    <article className="nexus-widget earnings-card">
      <div className="widget-header compact">
        <span>Ingresos</span>
        <TrendingUp size={18} />
      </div>
      <div className="gauge-wrap">
        <RetentionGauge value={retention} />
        <div className="gauge-center">
          <strong>{retention}%</strong>
          <span>Retención</span>
        </div>
      </div>
      <div className="earnings-stats">
        <div>
          <small>Entradas</small>
          <b>{formatCurrency(credits)}</b>
        </div>
        <div>
          <small>Promedio diario</small>
          <b>{formatCurrency(dailyAverage)}</b>
        </div>
      </div>
      {debits > 0 && <span className="earnings-helper">Salidas: {formatCurrency(debits)}</span>}
    </article>
  );
}

function RetentionGauge({ value }) {
  const progress = Math.min(100, Math.max(0, value));
  const dashOffset = 100 - progress;
  const arcPath = "M 34 118 A 86 86 0 0 1 206 118";

  return (
    <svg className="retention-gauge" viewBox="0 0 240 142" role="img" aria-label={`Retención ${progress}%`}>
      <defs>
        <linearGradient id="retentionGaugeStroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--chart-start)" />
          <stop offset="58%" stopColor="var(--chart-mid)" />
          <stop offset="100%" stopColor="var(--chart-end)" />
        </linearGradient>
        <filter id="retentionGaugeGlow" x="-30%" y="-50%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path className="retention-track" d={arcPath} pathLength="100" />
      <path
        className="retention-progress-glow"
        d={arcPath}
        filter="url(#retentionGaugeGlow)"
        pathLength="100"
        style={{ strokeDashoffset: dashOffset }}
      />
      <path
        className="retention-progress"
        d={arcPath}
        pathLength="100"
        style={{ strokeDashoffset: dashOffset }}
      />
    </svg>
  );
}

function TransactionsWidget({ onNavigate, transactions }) {
  return (
    <article className="nexus-widget transactions-widget">
      <div className="widget-header">
        <div>
          <span>Movimientos</span>
          <strong>Actividad reciente</strong>
        </div>
        <button className="mini-icon-button" type="button" onClick={() => onNavigate("historial")} aria-label="Ver historial completo">
          <ArrowUpRight size={18} />
        </button>
      </div>
      {transactions.length === 0 ? (
        <EmptyState icon={History} title="Sin movimientos" text="Las transferencias apareceran aqui." />
      ) : (
        <div className="nexus-transaction-list">
          {transactions.map((transaction) => {
            const credit = isCredit(transaction);
            return (
              <div className="nexus-transaction-row" key={transaction.id}>
                <div className={`movement-icon ${credit ? "credit" : "debit"}`}>
                  {credit ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
                </div>
                <div>
                  <strong>{typeLabel(transaction.type)}</strong>
                  <span>{transaction.description || "Movimiento bancario"}</span>
                </div>
                <time>{formatDateTime(transaction.date)}</time>
                <b className={credit ? "money-in" : "money-out"}>
                  {credit ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </b>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function SpendingWidget({ periodLabel, transactions }) {
  const spending = getSpendingBreakdown(transactions);

  return (
    <article className="nexus-widget spending-widget">
      <div className="widget-header compact">
        <span>Gastos</span>
        <PieChart size={18} />
      </div>
      <strong className="spending-total">{formatCurrency(spending.total)}</strong>
      <div className="spending-bars">
        {spending.categories.map((category) => (
          <div className="spending-bar-row" key={category.label}>
            <span>{category.label}</span>
            <div className="spending-track">
              <i style={{ width: `${category.percentage}%` }} />
            </div>
            <b>{category.percentage}%</b>
          </div>
        ))}
      </div>
      <div className="spending-note">
        <Shield size={16} />
        {periodLabel}
      </div>
    </article>
  );
}

function MiniLineChart({ values }) {
  const geometry = buildLineGeometry(values);
  const lastPoint = geometry.points[geometry.points.length - 1];
  const calloutX = Math.min(286, Math.max(36, lastPoint.x - 32));
  const calloutY = Math.max(20, lastPoint.y - 18);

  return (
    <svg className="mini-line-chart" viewBox="0 0 360 140" role="img" aria-label="Tendencia del saldo">
      <defs>
        <linearGradient id="balanceStroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--chart-start)" />
          <stop offset="55%" stopColor="var(--chart-mid)" />
          <stop offset="100%" stopColor="var(--chart-end)" />
        </linearGradient>
        <linearGradient id="balanceArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-area)" />
          <stop offset="100%" stopColor="var(--chart-area-end)" />
        </linearGradient>
        <filter id="balanceGlow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {geometry.points.map((point, index) => (
        <rect
          className="chart-column"
          height={Math.max(8, 130 - point.y)}
          key={`bar-${index}`}
          rx="4"
          width="8"
          x={point.x - 4}
          y={point.y}
        />
      ))}
      <path className="chart-grid-line" d="M20 38H340" />
      <path className="chart-grid-line" d="M20 74H340" />
      <path className="chart-grid-line" d="M20 110H340" />
      <path
        className="chart-area"
        d={geometry.area}
      />
      <path
        className="chart-line-glow"
        d={geometry.line}
        filter="url(#balanceGlow)"
      />
      <path
        className="chart-line"
        d={geometry.line}
      />
      {geometry.points.map((point, index) => (
        <circle className="chart-dot" cx={point.x} cy={point.y} key={`${point.value}-${index}`} r={index === geometry.points.length - 1 ? "5" : "3.5"} />
      ))}
      <g className="chart-callout" transform={`translate(${calloutX.toFixed(1)} ${calloutY.toFixed(1)})`}>
        <rect height="24" rx="12" width="70" />
        <text x="35" y="16">{formatCurrency(lastPoint.value)}</text>
      </g>
    </svg>
  );
}

function MetricCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="metric-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
      <Icon size={22} />
    </article>
  );
}

function Panel({ title, description, children }) {
  return (
    <section className="panel-card">
      <div className="panel-heading">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

function MovementItem({ transaction }) {
  const credit = isCredit(transaction);

  return (
    <div className="movement-item">
      <div className={`movement-icon ${credit ? "credit" : "debit"}`}>
        {credit ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
      </div>
      <div>
        <strong>{typeLabel(transaction.type)}</strong>
        <span>{transaction.description}</span>
        <small>{formatDateTime(transaction.date)}</small>
      </div>
      <b className={credit ? "money-in" : "money-out"}>
        {credit ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </b>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={42} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function AccountLookupStatus({ account, accountNumber, emptyText, error, loading, ownAccountNumber }) {
  const digits = String(accountNumber || "").replace(/\D/g, "").slice(0, 10);
  const isOwnAccount = account?.accountNumber && account.accountNumber === ownAccountNumber;

  if (loading) {
    return (
      <div className="account-lookup-card account-lookup-loading">
        <Loader2 className="spin" size={17} />
        <div>
          <strong>Buscando titular...</strong>
          <span>Validando cuenta {digits}.</span>
        </div>
      </div>
    );
  }

  if (isOwnAccount) {
    return (
      <div className="account-lookup-card account-lookup-error">
        <AlertCircle size={17} />
        <div>
          <strong>Es tu propia cuenta</strong>
          <span>No puedes registrar ni transferir a tu misma cuenta.</span>
        </div>
      </div>
    );
  }

  if (account?.accountNumber) {
    return (
      <div className="account-lookup-card account-lookup-success">
        <CheckCircle size={17} />
        <div>
          <strong>{account.client?.name || "Titular Banco Nexus"}</strong>
          <span>
            Cuenta {account.accountNumber}
            {account.active === false ? " - inactiva" : " - activa"}
          </span>
        </div>
      </div>
    );
  }

  if (error && digits.length === 10) {
    return (
      <div className="account-lookup-card account-lookup-error">
        <AlertCircle size={17} />
        <div>
          <strong>No se encontro la cuenta</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="account-lookup-card">
      <User size={17} />
      <div>
        <strong>Titular automatico</strong>
        <span>{emptyText}</span>
      </div>
    </div>
  );
}

function TransferView({
  beneficiaries,
  form,
  hasBeneficiarySelection,
  loading,
  ownAccountNumber,
  onChange,
  onSubmit,
}) {
  const selectedBeneficiary = beneficiaries.find((beneficiary) => beneficiary.id === form.beneficiaryId);
  const accountLookup = useAccountLookup(form.destinationAccountNumber, {
    enabled: !hasBeneficiarySelection,
  });

  return (
    <div className="section-stack">
      <SectionHeader
        title="Transferencias"
        description="Envia dinero a otras cuentas de forma segura"
      />

      <Panel title="Nueva Transferencia" description="Completa los datos de la operacion">
        <form className="form-grid form-narrow" onSubmit={onSubmit}>
          <label className="form-field">
            Cuenta registrada
            <select
              value={form.beneficiaryId}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  beneficiaryId: event.target.value,
                }))
              }
            >
              <option value="">Usar cuenta manual</option>
              {beneficiaries.map((beneficiary) => (
                <option key={beneficiary.id} value={beneficiary.id}>
                  {beneficiary.alias} - {beneficiary.accountNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Cuenta destino
            <input
              disabled={hasBeneficiarySelection}
              inputMode="numeric"
              maxLength="10"
              placeholder="1800000021"
              value={form.destinationAccountNumber}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                onChange((current) => ({
                  ...current,
                  destinationAccountNumber: value,
                }));
              }}
            />
            <small>{form.destinationAccountNumber.length}/10 digitos</small>
          </label>

          <AccountLookupStatus
            accountNumber={hasBeneficiarySelection ? selectedBeneficiary?.accountNumber : form.destinationAccountNumber}
            account={hasBeneficiarySelection
              ? {
                  accountNumber: selectedBeneficiary?.accountNumber,
                  active: true,
                  client: { name: selectedBeneficiary?.holderName },
                }
              : accountLookup.account}
            emptyText={hasBeneficiarySelection ? "Cuenta registrada seleccionada." : "Escribe 10 digitos para verificar el titular."}
            error={hasBeneficiarySelection ? "" : accountLookup.error}
            loading={hasBeneficiarySelection ? false : accountLookup.loading}
            ownAccountNumber={ownAccountNumber}
          />

          <label className="form-field">
            Monto a transferir
            <input
              inputMode="decimal"
              min="0.01"
              onKeyDown={blockInvalidAmountKey}
              pattern="^[0-9]+([.,][0-9]{0,2})?$"
              step="0.01"
              type="text"
              placeholder="0.00"
              value={form.amount}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  amount: sanitizeAmountInput(event.target.value),
                }))
              }
            />
            <small>Solo numeros y hasta 2 decimales.</small>
          </label>

          <label className="form-field">
            Concepto / Mensaje
            <textarea
              rows="3"
              placeholder="Descripcion de la transferencia"
              value={form.message}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            {loading ? "Procesando Transferencia..." : "Transferir"}
          </button>
        </form>
      </Panel>
    </div>
  );
}

function BeneficiariesView({ beneficiaries, form, loading, ownAccountNumber, onChange, onSubmit }) {
  const accountLookup = useAccountLookup(form.accountNumber);

  useEffect(() => {
    const holderName = accountLookup.account?.client?.name;

    if (!holderName) {
      return;
    }

    onChange((current) => {
      if (current.accountNumber !== accountLookup.accountNumber || current.alias.trim()) {
        return current;
      }

      return {
        ...current,
        alias: holderName,
      };
    });
  }, [accountLookup.account?.client?.name, accountLookup.accountNumber, onChange]);

  return (
    <div className="section-stack">
      <SectionHeader
        title="Cuentas Destino"
        description="Administra las cuentas para transferencias frecuentes"
      />

      <section className="two-column">
        <Panel title="Registrar Nueva Cuenta" description="Agrega una cuenta para transferencias rapidas">
          <form className="form-grid" onSubmit={onSubmit}>
            <label className="form-field">
              Alias
              <input
                placeholder="Se sugerira con el titular"
                value={form.alias}
                onChange={(event) =>
                  onChange((current) => ({ ...current, alias: event.target.value }))
                }
              />
              <small>Opcional si la cuenta existe: Banco Nexus puede sugerir el nombre del titular.</small>
            </label>
            <label className="form-field">
              Numero de cuenta
              <input
                inputMode="numeric"
                maxLength="10"
                placeholder="10 digitos"
                value={form.accountNumber}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                  onChange((current) => ({ ...current, accountNumber: value }));
                }}
              />
              <small>{form.accountNumber.length}/10 digitos</small>
            </label>

            <AccountLookupStatus
              accountNumber={form.accountNumber}
              account={accountLookup.account}
              emptyText="Escribe 10 digitos para encontrar el titular."
              error={accountLookup.error}
              loading={accountLookup.loading}
              ownAccountNumber={ownAccountNumber}
            />

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
              Registrar Cuenta
            </button>
          </form>
        </Panel>

        <Panel title="Cuentas Registradas" description={`${beneficiaries.length} cuenta(s) destino`}>
          {beneficiaries.length === 0 ? (
            <EmptyState icon={Users} title="Sin cuentas registradas" text="Agrega una cuenta para transferir mas rapido." />
          ) : (
            <div className="beneficiary-list">
              {beneficiaries.map((beneficiary) => (
                <div className="beneficiary-card" key={beneficiary.id}>
                  <div className="avatar-icon">
                    <User size={18} />
                  </div>
                  <div>
                    <strong>{beneficiary.alias}</strong>
                    <span>{beneficiary.holderName}</span>
                    <code>{beneficiary.accountNumber}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}

function ProfileView({ dashboard, form, loading, onChange, onSubmit }) {
  const hasChanges = form.name !== dashboard.user.name || form.phone !== dashboard.user.phone;

  return (
    <div className="section-stack">
      <SectionHeader title="Mi Perfil" description="Administra tu informacion personal" />

      <section className="profile-grid">
        <Panel title="Informacion de Cuenta" description="Datos no editables">
          <div className="readonly-list">
            <ReadonlyItem icon={Mail} label="Correo Electronico" value={dashboard.user.email} />
            <ReadonlyItem icon={CreditCard} label="Numero de Cuenta" value={dashboard.user.accountNumber} locked />
            <ReadonlyItem icon={ShieldCheck} label="Cuenta" value={dashboard.account?.accountType || "ahorro"} />
          </div>
        </Panel>

        <Panel title="Editar Perfil" description="Actualiza tus datos generales">
          <form className="form-grid" onSubmit={onSubmit}>
            <label className="form-field">
              Nombre completo
              <input
                value={form.name}
                onChange={(event) =>
                  onChange((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="form-field">
              Telefono
              <input
                value={form.phone}
                onChange={(event) =>
                  onChange((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <button className="primary-button fit-button" type="submit" disabled={loading || !hasChanges}>
              {loading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </form>
        </Panel>
      </section>
    </div>
  );
}

function SettingsView({ accentPalette, onAccentChange, onThemeChange, theme }) {
  return (
    <div className="section-stack">
      <SectionHeader title="Configuración" description="Personaliza la apariencia de Banco Nexus" />

      <section className="settings-grid">
        <Panel title="Tema" description="Modo visual">
          <div className="theme-mode-grid">
            <button
              className={`theme-mode-card ${theme === "dark" ? "active" : ""}`}
              type="button"
              onClick={() => onThemeChange("dark")}
            >
              <Moon size={18} />
              <strong>Oscuro</strong>
              <span>Negro y contraste alto</span>
            </button>
            <button
              className={`theme-mode-card ${theme === "light" ? "active" : ""}`}
              type="button"
              onClick={() => onThemeChange("light")}
            >
              <Sun size={18} />
              <strong>Claro</strong>
              <span>Blanco y lectura amplia</span>
            </button>
          </div>
        </Panel>

        <Panel title="Color de la web" description="Paleta principal">
          <div className="palette-grid">
            {ACCENT_OPTIONS.map((option) => (
              <button
                aria-pressed={accentPalette === option.id}
                className={`palette-option ${accentPalette === option.id ? "active" : ""}`}
                key={option.id}
                style={{
                  "--swatch-a": option.colors[0],
                  "--swatch-b": option.colors[1],
                  "--swatch-c": option.colors[2],
                }}
                type="button"
                onClick={() => onAccentChange(option.id)}
              >
                <span className="palette-swatch" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        </Panel>
      </section>

      <section className="appearance-preview">
        <div>
          <span>
            <Palette size={16} />
            Vista previa
          </span>
          <strong>Banco Nexus</strong>
          <small>{ACCENT_OPTIONS.find((option) => option.id === accentPalette)?.label}</small>
        </div>
        <div className="preview-lines" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </section>
    </div>
  );
}

function ReadonlyItem({ icon: Icon, label, value, locked }) {
  return (
    <div className="readonly-item">
      <span>
        <Icon size={16} />
        {label}
      </span>
      <strong>
        {locked && <Lock size={15} />}
        {value}
      </strong>
    </div>
  );
}

function HistoryView({ transactions }) {
  const [filters, setFilters] = useState({
    from: "",
    query: "",
    to: "",
    type: "all",
  });
  const filteredTransactions = transactions.filter((transaction) => {
    const query = normalizeSearch(filters.query);
    const credit = isCredit(transaction);
    const haystack = normalizeSearch([
      typeLabel(transaction.type),
      transaction.description,
      transaction.sourceAccount,
      transaction.destinationAccount,
      transaction.amount,
      transaction.resultingBalance,
      formatDateTime(transaction.date),
    ].join(" "));

    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }

    if (!isWithinDateRange(transaction.date, filters.from, filters.to)) {
      return false;
    }

    return !query || haystack.includes(query) || (query === "abono" && credit) || (query === "cargo" && !credit);
  });
  const filteredCreditTotal = sumTransactions(filteredTransactions, isCredit);
  const filteredDebitTotal = sumTransactions(filteredTransactions, (item) => !isCredit(item));

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="section-stack history-section">
      <SectionHeader title="Historial de Movimientos" description="Consulta todas las transacciones de tu cuenta" />

      <Panel
        title="Movimientos"
        description={`${filteredTransactions.length} de ${transactions.length} movimiento(s)`}
      >
        <div className="filter-bar history-filter-bar">
          <label className="filter-field filter-field-wide">
            Buscar
            <input
              placeholder="Cuenta, concepto, monto o fecha"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
            />
          </label>
          <label className="filter-field">
            Tipo
            <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
              <option value="all">Todos</option>
              <option value="deposit">Abonos</option>
              <option value="withdrawal">Cargos</option>
              <option value="transfer_in">Transferencias recibidas</option>
              <option value="transfer_out">Transferencias enviadas</option>
            </select>
          </label>
          <label className="filter-field">
            Desde
            <input type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} />
          </label>
          <label className="filter-field">
            Hasta
            <input type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} />
          </label>
        </div>

        {transactions.length === 0 ? (
          <EmptyState icon={History} title="Sin movimientos" text="Los movimientos apareceran aqui." />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState icon={History} title="Sin resultados" text="Ajusta los filtros para ver mas movimientos." />
        ) : (
          <>
            <div className="table-wrap history-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Cuenta Origen</th>
                    <th>Cuenta Destino</th>
                    <th>Monto</th>
                    <th>Saldo Resultante</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const credit = isCredit(transaction);
                    return (
                      <tr key={transaction.id}>
                        <td>{formatDateTime(transaction.date)}</td>
                        <td>
                          <span className={`badge ${credit ? "badge-success" : "badge-danger"}`}>
                            {credit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {typeLabel(transaction.type)}
                          </span>
                        </td>
                        <td>{transaction.description}</td>
                        <td><code>{transaction.sourceAccount || "-"}</code></td>
                        <td><code>{transaction.destinationAccount || "-"}</code></td>
                        <td className={credit ? "money-in" : "money-out"}>
                          {credit ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td>{formatCurrency(transaction.resultingBalance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mobile-history-list" aria-label="Movimientos filtrados">
              {filteredTransactions.map((transaction) => (
                <HistoryMobileCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </>
        )}
      </Panel>

      <section className="metric-grid">
        <MetricCard icon={TrendingUp} label="Total Abonos" value={formatCurrency(filteredCreditTotal)} helper={`${filteredTransactions.filter(isCredit).length} transacciones filtradas`} />
        <MetricCard icon={TrendingDown} label="Total Cargos" value={formatCurrency(filteredDebitTotal)} helper={`${filteredTransactions.filter((item) => !isCredit(item)).length} transacciones filtradas`} />
        <MetricCard icon={CreditCard} label="Diferencia Neta" value={formatCurrency(filteredCreditTotal - filteredDebitTotal)} helper="Abonos - Cargos" />
      </section>
    </div>
  );
}

function HistoryMobileCard({ transaction }) {
  const credit = isCredit(transaction);

  return (
    <article className="history-mobile-card">
      <div className="history-mobile-head">
        <div className={`movement-icon ${credit ? "credit" : "debit"}`}>
          {credit ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
        </div>
        <div className="history-mobile-title">
          <span className={`badge ${credit ? "badge-success" : "badge-danger"}`}>
            {credit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {typeLabel(transaction.type)}
          </span>
          <time>{formatDateTime(transaction.date)}</time>
        </div>
        <strong className={`history-mobile-amount ${credit ? "money-in" : "money-out"}`}>
          {credit ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </strong>
      </div>

      <p className="history-mobile-description">{transaction.description || "Movimiento bancario"}</p>

      <div className="history-mobile-accounts">
        <span>
          <small>Origen</small>
          <code>{transaction.sourceAccount || "-"}</code>
        </span>
        <span>
          <small>Destino</small>
          <code>{transaction.destinationAccount || "-"}</code>
        </span>
      </div>

      <div className="history-mobile-balance">
        <span>Saldo resultante</span>
        <strong>{formatCurrency(transaction.resultingBalance)}</strong>
      </div>
    </article>
  );
}

function AuditView({ auditLogs }) {
  const [filters, setFilters] = useState({
    action: "all",
    from: "",
    query: "",
    status: "all",
    to: "",
  });
  const successful = auditLogs.filter((log) => log.status === "exitoso").length;
  const failed = auditLogs.filter((log) => log.status === "fallido").length;
  const pending = auditLogs.filter((log) => log.status === "pendiente").length;
  const actions = [...new Set(auditLogs.map((log) => log.action).filter(Boolean))];
  const filteredLogs = auditLogs.filter((log) => {
    const query = normalizeSearch(filters.query);
    const haystack = normalizeSearch([
      formatDateTime(log.createdAt),
      actionLabel(log.action, log.status),
      log.status,
      log.accountNumber,
      auditDetailText(log),
    ].join(" "));

    if (filters.status !== "all" && log.status !== filters.status) {
      return false;
    }

    if (filters.action !== "all" && log.action !== filters.action) {
      return false;
    }

    if (!isWithinDateRange(log.createdAt, filters.from, filters.to)) {
      return false;
    }

    return !query || haystack.includes(query);
  });

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="section-stack">
      <SectionHeader title="Bitácora de Auditoría" description="Registro de actividad y seguridad de tu cuenta" />

      <section className="security-note">
        <Shield size={19} />
        <div>
          <strong>Nota de Seguridad</strong>
          <span>Esta bitacora registra actividad critica de la cuenta para detectar operaciones sospechosas.</span>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard icon={CheckCircle} label="Exitosos" value={successful} helper="Eventos correctos" />
        <MetricCard icon={AlertCircle} label="Fallidos" value={failed} helper="Eventos rechazados" />
        <MetricCard icon={Clock} label="Pendientes" value={pending} helper="Eventos en revision" />
      </section>

      <Panel title="Registro de Eventos" description={`${filteredLogs.length} de ${auditLogs.length} evento(s)`}>
        <div className="filter-bar audit-filter-bar">
          <label className="filter-field filter-field-wide">
            Buscar
            <input
              placeholder="Cuenta, accion, estado, motivo o monto"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
            />
          </label>
          <label className="filter-field">
            Estado
            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option value="all">Todos</option>
              <option value="exitoso">Exitosos</option>
              <option value="fallido">Fallidos</option>
              <option value="pendiente">Pendientes</option>
            </select>
          </label>
          <label className="filter-field">
            Acción
            <select value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}>
              <option value="all">Todas</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {actionLabel(action)}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            Desde
            <input type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} />
          </label>
          <label className="filter-field">
            Hasta
            <input type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} />
          </label>
        </div>

        {auditLogs.length === 0 ? (
          <EmptyState icon={Shield} title="Sin eventos registrados" text="La actividad de tu cuenta se registrara aqui." />
        ) : filteredLogs.length === 0 ? (
          <EmptyState icon={Shield} title="Sin resultados" text="Ajusta los filtros para revisar otros eventos." />
        ) : (
          <div className="audit-list audit-list-table">
            {filteredLogs.map((log) => (
              <AuditRow key={log._id || log.id} log={log} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AuditRow({ compact = false, log }) {
  const details = auditDetailEntries(log);

  return (
    <div className={`audit-row ${compact ? "compact" : ""}`}>
      <span>{formatDateTime(log.createdAt)}</span>
      <strong>{actionLabel(log.action, log.status)}</strong>
      <em className={`badge badge-${log.status === "fallido" ? "danger" : log.status === "pendiente" ? "warning" : "success"}`}>
        {statusIcon(log.status)}
        {log.status}
      </em>
      {!compact && (
        <div className="audit-detail-list">
          {details.map(([label, value]) => (
            <span key={`${label}-${value}`}>
              <b>{label}:</b> {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
