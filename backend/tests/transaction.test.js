const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BRANCHES,
  DEFAULT_BRANCH,
  createBankOperation,
  normalizeBranch,
  serializeTransaction,
} = require("../transactions");

function createMockDb({ account, updateResult } = {}) {
  const createdTransactions = [];
  const accountDocument = account
    ? { ...account }
    : {
        accountNumber: "1000000001",
        balance: 1000,
        active: true,
      };

  const AccountModel = {
    findOne(query) {
      return {
        async lean() {
          if (query.accountNumber === accountDocument.accountNumber) {
            return { ...accountDocument };
          }

          return null;
        },
      };
    },
    async updateOne(query, update) {
      if (query.accountNumber !== accountDocument.accountNumber) {
        return { matchedCount: 0 };
      }

      accountDocument.balance = update.$set.balance;
      return updateResult || { matchedCount: 1, modifiedCount: 1 };
    },
  };

  const TransactionModel = {
    async create(transaction) {
      createdTransactions.push(transaction);
      return {
        toObject() {
          return { ...transaction };
        },
      };
    },
  };

  return {
    AccountModel,
    TransactionModel,
    createdTransactions,
    getAccountDocument() {
      return { ...accountDocument };
    },
  };
}

test("normalizeBranch returns default branch for unknown values", () => {
  assert.deepEqual(BRANCHES, ["CDMX", "GDL", "MTY", "PUE", "TIJ"]);
  assert.equal(DEFAULT_BRANCH, "CDMX");
  assert.equal(normalizeBranch("gdl"), "GDL");
  assert.equal(normalizeBranch("OTRA"), DEFAULT_BRANCH);
  assert.equal(normalizeBranch(undefined), DEFAULT_BRANCH);
});

test("serializeTransaction injects default branch when legacy data has no branch", () => {
  const serialized = serializeTransaction({
    accountNumber: "1000000001",
    type: "deposit",
    amount: 500,
    resultingBalance: 1500,
    date: new Date("2026-05-17T10:00:00.000Z"),
    description: "Deposito de prueba",
  });

  assert.equal(serialized.branch, DEFAULT_BRANCH);
});

test("createBankOperation registers a deposit with branch metadata", async () => {
  const db = createMockDb();
  const result = await createBankOperation(
    {
      AccountModel: db.AccountModel,
      TransactionModel: db.TransactionModel,
    },
    {
      accountNumber: "1000000001",
      amount: 250.55,
      branch: "gdl",
      type: "deposit",
      description: "Sucursal remota",
    },
  );

  assert.equal(result.newBalance, 1250.55);
  assert.equal(result.previousBalance, 1000);
  assert.equal(result.transaction.branch, "GDL");
  assert.equal(result.transaction.description, "Sucursal remota");
  assert.equal(db.createdTransactions.length, 1);
  assert.equal(db.createdTransactions[0].resultingBalance, 1250.55);
});

test("createBankOperation rejects withdrawals with insufficient funds", async () => {
  const db = createMockDb({
    account: {
      accountNumber: "1000000001",
      balance: 200,
      active: true,
    },
  });

  await assert.rejects(
    createBankOperation(
      {
        AccountModel: db.AccountModel,
        TransactionModel: db.TransactionModel,
      },
      {
        accountNumber: "1000000001",
        amount: 350,
        branch: "MTY",
        type: "withdrawal",
      },
    ),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, "Saldo insuficiente");
      return true;
    },
  );

  assert.equal(db.createdTransactions.length, 0);
  assert.equal(db.getAccountDocument().balance, 200);
});

test("createBankOperation validates required fields and inactive accounts", async () => {
  const missingDb = createMockDb();
  await assert.rejects(
    createBankOperation(
      {
        AccountModel: missingDb.AccountModel,
        TransactionModel: missingDb.TransactionModel,
      },
      {
        accountNumber: "",
        amount: 100,
        type: "deposit",
      },
    ),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /cuenta y monto/);
      return true;
    },
  );

  const inactiveDb = createMockDb({
    account: {
      accountNumber: "1000000001",
      balance: 1000,
      active: false,
    },
  });

  await assert.rejects(
    createBankOperation(
      {
        AccountModel: inactiveDb.AccountModel,
        TransactionModel: inactiveDb.TransactionModel,
      },
      {
        accountNumber: "1000000001",
        amount: 100,
        type: "deposit",
      },
    ),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.message, "La cuenta está inactiva");
      return true;
    },
  );
});
