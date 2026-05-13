export default function Header() {
  return (
    <header className="app-header">
      <div>
        <div className="logo">⬡ Banco Nexus</div>
        <div className="logo-subtitle">Sistema de Gestión Distribuida</div>
      </div>
      <div className="system-status">
        <span className="status-dot" />
        Sistema en línea
      </div>
    </header>
  );
}
