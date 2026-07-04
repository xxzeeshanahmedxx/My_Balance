const STORAGE_KEY = 'my_balance_data';

let transactions = loadData();

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function getBalance() {
  return transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
}

function formatPKR(n) {
  return 'PKR ' + n.toLocaleString('en-PK');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function render() {
  const balanceEl = document.getElementById('balance');
  const listEl = document.getElementById('transactionList');
  const balance = getBalance();

  balanceEl.textContent = formatPKR(balance);
  balanceEl.className = 'balance-amount' + (balance > 0 ? ' positive' : balance < 0 ? ' negative' : '');

  if (transactions.length === 0) {
    listEl.innerHTML = '<p class="empty-msg">No transactions yet.</p>';
    return;
  }

  listEl.innerHTML = '';
  for (const t of [...transactions].reverse()) {
    const div = document.createElement('div');
    div.className = 'transaction';

    div.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-icon ${t.type}">${t.type === 'income' ? '+' : '-'}</div>
        <div>
          <div class="transaction-source">${escapeHtml(t.source)}</div>
          <div class="transaction-date">${formatDate(t.date)}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatPKR(t.amount)}</span>
        <button class="delete-btn" data-id="${t.id}">✕</button>
      </div>
    `;

    listEl.appendChild(div);
  }
}

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function addTransaction(type) {
  const sourceInput = document.getElementById(type + 'Source');
  const amountInput = document.getElementById(type + 'Amount');
  const source = sourceInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!source || !amount || amount <= 0) return;

  transactions.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type,
    source,
    amount,
    date: new Date().toISOString()
  });

  saveData();
  sourceInput.value = '';
  amountInput.value = '';
  render();
}

document.getElementById('incomeForm').addEventListener('submit', e => {
  e.preventDefault();
  addTransaction('income');
});

document.getElementById('expenseForm').addEventListener('submit', e => {
  e.preventDefault();
  addTransaction('expense');
});

document.getElementById('clearAll').addEventListener('click', () => {
  if (transactions.length === 0) return;
  if (confirm('Delete all transactions?')) {
    transactions = [];
    saveData();
    render();
  }
});

document.getElementById('transactionList').addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  render();
});

render();
