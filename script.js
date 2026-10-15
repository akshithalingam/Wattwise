const $ = id => document.getElementById(id);
const money = (n, d = 2) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const watts = { 'LED bulb': 9, 'Ceiling fan': 75, 'Television': 100, 'Laptop': 50, 'Refrigerator': 150,
  'Air conditioner': 1500, 'Washing machine': 500, 'Electric iron': 1000, 'Custom appliance': 100 };
let items = [], history = JSON.parse(localStorage.getItem('wattwise') || '[]');

// ---------- Bill calculator, dashboard & savings ----------
function update() {
  const units = +$('u').value || 0, rate = +$('r').value || 0, fixed = +$('f').value || 0;
  const days = +$('d').value || 30, pct = +$('p').value;
  const energy = units * rate, total = energy + fixed, saved = total * pct / 100;
  $('ur').value = units;
  $('total').textContent = money(total);
  $('formula').textContent = `${units} units × ${money(rate)} + ${money(fixed, 0)} fixed charge`;
  $('cE').textContent = money(energy, 0);
  $('cF').textContent = money(fixed, 0);
  $('barE').style.width = total ? energy / total * 100 + '%' : '0';
  $('barF').style.width = total ? fixed / total * 100 + '%' : '0';
  $('insight').textContent = `Every 10 units saved could reduce your estimate by ${money(rate * 10, 0)}.`;
  $('dBill').textContent = money(total, 0);
  $('dUnits').textContent = units + ' kWh';
  $('dDaily').textContent = (units / days).toFixed(1) + ' kWh';
  $('dSave').textContent = money(saved, 0);
  $('pct').textContent = pct + '%';
  $('sSave').textContent = money(saved);
  $('sNew').textContent = money(total - saved);
}

$('calc').addEventListener('input', e => { if (e.target.id === 'ur') $('u').value = e.target.value; update(); });
$('p').addEventListener('input', update);
$('reset').onclick = () => { $('calc').reset(); update(); };

// ---------- History ----------
function renderHistory() {
  localStorage.setItem('wattwise', JSON.stringify(history));
  $('hList').innerHTML = history.length
    ? history.map(h => `<li class="list-group-item d-flex justify-content-between"><span>${h.date} — ${h.units} units @ ${money(h.rate)}</span><b>${money(h.total)}</b></li>`).join('')
    : '<li class="list-group-item text-body-secondary">No saved estimates yet. Use “Save estimate” in the calculator to keep one here.</li>';
}
$('save').onclick = () => {
  const units = +$('u').value || 0, rate = +$('r').value || 0, fixed = +$('f').value || 0;
  history.unshift({ date: new Date().toLocaleString(), units, rate, total: units * rate + fixed });
  renderHistory();
};
$('hClear').onclick = () => { history = []; renderHistory(); };

// ---------- Appliance planner ----------
const kwh = (w, q, h, d) => w * q * h * d / 1000;
function previewAppliance() { $('aEst').textContent = kwh($('aW').value, $('aQ').value, $('aH').value, $('aD').value).toFixed(2) + ' kWh'; }

function renderAppliances() {
  const total = items.reduce((s, i) => s + kwh(i.w, i.q, i.h, i.d), 0);
  $('aCount').textContent = items.length + ' items';
  $('aTotal').textContent = total.toFixed(2) + ' kWh';
  $('aCost').textContent = money(total * (+$('r').value || 0));
  $('aList').innerHTML = items.length ? items.map((i, n) => `
    <div class="d-flex align-items-center gap-2 mb-2">
      <span class="flex-grow-1">${i.name} (${i.w}W × ${i.q})</span>
      <input type="number" min="0" max="24" step="0.5" value="${i.h}" data-n="${n}" class="form-control form-control-sm" style="width:70px"> h/day
      <b style="width:80px">${kwh(i.w, i.q, i.h, i.d).toFixed(2)} kWh</b>
      <button class="btn-close" data-del="${n}"></button>
    </div>`).join('') : 'Add an appliance to start exploring your energy use.';
}

$('aType').innerHTML = Object.keys(watts).map(k => `<option>${k}</option>`).join('');
$('aType').onchange = () => { $('aW').value = watts[$('aType').value]; previewAppliance(); };
$('aForm').addEventListener('input', previewAppliance);
$('aForm').onsubmit = e => {
  e.preventDefault();
  items.push({ name: $('aType').value, w: +$('aW').value, q: +$('aQ').value, h: +$('aH').value, d: +$('aD').value });
  renderAppliances();
};
$('aList').addEventListener('input', e => { if (e.target.dataset.n) { items[e.target.dataset.n].h = +e.target.value; renderAppliances(); } });
$('aList').addEventListener('click', e => { if (e.target.dataset.del) { items.splice(e.target.dataset.del, 1); renderAppliances(); } });
$('aClear').onclick = () => { items = []; renderAppliances(); };
$('aUse').onclick = () => {
  $('u').value = Math.round(items.reduce((s, i) => s + kwh(i.w, i.q, i.h, i.d), 0));
  update();
  $('calculator').scrollIntoView();
};

// ---------- Theme toggle ----------
$('theme').onclick = () => {
  const dark = document.documentElement.dataset.bsTheme === 'light';
  document.documentElement.dataset.bsTheme = dark ? 'dark' : 'light';
  $('theme').textContent = dark ? '☾ Dark mode' : '☼ Light mode';
};

// ---------- Init ----------
$('aType').onchange();
update();
renderAppliances();
renderHistory();
