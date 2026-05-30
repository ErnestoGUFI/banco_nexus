export function sanitizeAmountInput(value) {
  const rawValue = String(value ?? "");
  const blockedIndex = rawValue.search(/[eE+-]/);
  const safeValue = blockedIndex >= 0 ? rawValue.slice(0, blockedIndex) : rawValue;
  const cleaned = safeValue.replace(/[^\d.,]/g, "");

  if (!cleaned) {
    return "";
  }

  let integerPart = "";
  let decimalPart = "";
  let hasDecimalSeparator = false;

  for (const character of cleaned) {
    if (character === "." || character === ",") {
      if (!hasDecimalSeparator) {
        hasDecimalSeparator = true;
      }
      continue;
    }

    if (hasDecimalSeparator) {
      decimalPart += character;
    } else {
      integerPart += character;
    }
  }

  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "");

  if (hasDecimalSeparator) {
    return `${normalizedInteger || "0"}.${decimalPart.slice(0, 2)}`;
  }

  return normalizedInteger;
}

export function blockInvalidAmountKey(event) {
  if (["e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
}
