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

async function render() {
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
  for (const t of transactions) {
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
    await fetchTransactions();
  } catch {}
});

document.getElementById('clearAll').addEventListener('click', async () => {
  if (transactions.length === 0) return;
  if (!confirm('Delete all transactions?')) return;
  try {
    await fetch('/api/transactions', { method: 'DELETE' });
    await fetchTransactions();
  } catch {}
});

document.getElementById('transactionList').addEventListener('click', async e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  try {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    await fetchTransactions();
  } catch {}
});

fetchTransactions();
