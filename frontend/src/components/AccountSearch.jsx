export default function AccountSearch({
  accountInput,
  error,
  loading,
  onAccountInputChange,
  onSearch,
}) {
  return (
    <section className="search-box">
      <label className="field-label" htmlFor="account-search">
        Número de cuenta
      </label>
      <div className="input-row">
        <input
          id="account-search"
          className="text-input"
          placeholder="Ej: 1000000001"
          value={accountInput}
          onChange={(event) => onAccountInputChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSearch()}
        />
        <button className="button-primary" onClick={onSearch} disabled={loading}>
          {loading ? "..." : "Consultar"}
        </button>
      </div>
      {error && <div className="message message-error">x {error}</div>}
    </section>
  );
}
