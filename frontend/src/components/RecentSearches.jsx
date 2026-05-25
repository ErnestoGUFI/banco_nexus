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
            key={item.accountNumber}
            className="recent-search-chip"
            type="button"
            onClick={() => onSelect(item.accountNumber)}
          >
            <span className="recent-search-chip-account">{item.accountNumber}</span>
            <span className="recent-search-chip-meta">
              {item.name} · {item.accountType}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
