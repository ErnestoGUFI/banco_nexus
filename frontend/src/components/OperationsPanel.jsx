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
  depositAmount,
  depositMessage,
  depositMessageType,
  loading,
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
