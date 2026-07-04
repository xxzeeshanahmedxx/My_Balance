/* ═══════════════════════════════════════════
   My Balance — App Logic + Animations
   ═══════════════════════════════════════════ */

let transactions = [];
let prevBalance = 0;

// ── Helpers ──
function formatPKR(n) {
  return 'PKR ' + Math.abs(n).toLocaleString('en-PK');
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

// ── Animated Number Counter ──
function animateNumber(el, from, to, duration = 500) {
  const start = performance.now();
  const isNeg = to < 0;
  const absTo = Math.abs(to);
  const absFrom = Math.abs(from);

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(absFrom + (absTo - absFrom) * eased);
    el.textContent = formatPKR(to).replace('PKR', isNeg ? '-PKR' : 'PKR').replace('PKR 0', 'PKR 0');
    el.textContent = (isNeg ? '-' : '') + 'PKR ' + current.toLocaleString('en-PK');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Confetti ──
function fireConfetti() {
  if (typeof confetti !== 'function') return;
  confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#22c55e', '#16a34a', '#6366f1', '#fbbf24'] });
  setTimeout(() => confetti({ particleCount: 30, spread: 50, origin: { y: 0.8, x: 0.6 } }), 150);
  setTimeout(() => confetti({ particleCount: 20, spread: 40, origin: { y: 0.85, x: 0.4 } }), 300);
}

// ── Toast ──
function showToast(message, type = 'success') {
  const wrap = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const iconName = type === 'success' ? 'i-check' : 'i-x';
  toast.innerHTML = `<span class="toast-icon ${type}"><svg width="16" height="16"><use xlink:href="#${iconName}"/></svg></span>${escapeHtml(message)}`;
  wrap.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── Ripple Effect ──
function createRipple(e, container) {
  const rect = container.getBoundingClientRect();
  const ripple = document.createElement('div');
  ripple.className = 'card-ripple';
  const size = Math.max(rect.width, rect.height) * 2;
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  container.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ── Button State ──
function setBtnState(btn, state) {
  btn.classList.remove('success', 'loading');
  if (state) btn.classList.add(state);
}

// ── Scroll Progress ──
function updateScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0%';
}

// ── Scroll to Top ──
function updateScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  btn.classList.toggle('visible', window.scrollY > 400);
}

// ── Spotlight ──
function updateSpotlight(e) {
  const el = document.getElementById('spotlight');
  if (!el) return;
  el.style.left = e.clientX + 'px';
  el.style.top = e.clientY + 'px';
}

// ── 3D Tilt ──
function initTilt() {
  const card = document.getElementById('balanceCard');
  if (!card) return;
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.01)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
  });
}

// ── Lenis Smooth Scroll ──
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

// ── Card Focus Tracking ──
function initCardFocus() {
  document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('focus', () => {
      input.closest('.card').classList.add('card-focused');
    });
    input.addEventListener('blur', () => {
      input.closest('.card').classList.remove('card-focused');
    });
  });
}

// ── Live Validation Dots ──
function initValidation() {
  document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('input', () => {
      const group = input.closest('.input-group');
      if (input.value.trim().length > 0) {
        group.classList.add('valid');
      } else {
        group.classList.remove('valid');
      }
    });
  });
}

// ── Balance Card Updates ──
function updateBalanceCard(newBalance) {
  const balanceEl = document.getElementById('balance');
  const glowEl = document.getElementById('balanceGlow');
  const cardEl = document.getElementById('balanceCard');
  const barEl = document.getElementById('balanceBar');
  const incomeEl = document.getElementById('totalIncome');
  const expenseEl = document.getElementById('totalExpense');
  const ringWrap = document.getElementById('progressRingWrap');
  const ringFill = document.getElementById('progressRingFill');
  const ringText = document.getElementById('progressRingText');

  // Animate number
  animateNumber(balanceEl, prevBalance, newBalance, 600);

  // Color class
  balanceEl.className = 'balance-amount' + (newBalance > 0 ? ' positive' : newBalance < 0 ? ' negative' : '');

  // Shimmer
  balanceEl.classList.remove('shimmer');
  void balanceEl.offsetWidth;
  if (newBalance !== prevBalance) balanceEl.classList.add('shimmer');

  // Color flash
  cardEl.classList.remove('flash-green', 'flash-red');
  if (newBalance > prevBalance) {
    cardEl.classList.add('flash-green');
    fireConfetti();
  } else if (newBalance < prevBalance) {
    cardEl.classList.add('flash-red');
  }
  setTimeout(() => cardEl.classList.remove('flash-green', 'flash-red'), 500);

  // Glow color
  if (newBalance > 0) {
    glowEl.style.background = 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)';
  } else if (newBalance < 0) {
    glowEl.style.background = 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)';
  } else {
    glowEl.style.background = 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)';
  }

  // Stats
  const totalInc = getTotalIncome();
  const totalExp = getTotalExpense();
  incomeEl.textContent = formatPKR(totalInc);
  expenseEl.textContent = formatPKR(totalExp);

  // Balance bar
  const max = Math.max(totalInc, totalExp, 1);
  const pct = Math.min((newBalance >= 0 ? totalInc : totalExp) / max * 100, 100);
  barEl.style.width = pct + '%';
  barEl.style.background = newBalance >= 0
    ? 'linear-gradient(90deg, #22c55e, #6366f1)'
    : 'linear-gradient(90deg, #ef4444, #f97316)';

  // Progress ring
  if (totalInc > 0 || totalExp > 0) {
    ringWrap.classList.add('visible');
    const ratio = totalInc / (totalInc + totalExp) * 100;
    ringFill.style.strokeDashoffset = 100 - ratio;
    ringFill.style.stroke = ratio >= 50 ? 'var(--green)' : ratio >= 30 ? '#f59e0b' : 'var(--red)';
    ringText.textContent = Math.round(ratio) + '%';
  } else {
    ringWrap.classList.remove('visible');
  }

  // Bump animation
  balanceEl.classList.remove('bump');
  void balanceEl.offsetWidth;
  if (newBalance !== prevBalance) balanceEl.classList.add('bump');

  // Update page title
  document.title = (newBalance >= 0 ? '' : '-') + 'PKR ' + Math.abs(newBalance).toLocaleString('en-PK') + ' — My Balance';

  prevBalance = newBalance;
}

// ── Render Transactions ──
function render() {
  const listEl = document.getElementById('transactionList');
  const countEl = document.getElementById('transactionCount');
  const balance = getBalance();

  countEl.textContent = transactions.length;
  countEl.classList.remove('bump');
  void countEl.offsetWidth;
  countEl.classList.add('bump');

  updateBalanceCard(balance);

  if (transactions.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state" id="emptyState">
        <div class="empty-illustration">
          <svg class="empty-svg" viewBox="0 0 120 100" fill="none">
            <rect x="20" y="30" width="80" height="55" rx="8" stroke="#3a3a5c" stroke-width="2" stroke-dasharray="4 4"/>
            <path d="M50 55h20M50 65h14" stroke="#3a3a5c" stroke-width="2" stroke-linecap="round"/>
            <circle cx="60" cy="25" r="8" fill="rgba(99,102,241,0.15)" stroke="#6366f1" stroke-width="1.5"/>
            <path d="M57 25l2 2 4-4" stroke="#818cf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p>No transactions yet</p>
        <p class="empty-sub">Add income or expenses above</p>
      </div>`;
    return;
  }

  // Group by date
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
    header.style.cssText = 'font-size:11px;font-weight:700;color:#86868b;text-transform:uppercase;letter-spacing:1px;padding:8px 16px 4px;';
    header.textContent = group;
    listEl.appendChild(header);

    for (const t of items) {
      const div = document.createElement('div');
      div.className = 'transaction';
      div.style.animationDelay = `${idx * 0.04}s`;
      div.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-icon ${t.type}">
            <svg width="18" height="18"><use xlink:href="#i-${t.type === 'income' ? 'arrow-up' : 'arrow-down'}"/></svg>
          </div>
          <div>
            <div class="transaction-source">${escapeHtml(t.source)}</div>
            <div class="transaction-date">${relativeTime(t.date)}</div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="transaction-type ${t.type}">${t.type}</span>
          <span class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatPKR(t.amount)}</span>
          <button class="delete-btn" data-id="${t.id}" title="Delete">
            <svg width="14" height="14"><use xlink:href="#i-trash"/></svg>
          </button>
        </div>`;
      listEl.appendChild(div);
      idx++;
    }
  }
}

// ── Show Skeleton ──
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

// ── Fetch Transactions ──
async function fetchTransactions() {
  showSkeleton();
  try {
    const res = await fetch('/api/transactions');
    const data = await res.json();
    transactions = data.transactions || [];
  } catch {
    transactions = [];
  }
  render();
}

// ── Add Transaction ──
async function addTransaction(type) {
  const btn = document.getElementById(type === 'income' ? 'incomeBtn' : 'expenseBtn');
  const sourceEl = document.getElementById(type + 'Source');
  const amountEl = document.getElementById(type + 'Amount');
  const source = sourceEl.value.trim();
  const amount = parseFloat(amountEl.value);

  if (!source || !amount || amount <= 0) {
    // Shake form
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, source, amount })
    });

    if (res.ok) {
      setBtnState(btn, 'success');
      showToast(type === 'income' ? 'Income added!' : 'Expense recorded', 'success');
      sourceEl.value = '';
      amountEl.value = '';
      // Reset validation dots
      sourceEl.closest('.input-group').classList.remove('valid');
      amountEl.closest('.input-group').classList.remove('valid');
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
document.getElementById('incomeForm').addEventListener('submit', e => { e.preventDefault(); addTransaction('income'); });
document.getElementById('expenseForm').addEventListener('submit', e => { e.preventDefault(); addTransaction('expense'); });

document.getElementById('clearAll').addEventListener('click', async () => {
  if (transactions.length === 0) return;
  if (!confirm('Delete all transactions?')) return;
  try {
    await fetch('/api/transactions', { method: 'DELETE' });
    showToast('All transactions cleared', 'success');
    await fetchTransactions();
  } catch {}
});

document.getElementById('transactionList').addEventListener('click', async e => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;

  const item = btn.closest('.transaction');
  if (item) {
    item.style.animation = 'slideOut 0.3s var(--ease-out) forwards';
    await new Promise(r => setTimeout(r, 300));
  }

  try {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    showToast('Transaction deleted', 'success');
    await fetchTransactions();
  } catch {}
});

// Ripple on cards
document.querySelectorAll('.card-ripple-wrap').forEach(el => {
  el.addEventListener('click', e => createRipple(e, el.closest('.card')));
});

// Scroll events
window.addEventListener('scroll', () => {
  updateScrollProgress();
  updateScrollTop();
}, { passive: true });

// Mouse spotlight
document.addEventListener('mousemove', updateSpotlight, { passive: true });

// Scroll to top
document.getElementById('scrollTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Shake animation (injected) ──
const style = document.createElement('style');
style.textContent = `@keyframes formShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`;
document.head.appendChild(style);

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initTilt();
  initLenis();
  initCardFocus();
  initValidation();
  fetchTransactions();
});
