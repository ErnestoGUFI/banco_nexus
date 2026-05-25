function getStatusCopy(health) {
  if (!health) {
    return "Verificando replica";
  }

  if (health.status === "DOWN") {
    return "Replica sin respuesta";
  }

  if (health.status === "DEGRADED") {
    return `Latencia ${health.latencyMs} ms`;
  }

  return health.primary ? `Primario ${health.primary}` : "Replica en linea";
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

export default function Header({ health }) {
  return (
    <header className="app-header">
      <div>
        <div className="logo">⬡ Banco Nexus</div>
        <div className="logo-subtitle">Sistema de Gestión Distribuida</div>
      </div>
      <div className="system-status">
        <span className={`status-dot status-dot-${getStatusTone(health)}`} />
        {getStatusCopy(health)}
      </div>
    </header>
  );
}
