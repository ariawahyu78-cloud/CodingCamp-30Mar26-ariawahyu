let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let spendingLimit = parseFloat(localStorage.getItem('spendingLimit')) || 0;
let pieChart = null;

const categoryColors = {
  Makanan: '#e74c3c',
  Transportasi: '#3498db',
  Hiburan: '#2ecc71'
};

function saveToStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function formatRupiah(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  document.getElementById('total-balance').textContent = formatRupiah(total);

  const balanceBox = document.querySelector('.balance-box');
  const warning = document.getElementById('limit-warning');

  if (spendingLimit > 0 && total > spendingLimit) {
    balanceBox.classList.add('over-limit');
    warning.textContent = `⚠️ Pengeluaran melebihi batas! (Batas: ${formatRupiah(spendingLimit)})`;
  } else {
    balanceBox.classList.remove('over-limit');
    warning.textContent = spendingLimit > 0 ? `Batas aktif: ${formatRupiah(spendingLimit)}` : '';
  }
}

function renderList() {
  const ul = document.getElementById('transaction-list');
  ul.innerHTML = '';

  if (transactions.length === 0) {
    ul.innerHTML = '<li style="color:#aaa;justify-content:center;">Belum ada transaksi.</li>';
    return;
  }

  transactions.forEach((t, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item-info">
        <span class="item-name">${t.name}</span>
        <span class="item-category">${t.category}</span>
      </div>
      <div style="display:flex;align-items:center;">
        <span class="item-amount">${formatRupiah(t.amount)}</span>
        <button class="delete-btn" onclick="deleteTransaction(${index})" title="Hapus">&#x2715;</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function renderChart() {
  const noDataMsg = document.getElementById('no-data-msg');
  const canvas = document.getElementById('pie-chart');

  if (transactions.length === 0) {
    noDataMsg.style.display = 'block';
    canvas.style.display = 'none';
    if (pieChart) { pieChart.destroy(); pieChart = null; }
    return;
  }

  noDataMsg.style.display = 'none';
  canvas.style.display = 'block';

  // Hitung total per kategori
  const totals = {};
  transactions.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = labels.map(l => categoryColors[l] || '#95a5a6');

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2 }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderMonthlySummary() {
  const container = document.getElementById('monthly-summary');
  if (transactions.length === 0) {
    container.innerHTML = '<p style="color:#aaa;font-size:0.9rem;">Belum ada data.</p>';
    return;
  }

  const monthly = {};
  transactions.forEach(t => {
    const date = t.date ? new Date(t.date) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + t.amount;
  });

  const sorted = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0]));
  container.innerHTML = `<div class="summary-grid">${
    sorted.map(([key, total]) => {
      const [year, month] = key.split('-');
      const label = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      return `<div class="summary-item"><span>${label}</span><strong>${formatRupiah(total)}</strong></div>`;
    }).join('')
  }</div>`;
}

function render() {
  updateBalance();
  renderList();
  renderChart();
  renderMonthlySummary();
}

function addTransaction() {
  const name = document.getElementById('item-name').value.trim();
  const amount = parseFloat(document.getElementById('item-amount').value.replace(/\./g, ''));
  const category = document.getElementById('item-category').value;
  const errorMsg = document.getElementById('error-msg');

  if (!name || !amount || !category) {
    errorMsg.textContent = 'Semua kolom harus diisi.';
    return;
  }
  if (amount <= 0) {
    errorMsg.textContent = 'Jumlah harus lebih dari 0.';
    return;
  }

  errorMsg.textContent = '';
  transactions.push({ name, amount, category, date: new Date().toISOString() });
  saveToStorage();
  render();

  // Reset form
  document.getElementById('item-name').value = '';
  document.getElementById('item-amount').value = '';
  document.getElementById('item-category').value = '';
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveToStorage();
  render();
}

document.getElementById('add-btn').addEventListener('click', addTransaction);

// Set batas pengeluaran
document.getElementById('set-limit-btn').addEventListener('click', () => {
  const val = parseFloat(document.getElementById('spending-limit').value.replace(/\./g, ''));
  if (!isNaN(val) && val > 0) {
    spendingLimit = val;
    localStorage.setItem('spendingLimit', val);
    document.getElementById('spending-limit').value = '';
    updateBalance();
  }
});

// Dark/Light mode toggle
const themeBtn = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeBtn.textContent = '☀️ Light';
}

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeBtn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Tampilkan batas aktif jika ada
if (spendingLimit > 0) {
  document.getElementById('limit-warning').textContent = `Batas aktif: ${formatRupiah(spendingLimit)}`;
}

// Initial render
render();
