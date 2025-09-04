const chainContainer = document.getElementById("chain-container");
const exampleLine = document.getElementById("example-line");
const addBtn = document.getElementById("add-new-element-btn");
const calcBtn = document.getElementById("calculate-btn");
const resultDiv = document.getElementById("result");

const elementTemplate = document.getElementById("element-template");

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

calcBtn.onclick = async () => {
  const res = await fetch("/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ elements })
  });

  const json = await res.json();
  if (json.error) {
    resultDiv.textContent = "Ошибка: " + json.error;
  } else {
    if (typeof json.result === "string") {
      resultDiv.textContent = json.result;
    } else {
      resultDiv.innerHTML = json.result.map(row => row.join(" ")).join("\n");
    }
  }
};