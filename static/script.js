// Класс для работы с дробями
class Fraction {
  constructor(str) {
    if (typeof str === "string") {
      const parts = str.split("/");
      this.num = parseInt(parts[0]);
      this.den = parts[1] ? parseInt(parts[1]) : 1;
    } else if (typeof str === "number") {
      this.num = str;
      this.den = 1;
    } else if (str instanceof Fraction) {
      this.num = str.num;
      this.den = str.den;
    } else {
      throw new Error("Invalid fraction input");
    }
    this.normalize();
  }

  normalize() {
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const g = gcd(Math.abs(this.num), Math.abs(this.den));
    this.num /= g;
    this.den /= g;
    if (this.den < 0) {
      this.den = -this.den;
      this.num = -this.num;
    }
  }

  add(other) {
    other = new Fraction(other);
    return new Fraction(
      this.num * other.den + other.num * this.den,
      this.den * other.den
    );
  }

  sub(other) {
    other = new Fraction(other);
    return new Fraction(
      this.num * other.den - other.num * this.den,
      this.den * other.den
    );
  }

  mul(other) {
    other = new Fraction(other);
    return new Fraction(
      this.num * other.num,
      this.den * other.den
    );
  }

  div(other) {
    other = new Fraction(other);
    if (other.num === 0) throw new Error("Division by zero");
    return new Fraction(
      this.num * other.den,
      this.den * other.num
    );
  }

  pow(exp) {
    if (!Number.isInteger(exp)) throw new Error("Exponent must be integer");
    if (exp === 0) return new Fraction(1);
    let n = this.num, d = this.den;
    if (exp < 0) {
      [n, d] = [d, n];
      exp = -exp;
    }
    return new Fraction(
      Math.pow(n, exp),
      Math.pow(d, exp)
    );
  }

  toString() {
    if (this.den === 1) return this.num.toString();
    return `${this.num}/${this.den}`;
  }
}

// Получение элементов DOM
const chainContainer = document.getElementById("chain-container");
const exampleLine = document.getElementById("example-line");
const addBtn = document.getElementById("add-new-element-btn");
const calcBtn = document.getElementById("calculate-btn");
const resultDiv = document.getElementById("result");

const elementTemplate = document.getElementById("element-template");

const elements = [];

function parseFractionMatrix(matrixData) {
  // Преобразуем строковые значения в объекты Fraction
  return matrixData.map(row => row.map(cell => new Fraction(cell)));
}

function matrixAdd(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Размерности для сложения должны совпадать.");
  }
  const res = [];
  for (let i = 0; i < A.length; i++) {
    const row = [];
    for (let j = 0; j < A[0].length; j++) {
      row.push(A[i][j].add(B[i][j]));
    }
    res.push(row);
  }
  return res;
}

function matrixSub(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Размерности для вычитания должны совпадать.");
  }
  const res = [];
  for (let i = 0; i < A.length; i++) {
    const row = [];
    for (let j = 0; j < A[0].length; j++) {
      row.push(A[i][j].sub(B[i][j]));
    }
    res.push(row);
  }
  return res;
}

function matrixMul(A, B) {
  // Если B — скаляр (Fraction), умножаем каждый элемент
  if (!(B instanceof Array)) {
    return A.map(row => row.map(cell => cell.mul(B)));
  }

  // Иначе матричное умножение
  if (A[0].length !== B.length) {
    throw new Error("Размерности для умножения несовместимы.");
  }
  const res = [];
  for (let i = 0; i < A.length; i++) {
    const row = [];
    for (let j = 0; j < B[0].length; j++) {
      let sum = new Fraction(0);
      for (let k = 0; k < A[0].length; k++) {
        sum = sum.add(A[i][k].mul(B[k][j]));
      }
      row.push(sum);
    }
    res.push(row);
  }
  return res;
}

function matrixDiv(A, B) {
  // Деление на скаляр
  if (!(B instanceof Array)) {
    if (B.num === 0) throw new Error("Деление на ноль.");
    return A.map(row => row.map(cell => cell.div(B)));
  }
  throw new Error("Деление на матрицу пока не поддерживается.");
}

function matrixPow(A, power) {
  if (!Number.isInteger(power)) {
    throw new Error("Степень должна быть целым числом.");
  }
  if (A.length !== A[0].length) {
    throw new Error("Матрица должна быть квадратной для возведения в степень.");
  }
  if (power === 0) {
    // Единичная матрица
    const n = A.length;
    const res = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        row.push(i === j ? new Fraction(1) : new Fraction(0));
      }
      res.push(row);
    }
    return res;
  }
  if (power < 0) {
    throw new Error("Отрицательная степень не поддерживается.");
  }
  let result = A;
  for (let p = 1; p < power; p++) {
    result = matrixMul(result, A);
  }
  return result;
}

function applyOperation(acc, elem, op) {
  switch (op) {
    case "+":
      return matrixAdd(acc, elem);
    case "-":
      return matrixSub(acc, elem);
    case "*":
      return matrixMul(acc, elem);
    case "/":
      return matrixDiv(acc, elem);
    case "^":
      if (typeof elem !== "number" && !(elem instanceof Number)) {
        throw new Error("Возведение в степень поддерживается только для числа.");
      }
      return matrixPow(acc, elem);
    default:
      throw new Error(`Неизвестная операция: ${op}`);
  }
}

function renderChain() {
  chainContainer.innerHTML = "";
  elements.forEach((el, idx) => {
    const block = elementTemplate.content.cloneNode(true);
    const nameField = block.querySelector(".element-name");
    const bodyField = block.querySelector(".element-body");
    const opSelect = block.querySelector(".operation-select");
    const removeBtn = block.querySelector(".remove-element-btn");

    nameField.textContent = el.name || `#${idx + 1}`;

    // Визуализация матрицы или числа
    if (el.type === "matrix") {
      const table = document.createElement("table");
      el.data.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
          const td = document.createElement("td");
          td.textContent = cell.toString();
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      bodyField.appendChild(table);
    } else {
      bodyField.textContent = el.data.toString();
    }

    if (idx === 0) {
      opSelect.disabled = true;
      opSelect.value = "+";
    } else {
      opSelect.value = el.operation || "+";
      opSelect.disabled = false;
      opSelect.onchange = (e) => {
        el.operation = e.target.value;
        renderFormula();
      };
    }

    removeBtn.onclick = () => {
      elements.splice(idx, 1);
      renderChain();
      renderFormula();
    };

    chainContainer.appendChild(block);
  });
}

function renderFormula() {
  if (elements.length === 0) {
    exampleLine.textContent = "";
    return;
  }

  let str = "";
  elements.forEach((el, idx) => {
    if (idx > 0) {
      str += ` ${el.operation || "?"} `;
    }
    str += el.name || (el.type === "matrix" ? `M${idx + 1}` : `N${idx + 1}`);
  });
  exampleLine.textContent = str + " =";
}

addBtn.onclick = () => {
  const name = prompt("Имя элемента (например, A, B, k):", "A");
  if (!name) return;

  const type = prompt("Тип: 'matrix' или 'scalar'?", "matrix");
  if (type !== "matrix" && type !== "scalar") {
    alert("Неверный тип.");
    return;
  }

  let data;
  if (type === "matrix") {
    const rows = parseInt(prompt("Количество строк:", "2"));
    const cols = parseInt(prompt("Количество столбцов:", "2"));
    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
      alert("Неверные размеры матрицы.");
      return;
    }

    data = [];
    for (let i = 0; i < rows; i++) {
      const row = prompt(`Введите строку ${i + 1} (через пробел):`, "1 0");
      if (!row) {
        alert("Нужно ввести строку.");
        return;
      }
      const cells = row.trim().split(/\s+/);
      if (cells.length !== cols) {
        alert("Неверное количество столбцов.");
        return;
      }
      try {
        data.push(cells.map(cell => new Fraction(cell)));
      } catch {
        alert("Некорректное значение в матрице.");
        return;
      }
    }
  } else {
    const val = prompt("Введите число (например 2/3):", "1");
    if (!val) return;
    try {
      data = new Fraction(val);
    } catch {
      alert("Некорректное значение числа.");
      return;
    }
  }

  elements.push({
    name,
    type,
    data,
    operation: elements.length > 0 ? "+" : null
  });

  renderChain();
  renderFormula();
};

calcBtn.onclick = () => {
  try {
    if (elements.length === 0) {
      resultDiv.textContent = "Нужно добавить хотя бы один элемент.";
      return;
    }

    let acc = elements[0].type === "matrix" ? elements[0].data : elements[0].data;

    for (let i = 1; i < elements.length; i++) {
      const el = elements[i];
      if (!el.operation) throw new Error("Операция не указана для элемента после первого.");

      if (el.type === "matrix") {
        if (el.operation === "^") {
          throw new Error("Возведение в степень применимо только к числам.");
        }
        acc = applyOperation(acc, el.data, el.operation);
      } else {
        if (!["*", "/", "^"].includes(el.operation)) {
          throw new Error(`Операция '${el.operation}' недоступна для скаляров.`);
        }
        // Для степени преобразуем Fraction в число
        let val = el.data;
        if (el.operation === "^") {
          val = parseInt(el.data.toString());
          if (isNaN(val)) throw new Error("Степень должна быть числом.");
        }
        acc = applyOperation(acc, val, el.operation);
      }
    }

    if (Array.isArray(acc)) {
      // Матрица
      const resStr = acc.map(row => row.map(cell => cell.toString()).join(" ")).join("\n");
      resultDiv.textContent = resStr;
    } else {
      // Скaляр
      resultDiv.textContent = acc.toString();
    }
  } catch (e) {
    resultDiv.textContent = "Ошибка: " + e.message;
  }
};

// Инициализация
renderChain();
renderFormula();
