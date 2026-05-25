import { useEffect, useState } from "react";

import {
  createTransaction,
  getAccount,
  getAccountHistory,
  getSystemHealth,
} from "./api/bankApi";
import AccountSearch from "./components/AccountSearch";
import BalanceChart from "./components/BalanceChart";
import Header from "./components/Header";
import OperationsPanel from "./components/OperationsPanel";
import SummaryCards from "./components/SummaryCards";
import TransactionsTable from "./components/TransactionsTable";
import { DEFAULT_BRANCH } from "./constants/branches";
import { formatHistory } from "./utils/formatters";
import "./styles.css";

const RECENT_SEARCHES_KEY = "banco-nexus-recent-searches";
const HEALTH_POLL_MS = 10000;

function getReplicaAlert(health) {
  if (!health) {
    return null;
  }

  if (health.status === "DOWN") {
    return {
      type: "error",
      title: "Replica Set sin respuesta",
      message: health.error || "No se pudo confirmar el estado de MongoDB.",
    };
  }

  if (health.status === "DEGRADED") {
    return {
      type: "warning",
      title: "Latencia elevada",
      message: health.warning || `MongoDB respondio en ${health.latencyMs} ms.`,
    };
  }

  return null;
}

export default function App() {
  const [accountInput, setAccountInput] = useState("");
  const [accountData, setAccountData] = useState(null);
  const [accountHistory, setAccountHistory] = useState([]);
  const [error, setError] = useState("");
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentSearchesReady, setRecentSearchesReady] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [depositMessage, setDepositMessage] = useState("");
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [depositMessageType, setDepositMessageType] = useState("success");
  const [withdrawalMessageType, setWithdrawalMessageType] = useState("success");
  const [operationLoading, setOperationLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(DEFAULT_BRANCH);

  useEffect(() => {
    try {
      const savedSearches = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } finally {
      setRecentSearchesReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function checkHealth() {
      try {
        const health = await getSystemHealth();
        if (active) {
          setSystemHealth(health);
        }
      } catch (healthError) {
        if (active) {
          setSystemHealth({
            status: "DOWN",
            error: healthError.message,
          });
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

  useEffect(() => {
    if (!recentSearchesReady) {
      return;
    }

    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recentSearches),
    );
  }, [recentSearches, recentSearchesReady]);

  function registerRecentSearch(account) {
    setRecentSearches((currentSearches) => {
      const nextSearches = [
        {
          accountNumber: account.accountNumber,
          name: account.client.name,
          accountType: account.accountType,
        },
        ...currentSearches.filter((item) => item.accountNumber !== account.accountNumber),
      ].slice(0, 3);

      return nextSearches;
    });
  }

  async function loadAccount(
    accountNumber,
    { clearOperationMessages = true, preserveVisibleData = false } = {},
  ) {
    if (!accountNumber) {
      return;
    }

    setLoading(true);
    setError("");

    if (!preserveVisibleData) {
      setAccountData(null);
      setAccountHistory([]);
    }

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
      registerRecentSearch(account);
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function searchAccount() {
    await loadAccount(accountInput.trim());
  }

  async function selectRecentSearch(accountNumber) {
    setAccountInput(accountNumber);
    await loadAccount(accountNumber);
  }

  function clearOperationMessages() {
    setDepositMessage("");
    setWithdrawalMessage("");
  }

  async function submitOperation(type) {
    const rawAmount = type === "deposit" ? depositAmount : withdrawalAmount;
    const amount = parseFloat(rawAmount);

    if (!accountData || !amount || amount <= 0) {
      return;
    }

    clearOperationMessages();
    setOperationLoading(true);

    try {
      const result = await createTransaction(
        type,
        accountData.accountNumber,
        amount,
        selectedBranch,
      );
      const message = `${type === "deposit" ? "Depósito" : "Retiro"} desde ${result.branch} de $${amount.toLocaleString("es-MX")} realizado. Nuevo saldo: $${result.newBalance.toLocaleString("es-MX")}`;

      if (type === "deposit") {
        setDepositMessage(message);
        setDepositMessageType("success");
        setDepositAmount("");
      } else {
        setWithdrawalMessage(message);
        setWithdrawalMessageType("success");
        setWithdrawalAmount("");
      }

      await loadAccount(accountData.accountNumber, {
        clearOperationMessages: false,
        preserveVisibleData: true,
      });
    } catch (operationError) {
      if (type === "deposit") {
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

  const replicaAlert = getReplicaAlert(systemHealth);

  return (
    <div className="app-page">
      <Header health={systemHealth} />

      <main className="app-main">
        {replicaAlert && (
          <div className={`replica-alert replica-alert-${replicaAlert.type}`}>
            <strong>{replicaAlert.title}</strong>
            <span>{replicaAlert.message}</span>
          </div>
        )}

        <AccountSearch
          accountInput={accountInput}
          error={error}
          loading={loading}
          recentSearches={recentSearches}
          onAccountInputChange={setAccountInput}
          onRecentSearchSelect={selectRecentSearch}
          onSearch={searchAccount}
        />

        {accountData && (
          <>
            <SummaryCards account={accountData} />
            <BalanceChart history={accountHistory} />
            <OperationsPanel
              branch={selectedBranch}
              depositAmount={depositAmount}
              depositMessage={depositMessage}
              depositMessageType={depositMessageType}
              loading={operationLoading}
              withdrawalAmount={withdrawalAmount}
              withdrawalMessage={withdrawalMessage}
              withdrawalMessageType={withdrawalMessageType}
              onBranchChange={setSelectedBranch}
              onDepositAmountChange={setDepositAmount}
              onDepositSubmit={() => submitOperation("deposit")}
              onWithdrawalAmountChange={setWithdrawalAmount}
              onWithdrawalSubmit={() => submitOperation("withdrawal")}
            />
            <TransactionsTable transactions={accountData.transactions} />
          </>
        )}
      </main>
    </div>
  );
}
