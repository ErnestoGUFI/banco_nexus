import { useState } from "react";

import { createTransaction, getAccount, getAccountHistory } from "./api/bankApi";
import AccountSearch from "./components/AccountSearch";
import BalanceChart from "./components/BalanceChart";
import Header from "./components/Header";
import OperationsPanel from "./components/OperationsPanel";
import SummaryCards from "./components/SummaryCards";
import TransactionsTable from "./components/TransactionsTable";
import { formatHistory } from "./utils/formatters";
import "./styles.css";

export default function App() {
  const [accountInput, setAccountInput] = useState("");
  const [accountData, setAccountData] = useState(null);
  const [accountHistory, setAccountHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [depositMessage, setDepositMessage] = useState("");
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [depositMessageType, setDepositMessageType] = useState("success");
  const [withdrawalMessageType, setWithdrawalMessageType] = useState("success");
  const [operationLoading, setOperationLoading] = useState(false);

  async function loadAccount(accountNumber, { clearOperationMessages = true } = {}) {
    if (!accountNumber) {
      return;
    }

    setLoading(true);
    setError("");
    setAccountData(null);
    setAccountHistory([]);

    if (clearOperationMessages) {
      setDepositMessage("");
      setWithdrawalMessage("");
    }

    try {
      const [account, history] = await Promise.all([
        getAccount(accountNumber),
        getAccountHistory(accountNumber),
      ]);

      setAccountData(account);
      setAccountHistory(formatHistory(history));
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function searchAccount() {
    await loadAccount(accountInput.trim());
  }

  async function submitOperation(type) {
    const rawAmount = type === "deposito" ? depositAmount : withdrawalAmount;
    const amount = parseFloat(rawAmount);

    if (!accountData || !amount || amount <= 0) {
      return;
    }

    setOperationLoading(true);

    try {
      const result = await createTransaction(type, accountData.cuenta, amount);
      const message = `${type === "deposito" ? "Depósito" : "Retiro"} de $${amount.toLocaleString("es-MX")} realizado. Nuevo saldo: $${result.nuevoSaldo.toLocaleString("es-MX")}`;

      if (type === "deposito") {
        setDepositMessage(message);
        setDepositMessageType("success");
        setDepositAmount("");
      } else {
        setWithdrawalMessage(message);
        setWithdrawalMessageType("success");
        setWithdrawalAmount("");
      }

      await loadAccount(accountData.cuenta, { clearOperationMessages: false });
    } catch (operationError) {
      if (type === "deposito") {
        setDepositMessage(operationError.message);
        setDepositMessageType("error");
      } else {
        setWithdrawalMessage(operationError.message);
        setWithdrawalMessageType("error");
      }
    } finally {
      setOperationLoading(false);
    }
  }

  return (
    <div className="app-page">
      <Header />

      <main className="app-main">
        <AccountSearch
          accountInput={accountInput}
          error={error}
          loading={loading}
          onAccountInputChange={setAccountInput}
          onSearch={searchAccount}
        />

        {accountData && (
          <>
            <SummaryCards account={accountData} />
            <BalanceChart history={accountHistory} />
            <OperationsPanel
              depositAmount={depositAmount}
              depositMessage={depositMessage}
              depositMessageType={depositMessageType}
              loading={operationLoading}
              withdrawalAmount={withdrawalAmount}
              withdrawalMessage={withdrawalMessage}
              withdrawalMessageType={withdrawalMessageType}
              onDepositAmountChange={setDepositAmount}
              onDepositSubmit={() => submitOperation("deposito")}
              onWithdrawalAmountChange={setWithdrawalAmount}
              onWithdrawalSubmit={() => submitOperation("retiro")}
            />
            <TransactionsTable transactions={accountData.transacciones} />
          </>
        )}
      </main>
    </div>
  );
}
