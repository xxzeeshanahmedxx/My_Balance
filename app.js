let transactions = [];

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

function getBalance() {
  return transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
}

function bumpBalance() {
  const el = document.getElementById('balance');
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

async function fetchTransactions() {
  try {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    transactions = data.transactions || [];
  } catch {
    transactions = [];
  }
  render();
}

function render() {
  const balanceEl = document.getElementById('balance');
  const listEl = document.getElementById('transactionList');
  const countEl = document.getElementById('transactionCount');
  const barEl = document.getElementById('balanceBar');
  const balance = getBalance();

  balanceEl.textContent = formatPKR(balance);
  balanceEl.className = 'balance-amount' + (balance > 0 ? ' positive' : balance < 0 ? ' negative' : '');

  countEl.textContent = transactions.length;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const max = Math.max(totalIncome, totalExpense, 1);
  const pct = Math.min((balance >= 0 ? totalIncome : totalExpense) / max * 100, 100);

  barEl.style.width = pct + '%';
  barEl.style.background = balance >= 0
    ? 'linear-gradient(90deg, #22c55e, #6366f1)'
    : 'linear-gradient(90deg, #ef4444, #f97316)';

  if (transactions.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No transactions yet</p>
        <p class="empty-sub">Add income or expenses above</p>
      </div>`;
    return;
  }

  listEl.innerHTML = '';
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const div = document.createElement('div');
    div.className = 'transaction';
    div.style.animationDelay = `${i * 0.05}s`;

    div.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-icon ${t.type}">${t.type === 'income' ? '↑' : '↓'}</div>
        <div>
          <div class="transaction-source">${escapeHtml(t.source)}</div>
          <div class="transaction-date">${formatDate(t.date)}</div>
        </div>
      </div>
      <div class="transaction-right">
        <span class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatPKR(t.amount)}</span>
        <button class="delete-btn" data-id="${t.id}" title="Delete">✕</button>
      </div>`;

    listEl.appendChild(div);
  }
}

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

document.getElementById('incomeForm').addEventListener('submit', async e => {
  e.preventDefault();
  const source = document.getElementById('incomeSource').value.trim();
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  if (!source || !amount || amount <= 0) return;

  try {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'income', source, amount })
    });
    document.getElementById('incomeSource').value = '';
    document.getElementById('incomeAmount').value = '';
    bumpBalance();
    await fetchTransactions();
  } catch {}
});

document.getElementById('expenseForm').addEventListener('submit', async e => {
  e.preventDefault();
  const source = document.getElementById('expenseSource').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  if (!source || !amount || amount <= 0) return;

  try {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'expense', source, amount })
    });
    document.getElementById('expenseSource').value = '';
    document.getElementById('expenseAmount').value = '';
    bumpBalance();
    await fetchTransactions();
  } catch {}
});

document.getElementById('clearAll').addEventListener('click', async () => {
  if (transactions.length === 0) return;
  if (!confirm('Delete all transactions?')) return;
  try {
    await fetch('/api/transactions', { method: 'DELETE' });
    bumpBalance();
    await fetchTransactions();
  } catch {}
});

document.getElementById('transactionList').addEventListener('click', async e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;

  const item = btn.closest('.transaction');
  if (item) {
    item.style.animation = 'slideOut 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards';
    await new Promise(r => setTimeout(r, 300));
  }

  try {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    bumpBalance();
    await fetchTransactions();
  } catch {}
});

fetchTransactions();
