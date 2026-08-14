type Operator = "+" | "-" | "*" | "/" | "u-";
type Token = number | Operator | "(" | ")";

const precedence: Record<Operator, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "u-": 3 };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  while (cursor < expression.length) {
    const character = expression[cursor];
    if (/\s/.test(character)) { cursor += 1; continue; }
    if (/[0-9.]/.test(character)) {
      const match = expression.slice(cursor).match(/^\d*\.?\d+/)?.[0];
      if (!match || (match.match(/\./g) ?? []).length > 1) throw new Error("Invalid number");
      tokens.push(Number(match));
      cursor += match.length;
      continue;
    }
    if ("+-*/()".includes(character)) {
      tokens.push(character as Token);
      cursor += 1;
      continue;
    }
    throw new Error("Unsupported input");
  }
  return tokens;
}

function apply(operator: Operator, values: number[]) {
  if (operator === "u-") {
    const value = values.pop();
    if (value === undefined) throw new Error("Incomplete calculation");
    values.push(-value);
    return;
  }
  const right = values.pop();
  const left = values.pop();
  if (left === undefined || right === undefined) throw new Error("Incomplete calculation");
  if (operator === "+") values.push(left + right);
  if (operator === "-") values.push(left - right);
  if (operator === "*") values.push(left * right);
  if (operator === "/") {
    if (right === 0) throw new Error("Cannot divide by zero");
    values.push(left / right);
  }
}

export function calculateExpression(expression: string): number {
  const tokens = tokenize(expression);
  if (!tokens.length) return 0;
  const values: number[] = [];
  const operators: Array<Operator | "("> = [];
  let previous: Token | undefined;
  for (const token of tokens) {
    if (typeof token === "number") {
      values.push(token);
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") apply(operators.pop() as Operator, values);
      if (operators.pop() !== "(") throw new Error("Check brackets");
    } else {
      const operator: Operator = token === "-" && (!previous || typeof previous === "string" && previous !== ")") ? "u-" : token;
      while (operators.length && operators[operators.length - 1] !== "(" && precedence[operators[operators.length - 1] as Operator] >= precedence[operator]) apply(operators.pop() as Operator, values);
      operators.push(operator);
    }
    previous = token;
  }
  while (operators.length) {
    const operator = operators.pop();
    if (operator === "(") throw new Error("Check brackets");
    apply(operator as Operator, values);
  }
  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error("Invalid calculation");
  return values[0];
}

export function formatCalculation(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
}
