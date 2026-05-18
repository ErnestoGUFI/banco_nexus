import { BRANCHES } from "../constants/branches";

function OperationCard({
  amount,
  buttonLabel,
  message,
  messageType,
  title,
  inputLabel,
  tone,
  loading,
  onAmountChange,
  onSubmit,
}) {
  return (
    <article className="operation-card">
      <div className="section-title">{title}</div>
      <label className="card-label">{inputLabel}</label>
      <input
        type="number"
        min="1"
        className="amount-input"
        placeholder="0.00"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
      />
      <button
        className={`button-secondary button-${tone}`}
        onClick={onSubmit}
        disabled={loading}
      >
        {buttonLabel}
      </button>
      {message && <div className={`message message-${messageType}`}>{message}</div>}
    </article>
  );
}

export default function OperationsPanel({
  branch,
  depositAmount,
  depositMessage,
  depositMessageType,
  loading,
  onBranchChange,
  withdrawalAmount,
  withdrawalMessage,
  withdrawalMessageType,
  onDepositAmountChange,
  onDepositSubmit,
  onWithdrawalAmountChange,
  onWithdrawalSubmit,
}) {
  return (
    <section className="operations-grid">
      <article className="operation-card operation-card-branch">
        <div className="section-title">Sucursal Remota</div>
        <label className="card-label" htmlFor="branch-selector">
          Operar desde
        </label>
        <select
          id="branch-selector"
          className="select-input"
          value={branch}
          onChange={(event) => onBranchChange(event.target.value)}
        >
          {BRANCHES.map((branchOption) => (
            <option key={branchOption} value={branchOption}>
              {branchOption}
            </option>
          ))}
        </select>
        <div className="card-subtitle">
          El origen se registrará en cada depósito y retiro.
        </div>
      </article>
      <OperationCard
        amount={depositAmount}
        buttonLabel="+ Depositar"
        inputLabel="Monto a depositar (MXN)"
        message={depositMessage}
        messageType={depositMessageType}
        title="Depósito"
        tone="deposit"
        loading={loading}
        onAmountChange={onDepositAmountChange}
        onSubmit={onDepositSubmit}
      />
      <OperationCard
        amount={withdrawalAmount}
        buttonLabel="- Retirar"
        inputLabel="Monto a retirar (MXN)"
        message={withdrawalMessage}
        messageType={withdrawalMessageType}
        title="Retiro"
        tone="withdrawal"
        loading={loading}
        onAmountChange={onWithdrawalAmountChange}
        onSubmit={onWithdrawalSubmit}
      />
    </section>
  );
}
