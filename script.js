const examples = ["(12 + 3) * 4 - 8 / 2", "7 + 5 * (9 - 3)", "42 / (2 + 5)", "18 - 6 / 2 + 3 * 4"];
const input = document.getElementById("sourceInput");
const tokenOutput = document.getElementById("tokenOutput");
const treeOutput = document.getElementById("treeOutput");
const errorBanner = document.getElementById("errorBanner");
let exampleIndex = 0;

class CompileError extends Error {
  constructor(message, position = null) {
    super(position === null ? message : `${message} (character ${position + 1})`);
    this.name = "CompileError";
  }
}

function tokenize(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (/\s/.test(char)) { i += 1; continue; }
    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(source[i + 1] || ""))) {
      const start = i;
      let dots = 0;
      while (i < source.length && /[0-9.]/.test(source[i])) {
        if (source[i] === ".") dots += 1;
        i += 1;
      }
      const text = source.slice(start, i);
      if (dots > 1 || text === ".") throw new CompileError("Invalid number", start);
      tokens.push({ type: "NUMBER", value: Number(text), lexeme: text, position: start });
      continue;
    }
    if ("+-*/".includes(char)) {
      tokens.push({ type: "OPERATOR", value: char, lexeme: char, position: i });
      i += 1;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ type: "PARENTHESIS", value: char, lexeme: char, position: i });
      i += 1;
      continue;
    }
    throw new CompileError(`Unexpected character “${char}”`, i);
  }
  if (tokens.length === 0) throw new CompileError("Enter an expression to compile");
  return tokens;
}

function parse(tokens) {
  let current = 0;
  const peek = () => tokens[current];
  const consume = () => tokens[current++];
  const match = (value) => peek() && peek().value === value;

  function expression() {
    let node = term();
    while (match("+") || match("-")) {
      const operator = consume().value;
      node = { kind: "BinaryExpression", operator, left: node, right: term() };
    }
    return node;
  }
  function term() {
    let node = factor();
    while (match("*") || match("/")) {
      const operator = consume().value;
      node = { kind: "BinaryExpression", operator, left: node, right: factor() };
    }
    return node;
  }
  function factor() {
    if (!peek()) throw new CompileError("Expected a number or an opening parenthesis at the end of the expression");
    if (match("(")) {
      consume();
      const node = expression();
      if (!match(")")) throw new CompileError("Expected a closing parenthesis", peek() ? peek().position : tokens[tokens.length - 1].position);
      consume();
      return node;
    }
    if (peek().type === "NUMBER") return { kind: "NumberLiteral", value: consume().value };
    throw new CompileError(`Expected a number or “(”, found “${peek().lexeme}”`, peek().position);
  }

  const tree = expression();
  if (current < tokens.length) {
    const token = peek();
    throw new CompileError(`Unexpected token “${token.lexeme}”`, token.position);
  }
  return tree;
}

function evaluate(node) {
  if (node.kind === "NumberLiteral") return node.value;
  const left = evaluate(node.left);
  const right = evaluate(node.right);
  switch (node.operator) {
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/":
      if (right === 0) throw new CompileError("Cannot evaluate division by zero");
      return left / right;
    default: throw new CompileError("Unknown operator");
  }
}

function appendToken(token) {
  const item = document.createElement("span");
  const className = token.type === "NUMBER" ? "number" : token.type === "OPERATOR" ? "operator" : "parenthesis";
  item.className = `token ${className}`;
  const value = document.createElement("b");
  value.textContent = token.lexeme;
  const type = document.createElement("small");
  type.textContent = token.type.toLowerCase();
  item.append(value, type);
  tokenOutput.appendChild(item);
}

function renderTree(node, parent) {
  const wrapper = document.createElement("div");
  wrapper.className = "tree-root";
  const label = document.createElement("div");
  label.className = `tree-node ${node.kind === "NumberLiteral" ? "number" : ""}`;
  label.textContent = node.kind === "NumberLiteral" ? String(node.value) : node.operator;
  const kind = document.createElement("small");
  kind.textContent = node.kind === "NumberLiteral" ? "number" : "operation";
  label.appendChild(kind);
  wrapper.appendChild(label);
  if (node.kind === "BinaryExpression") {
    const children = document.createElement("div");
    children.className = "tree-children";
    const left = document.createElement("div");
    left.className = "tree-branch";
    const right = document.createElement("div");
    right.className = "tree-branch";
    renderTree(node.left, left);
    renderTree(node.right, right);
    children.append(left, right);
    wrapper.appendChild(children);
  }
  parent.appendChild(wrapper);
}

function setPipeline(stage) {
  const order = ["source", "tokens", "ast", "result"];
  document.querySelectorAll(".pipeline-step").forEach((item) => {
    const index = order.indexOf(item.dataset.stage);
    const current = order.indexOf(stage);
    item.classList.toggle("active", index === current);
    item.classList.toggle("complete", index < current);
  });
}

function compile() {
  errorBanner.hidden = true;
  try {
    const tokens = tokenize(input.value);
    tokenOutput.replaceChildren();
    tokens.forEach(appendToken);
    document.getElementById("tokenCount").textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
    setPipeline("tokens");

    const ast = parse(tokens);
    treeOutput.replaceChildren();
    renderTree(ast, treeOutput);
    setPipeline("ast");

    const result = evaluate(ast);
    document.getElementById("resultTitle").textContent = "Expression evaluated";
    document.getElementById("resultDescription").textContent = "The evaluator recursively walked the AST, respecting its structure.";
    document.getElementById("resultValue").textContent = Number.isInteger(result) ? String(result) : String(Number(result.toFixed(8)));
    setPipeline("result");
  } catch (error) {
    errorBanner.textContent = error instanceof CompileError ? error.message : "Something went wrong while compiling this expression.";
    errorBanner.hidden = false;
    document.getElementById("resultTitle").textContent = "Compile stopped";
    document.getElementById("resultDescription").textContent = "Check the message above, adjust the expression, and try again.";
    document.getElementById("resultValue").textContent = "!";
    setPipeline("source");
  }
}

document.getElementById("compileButton").addEventListener("click", compile);
input.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") compile();
});
document.getElementById("exampleButton").addEventListener("click", () => {
  exampleIndex = (exampleIndex + 1) % examples.length;
  input.value = examples[exampleIndex];
  compile();
});
compile();
