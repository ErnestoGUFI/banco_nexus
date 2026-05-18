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
        cuenta: "1000000001",
        saldo: 1000,
        activa: true,
      };

  const AccountModel = {
    findOne(query) {
      return {
        async lean() {
          if (query.cuenta === accountDocument.cuenta) {
            return { ...accountDocument };
          }

          return null;
        },
      };
    },
    async updateOne(query, update) {
      if (query.cuenta !== accountDocument.cuenta) {
        return { matchedCount: 0 };
      }

      accountDocument.saldo = update.$set.saldo;
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

test("serializeTransaction injects default branch when legacy data has no sucursal", () => {
  const serialized = serializeTransaction({
    cuenta: "1000000001",
    tipo: "deposito",
    monto: 500,
    saldoResultante: 1500,
    fecha: new Date("2026-05-17T10:00:00.000Z"),
    descripcion: "Deposito de prueba",
  });

  assert.equal(serialized.sucursal, DEFAULT_BRANCH);
});

test("createBankOperation registers a deposito with branch metadata", async () => {
  const db = createMockDb();
  const result = await createBankOperation(
    {
      AccountModel: db.AccountModel,
      TransactionModel: db.TransactionModel,
    },
    {
      cuenta: "1000000001",
      monto: 250.55,
      sucursal: "gdl",
      tipo: "deposito",
      descripcion: "Sucursal remota",
    },
  );

  assert.equal(result.nuevoSaldo, 1250.55);
  assert.equal(result.saldoAnterior, 1000);
  assert.equal(result.transaction.sucursal, "GDL");
  assert.equal(result.transaction.descripcion, "Sucursal remota");
  assert.equal(db.createdTransactions.length, 1);
  assert.equal(db.createdTransactions[0].saldoResultante, 1250.55);
});

test("createBankOperation rejects withdrawals with insufficient funds", async () => {
  const db = createMockDb({
    account: {
      cuenta: "1000000001",
      saldo: 200,
      activa: true,
    },
  });

  await assert.rejects(
    createBankOperation(
      {
        AccountModel: db.AccountModel,
        TransactionModel: db.TransactionModel,
      },
      {
        cuenta: "1000000001",
        monto: 350,
        sucursal: "MTY",
        tipo: "retiro",
      },
    ),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, "Saldo insuficiente");
      return true;
    },
  );

  assert.equal(db.createdTransactions.length, 0);
  assert.equal(db.getAccountDocument().saldo, 200);
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
        cuenta: "",
        monto: 100,
        tipo: "deposito",
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
      cuenta: "1000000001",
      saldo: 1000,
      activa: false,
    },
  });

  await assert.rejects(
    createBankOperation(
      {
        AccountModel: inactiveDb.AccountModel,
        TransactionModel: inactiveDb.TransactionModel,
      },
      {
        cuenta: "1000000001",
        monto: 100,
        tipo: "deposito",
      },
    ),
    (error) => {
      assert.equal(error.statusCode, 403);
      assert.equal(error.message, "La cuenta está inactiva");
      return true;
    },
  );
});
