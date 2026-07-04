/* ═══════════════════════════
   My Balance — App Logic
   ═══════════════════════════ */

let transactions = [];
let prevBalance = 0;
let currentType = 'income';
const AUTH_KEY = 'bal_token';

function getToken() { return localStorage.getItem(AUTH_KEY); }
function setToken(t) { localStorage.setItem(AUTH_KEY, t); }
function clearToken() { localStorage.removeItem(AUTH_KEY); }

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function showLogin() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginOverlay').style.display = 'flex';
}

function showApp() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('app').style.display = '';
  if (typeof Lenis !== 'undefined') {
    const l = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(t) { l.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  initTilt();
  fetchTransactions();
}

async function login(password) {
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginSpinner = document.getElementById('loginSpinner');
  const loginError = document.getElementById('loginError');
  loginBtn.disabled = true;
  loginBtnText.style.display = 'none';
  loginSpinner.style.display = 'block';
  loginError.classList.remove('show');
  try {
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await res.json();
    if (data.ok && data.token) {
      setToken(data.token);
      showApp();
    } else {
      loginError.classList.add('show');
      loginBtn.disabled = false;
      loginBtnText.style.display = 'inline';
      loginSpinner.style.display = 'none';
    }
  } catch {
    loginError.classList.add('show');
    loginBtn.disabled = false;
    loginBtnText.style.display = 'inline';
    loginSpinner.style.display = 'none';
  }
}

function logout() {
  clearToken();
  showLogin();
}

function formatPKR(n) {
  return Math.abs(n).toLocaleString('en-PK');
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

function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

function getBalance() {
  return transactions.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
}

function getTotalIncome() {
  return transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

function getTotalExpense() {
  return transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

function animateNumber(el, from, to, duration = 500) {
  const start = performance.now();
  const absTo = Math.abs(to);
  const absFrom = Math.abs(from);
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(absFrom + (absTo - absFrom) * eased);
    el.textContent = (to < 0 ? '-' : '') + current.toLocaleString('en-PK');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function fireConfetti() {}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? 'i-check' : 'i-x';
  toast.innerHTML = `<span class="toast-icon ${type}"><svg width="16" height="16"><use href="#${icon}"/></svg></span>${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 250); }, 3000);
}

function setBtnState(btn, state) {
  btn.classList.remove('loading', 'success');
  if (state) btn.classList.add(state);
}

function updateBalanceCard(newBalance) {
  const balanceEl = document.getElementById('balance');
  const cardEl = document.getElementById('balanceCard');
  const incomeEl = document.getElementById('totalIncome');
  const expenseEl = document.getElementById('totalExpense');

  animateNumber(balanceEl, prevBalance, newBalance, 600);

  balanceEl.className = 'balance-amount' + (newBalance > 0 ? ' positive' : newBalance < 0 ? ' negative' : '');

  cardEl.classList.remove('flash-green', 'flash-red');
  if (newBalance > prevBalance) {
    cardEl.classList.add('flash-green');
    if (newBalance > 0) fireConfetti();
  } else if (newBalance < prevBalance) {
    cardEl.classList.add('flash-red');
  }
  setTimeout(() => cardEl.classList.remove('flash-green', 'flash-red'), 400);

  incomeEl.textContent = formatPKR(getTotalIncome());
  expenseEl.textContent = formatPKR(getTotalExpense());

  balanceEl.classList.remove('bump');
  void balanceEl.offsetWidth;
  if (newBalance !== prevBalance) balanceEl.classList.add('bump');

  document.title = (newBalance >= 0 ? '' : '-') + 'PKR ' + Math.abs(newBalance).toLocaleString('en-PK') + ' — My Balance';

  prevBalance = newBalance;
}

function render() {
  const listEl = document.getElementById('transactionList');
  const countEl = document.getElementById('transactionCount');
  const balance = getBalance();

  countEl.textContent = transactions.length;

  updateBalanceCard(balance);

  if (transactions.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M12 14h4"/></svg>
        <p>No transactions yet</p>
        <p class="empty-sub">Add income or expenses to get started</p>
      </div>`;
    return;
  }

  const groups = {};
  for (const t of transactions) {
    const d = new Date(t.date);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    let key;
    if (d.toDateString() === today.toDateString()) key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = 'Earlier';
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  listEl.innerHTML = '';
  let idx = 0;
  for (const [group, items] of Object.entries(groups)) {
    const header = document.createElement('div');
    header.className = 'tx-group-header';
    header.textContent = group;
    listEl.appendChild(header);

    for (const t of items) {
      const div = document.createElement('div');
      div.className = 'transaction';
      div.style.animationDelay = `${idx * 0.04}s`;
      div.style.animation = `scaleIn 0.35s var(--ease) ${idx * 0.04}s both`;
      div.innerHTML = `
        <div class="transaction-info">
          <div class="tx-icon ${t.type}">
            <svg width="16" height="16"><use href="#i-${t.type === 'income' ? 'arrow-up' : 'arrow-down'}"/></svg>
          </div>
          <div class="tx-details">
            <div class="tx-source">${escapeHtml(t.source)}</div>
            <div class="tx-date">${relativeTime(t.date)}</div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatPKR(t.amount)}</span>
          <button class="tx-delete" data-id="${t.id}" title="Delete" aria-label="Delete transaction">
            <svg width="14" height="14"><use href="#i-trash"/></svg>
          </button>
        </div>`;
      listEl.appendChild(div);
      idx++;
    }
  }
}

function showSkeleton() {
  const listEl = document.getElementById('transactionList');
  listEl.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton';
    s.innerHTML = '<div class="skeleton-icon"></div><div style="flex:1"><div class="skeleton-line w60"></div><div class="skeleton-line w30" style="margin-top:8px"></div></div>';
    listEl.appendChild(s);
  }
}

async function fetchTransactions() {
  showSkeleton();
  try {
    const res = await fetch('/api/transactions', { headers: authHeaders() });
    if (res.status === 401) { clearToken(); showLogin(); return; }
    const data = await res.json();
    transactions = data.transactions || [];
  } catch {
    transactions = [];
  }
  render();
}

async function addTransaction() {
  const btn = document.getElementById('submitBtn');
  const sourceEl = document.getElementById('source');
  const amountEl = document.getElementById('amount');
  const source = sourceEl.value.trim();
  const amount = parseFloat(amountEl.value);

  if (!source || !amount || amount <= 0) {
    const card = btn.closest('.card');
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = 'formShake 0.4s ease';
    return;
  }

  setBtnState(btn, 'loading');

  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ type: currentType, source, amount })
    });

    if (res.ok) {
      setBtnState(btn, 'success');
      showToast(currentType === 'income' ? 'Income added' : 'Expense recorded', 'success');
      sourceEl.value = '';
      amountEl.value = '';
      await fetchTransactions();
      setTimeout(() => setBtnState(btn, null), 1200);
    } else {
      throw new Error('Failed');
    }
  } catch {
    setBtnState(btn, null);
    showToast('Something went wrong', 'error');
  }
}

// ── Event Listeners ──

document.getElementById('transactionForm').addEventListener('submit', e => {
  e.preventDefault();
  addTransaction();
});

document.getElementById('typeToggle').addEventListener('click', e => {
  const seg = e.target.closest('.segment');
  if (!seg) return;
  document.querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
  seg.classList.add('active');
  currentType = seg.dataset.type;
  const btn = document.getElementById('submitBtn');
  btn.className = 'btn type-' + currentType;
  btn.querySelector('.btn-text').innerHTML = `<svg width="14" height="14"><use href="#i-plus"/></svg> Add ${currentType === 'income' ? 'Income' : 'Expense'}`;
});

document.getElementById('clearAll').addEventListener('click', async () => {
  if (transactions.length === 0) return;
  if (!confirm('Delete all transactions?')) return;
  try {
    await fetch('/api/transactions', { method: 'DELETE', headers: authHeaders() });
    showToast('All transactions cleared', 'success');
    await fetchTransactions();
  } catch {
    showToast('Failed to clear', 'error');
  }
});

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  login(document.getElementById('loginPassword').value);
});

document.getElementById('loginPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') login(e.target.value);
});

document.getElementById('logoutBtn').addEventListener('click', logout);

document.getElementById('transactionList').addEventListener('click', async e => {
  const btn = e.target.closest('.tx-delete');
  if (!btn) return;
  const id = btn.dataset.id;
  const item = btn.closest('.transaction');
  if (item) {
    item.classList.add('removing');
    await new Promise(r => setTimeout(r, 250));
  }
  try {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers: authHeaders() });
    showToast('Transaction deleted', 'success');
    await fetchTransactions();
  } catch {
    showToast('Delete failed', 'error');
    await fetchTransactions();
  }
});

// ── 3D Tilt (subtle) ──
function initTilt() {
  const card = document.getElementById('balanceCard');
  if (!card) return;
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  if (getToken()) {
    showApp();
  } else {
    showLogin();
  }
});
