// Подключаем элементы DOM
const chainContainer = document.getElementById("chain-container");
const exampleLine = document.getElementById("example-line");
const addBtn = document.getElementById("add-new-element-btn");
const calcBtn = document.getElementById("calculate-btn");
const resultDiv = document.getElementById("result");
const elementTemplate = document.getElementById("element-template");

// Список элементов выражения
const elements = [];

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
          td.textContent = cell;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      bodyField.appendChild(table);
    } else {
      bodyField.textContent = el.data;
    }

    if (idx === 0) {
      opSelect.disabled = true;
    } else {
      opSelect.value = el.operation || "+";
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

// Добавление элемента
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
      const cells = row.trim().split(/\s+/);
      if (cells.length !== cols) {
        alert("Неверное количество столбцов.");
        return;
      }
      data.push(cells);
    }
  } else {
    const val = prompt("Введите число (например 2/3):", "1");
    if (!val) return;
    data = val;
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

// =======================
// Расчёт локально в JS
// =======================

function parseFractionMatrix(data) {
  return data.map(row => row.map(cell => new Fraction(cell)));
}

function matrixAdd(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length)
    throw new Error("Размерности для сложения должны совпадать.");
  return A.map((row, i) => row.map((val, j) => val.add(B[i][j])));
}

function matrixSub(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length)
    throw new Error("Размерности для вычитания должны совпадать.");
  return A.map((row, i) => row.map((val, j) => val.sub(B[i][j])));
}

function matrixMul(A, B) {
  if (Array.isArray(B)) {
    // Матрица * матрица
    if (A[0].length !== B.length)
      throw new Error("Размерности для умножения несовместимы.");
    const result = Array.from({ length: A.length }, () =>
      Array.from({ length: B[0].length }, () => new Fraction(0))
    );
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < B[0].length; j++) {
        for (let k = 0; k < A[0].length; k++) {
          result[i][j] = result[i][j].add(A[i][k].mul(B[k][j]));
        }
      }
    }
    return result;
  } else {
    // Матрица * скаляр
    return A.map(row => row.map(val => val.mul(B)));
  }
}

function matrixDiv(A, B) {
  if (B.valueOf() === 0) throw new Error("Деление на ноль.");
  return A.map(row => row.map(val => val.div(B)));
}

function matrixPow(A, power) {
  if (A.length !== A[0].length)
    throw new Error("Матрица должна быть квадратной для возведения в степень.");

  let result = A.map((row, i) =>
    row.map((val, j) => (i === j ? new Fraction(1) : new Fraction(0)))
  );

  for (let p = 0; p < power; p++) {
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
      if (typeof elem !== "number") throw new Error("Степень должна быть числом.");
      return matrixPow(acc, elem);
    default:
      throw new Error("Неизвестная операция: " + op);
  }
}

function calculateLocally(elements) {
  if (elements.length === 0) throw new Error("Нет элементов.");

  let acc;
  const first = elements[0];

  if (first.type === "matrix") {
    acc = parseFractionMatrix(first.data);
  } else if (first.type === "scalar") {
    acc = new Fraction(first.data);
  } else {
    throw new Error("Неизвестный тип элемента.");
  }

  for (let i = 1; i < elements.length; i++) {
    const el = elements[i];
    const op = el.operation;
    if (!op) throw new Error("Операция не указана.");

    let operand;

    if (el.type === "matrix") {
      operand = parseFractionMatrix(el.data);
      if (op === "^") throw new Error("Нельзя возводить в степень матрицу.");
    } else if (el.type === "scalar") {
      operand = new Fraction(el.data);
      if (!["*", "/", "^"].includes(op))
        throw new Error(`Операция '${op}' недоступна для скаляров.`);
      if (op === "^") operand = operand.valueOf(); // Fraction to number
    } else {
      throw new Error("Неизвестный тип элемента.");
    }

    acc = applyOperation(acc, operand, op);
  }

  return acc;
}

// Кнопка "Посчитать"
calcBtn.onclick = () => {
  try {
    const result = calculateLocally(elements);
    if (result instanceof Fraction) {
      resultDiv.textContent = result.toFraction();
    } else {
      resultDiv.innerHTML = result
        .map(row => row.map(cell => cell.toFraction()).join(" "))
        .join("\n");
    }
  } catch (e) {
    resultDiv.textContent = "Ошибка: " + e.message;
  }
};
