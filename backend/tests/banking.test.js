const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ACCOUNT_NUMBER_REGEX,
  BankingError,
  calculateCheckDigit,
  generateAccountNumber,
  roundAmount,
  validateAccountNumber,
} = require("../src/banking");

test("generateAccountNumber follows prefix, sequence and check digit rules", () => {
  assert.equal(generateAccountNumber(1), "1800000010");
  assert.equal(generateAccountNumber(34), "1800000346");
  assert.equal(generateAccountNumber(999999), "1809999993");
});

test("calculateCheckDigit returns the digit sum modulo 10", () => {
  assert.equal(calculateCheckDigit("180000034"), 6);
  assert.equal(calculateCheckDigit("180000001"), 0);
});

test("validateAccountNumber rejects malformed account numbers before querying", () => {
  assert.equal(ACCOUNT_NUMBER_REGEX.test("1800000346"), true);
  assert.equal(validateAccountNumber("1800000346"), "1800000346");

  assert.throws(
    () => validateAccountNumber("180-000-0346"),
    (error) => {
      assert.equal(error instanceof BankingError, true);
      assert.equal(error.statusCode, 400);
      assert.equal(error.code, "INVALID_ACCOUNT_NUMBER");
      return true;
    },
  );
});

test("roundAmount keeps transfer math at two decimal places", () => {
  assert.equal(roundAmount(10.005), 10.01);
  assert.equal(roundAmount(15.999), 16);
});
