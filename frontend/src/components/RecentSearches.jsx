export default function RecentSearches({ items, onSelect }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="recent-searches">
      <div className="field-label recent-searches-label">Acceso rápido</div>
      <div className="recent-searches-list">
        {items.map((item) => (
          <button
            key={item.cuenta}
            className="recent-search-chip"
            type="button"
            onClick={() => onSelect(item.cuenta)}
          >
            <span className="recent-search-chip-account">{item.cuenta}</span>
            <span className="recent-search-chip-meta">
              {item.nombre} · {item.tipo}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
