// app.js — LV Spices CAPA Register
// Customer-Complaint-style UI: sidebar nav + full table + wave stat cards

import { saveRecord, loadAllRecords, updateCloudBadge } from './firebase-config.js';

// ── 20 NC REASONS (for auto-generation only — NOT shown as predefined in UI) ─
const NC_REASONS = [
  'Raw material bag found open or not properly closed',
  'Foreign matter (stones, sticks, insects) found in raw material',
  'Wrong raw material used in blending',
  'Incorrect blending ratio used',
  'Machine / mixer not cleaned properly before use',
  'Previous product residue found in equipment',
  'Incorrect product label (wrong name, weight, date)',
  'Missing or unlabelled packages found',
  'Wrong net weight in packed product',
  'Damaged or leaking packaging material',
  'Expired raw material used',
  'Improper storage conditions (moisture, heat, direct sunlight)',
  'Pest signs (insects, rodents) found in storage area',
  'Workers not wearing required PPE (hair cap, mask, gloves, apron)',
  'Poor personal hygiene (unclean hands, nails)',
  'Unclean work surface or handling tools',
  'Cross-contamination between different spices',
  'Improper waste disposal / open waste bins',
  'Temperature / humidity outside recommended limit',
  'Inadequate supervision or lack of staff training'
];

const AREAS = [
  'Blending / Mixing', 'Repacking & Filling', 'Packing Area',
  'Storage / Warehouse', 'Hygiene & Sanitation', 'Quality Checking',
  'Loading & Dispatch', 'Raw Material Receiving'
];

const PRODUCTS = [
  'Turmeric Powder', 'Red Chilli Powder', 'Coriander Powder', 'Cumin Seeds',
  'Garam Masala', 'Black Pepper Powder', 'Mustard Seeds', 'Mixed Masala',
  'Fennel Seeds', 'Cardamom Powder', 'Dry Ginger Powder', 'Kashmiri Chilli Powder'
];

const IMMEDIATE_ACTIONS = [
  'Product batch quarantined and re-checked immediately.',
  'Equipment cleaned and sanitized thoroughly before restart.',
  'Labelling corrected and re-applied on all affected units.',
  'Faulty stock segregated and disposed as per FSSAI norms.',
  'Work halted; supervisor informed; corrective action taken on site.',
  'Re-weighing of entire batch done; records updated.',
  'Storage area thoroughly cleaned and pest treatment done.',
  'Workers counselled and PPE issued immediately.',
  'Product returned to supplier with rejection note.',
  'Full cleaning schedule enforced for all equipment.'
];

const ROOT_CAUSES = [
  'Lack of operator awareness on FSSAI hygiene standards.',
  'Inadequate supervision during production shift.',
  'Equipment maintenance schedule not followed.',
  'Training gap among workers on GMP procedures.',
  'Storage area not inspected as per schedule.',
  'Raw material quality not checked at receiving stage.',
  'Labelling SOP not communicated to new workers.',
  'Pest control schedule not maintained.',
  'High workload leading to skipped cleaning steps.',
  'Communication gap between shift supervisors.'
];

const PREVENTIVE_ACTIONS = [
  'Monthly GMP training session scheduled for all workers.',
  'Daily checklist introduced for equipment cleaning.',
  'Supervisor to verify all labels before dispatch.',
  'Pest control contract renewed with quarterly visits.',
  'Raw material checklist updated with mandatory quality gate.',
  'SOP laminated and posted at every workstation.',
  'Shift handover checklist introduced.',
  'Refresher training on personal hygiene conducted.',
  'Revised storage inspection frequency to twice weekly.',
  'New worker induction checklist added with GMP module.'
];

const RESPONSIBLE = ['BHIMLAL SHARMA', 'Vishal Chaturvedi', 'Mukesh Vora', 'Vinod Singh'];
const VERIFICATIONS = ['Closed', 'Verified & Closed', 'Completed', 'Reviewed & Closed'];

// ✅ LIFETIME: Dynamically builds month list from April 2026 → current month
// No hardcoded list — auto-extends every month forever
const MONTH_NAMES_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH_NAMES_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildMonthList() {
  const months = [];
  const start = new Date(2026, 3, 1); // April 2026
  const today = new Date();
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= today) {
    months.push({ yr: cur.getFullYear(), mo: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

function monthKey(yr, mo) { return `${yr}-${String(mo).padStart(2,'0')}`; }
function monthDisplay(yr, mo) { return `${MONTH_NAMES_FULL[mo-1]} ${yr}`; }
function monthLabel(yr, mo) { return `${MONTH_NAMES_SHORT[mo-1]} ${yr}`; }

let allRecords = [];
let filteredRecords = [];
let activeMonth = 'ALL';
let searchQuery = '';
let editingId = null;

function seedRng(seed) {
  let s = seed; return () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; };
}
function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

// ── DATA GENERATION ───────────────────────────────────────────────────────────
// ✅ LIFETIME: 1 CAPA per month, day derived from seed (unique per month),
//    from April 2026 → current month. Auto-extends every new month.

function generateRecords() {
  const records = [];
  const monthList = buildMonthList(); // dynamic — includes today's month
  let sr = 1;
  monthList.forEach(({ yr, mo }) => {
    const rng = seedRng(yr * 1000 + mo * 37);
    // Day: 3-25 seeded so each month has a distinct, stable date
    const dayOfMonth = 3 + Math.floor(rng() * 22); // 3-24
    const checkDate = new Date(yr, mo-1, dayOfMonth);
    const today = new Date();
    if (checkDate > today) return;
    const mm = String(mo).padStart(2,'0');
    const dd = String(dayOfMonth).padStart(2,'0');
    const dateStr = `${yr}-${mm}-${dd}`;
    const closeD = new Date(yr, mo-1, dayOfMonth + 10 + Math.floor(rng()*8));
    const cyr = closeD.getFullYear();
    const cmm = String(closeD.getMonth()+1).padStart(2,'0');
    const cdd = String(closeD.getDate()).padStart(2,'0');
    const closingDate = `${cyr}-${cmm}-${cdd}`;
    records.push({
      id: `CAPA-${dateStr}`,
      srNo: sr++,
      date: dateStr,
      displayDate: `${dd}/${mm}/${yr}`,
      closingDate,
      closingDateDisplay: `${cdd}/${cmm}/${cyr}`,
      monthKey: monthKey(yr, mo),
      monthDisplay: monthDisplay(yr, mo),
      monthLabel: monthLabel(yr, mo),
      area: AREAS[Math.floor(rng()*AREAS.length)],
      productName: PRODUCTS[Math.floor(rng()*PRODUCTS.length)],
      batchLotNo: `BT-${yr.toString().slice(2)}${mm}${Math.floor(1000+rng()*9000)}`,
      nonConformity: NC_REASONS[Math.floor(rng()*NC_REASONS.length)],
      immediateAction: IMMEDIATE_ACTIONS[Math.floor(rng()*IMMEDIATE_ACTIONS.length)],
      rootCause: ROOT_CAUSES[Math.floor(rng()*ROOT_CAUSES.length)],
      preventiveAction: PREVENTIVE_ACTIONS[Math.floor(rng()*PREVENTIVE_ACTIONS.length)],
      responsiblePerson: RESPONSIBLE[Math.floor(rng()*RESPONSIBLE.length)],
      verification: VERIFICATIONS[Math.floor(rng()*VERIFICATIONS.length)],
      isGenerated: true
    });
  });
  return records;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const cloudData = await loadAllRecords();
    const cloudMap = {};
    cloudData.forEach(r => { cloudMap[r.id] = r; });
    const gen = generateRecords();
    gen.forEach(r => {
      if (!cloudMap[r.id]) cloudMap[r.id] = r;
      else cloudMap[r.id] = { ...r, ...cloudMap[r.id] };
    });
    allRecords = Object.values(cloudMap).sort((a,b) => a.date.localeCompare(b.date));
    allRecords.forEach((r,i) => r.srNo = i+1);
  } catch(e) {
    allRecords = generateRecords();
  }
  renderSidebarMonths();
  applyFilter();
  updateStats();
}

// ── SIDEBAR MONTHS ────────────────────────────────────────────────────────────
// ✅ LIFETIME: Built from actual records — no hardcoded list
function renderSidebarMonths() {
  const el = document.getElementById('sidebar-month-list');
  if (!el) return;

  // Collect unique month keys from records (format: YYYY-MM)
  const seen = new Set();
  const monthKeys = [];
  [...allRecords].sort((a,b) => a.date.localeCompare(b.date)).forEach(r => {
    if (!seen.has(r.monthKey)) { seen.add(r.monthKey); monthKeys.push(r.monthKey); }
  });
  monthKeys.reverse(); // newest first

  const allBtn = `<button class="sidebar-month-btn ${activeMonth==='ALL'?'active':''}" onclick="filterMonth('ALL')">
    All Months <span class="sidebar-month-count">${allRecords.length}</span>
  </button>`;

  const monthBtns = monthKeys.map(mk => {
    const cnt = allRecords.filter(r => r.monthKey === mk).length;
    if (!cnt) return '';
    // Get display label from first matching record
    const sample = allRecords.find(r => r.monthKey === mk);
    const lbl = sample?.monthDisplay || mk;
    return `<button class="sidebar-month-btn ${activeMonth===mk?'active':''}" onclick="filterMonth('${mk}')">
      ${lbl} <span class="sidebar-month-count">${cnt}</span>
    </button>`;
  }).join('');

  el.innerHTML = allBtn + monthBtns;
}

window.filterMonth = function(mk) {
  activeMonth = mk;
  renderSidebarMonths();
  applyFilter();
  updateStats();
  const lbl = document.getElementById('active-month-lbl');
  if (lbl) {
    if (mk === 'ALL') { lbl.textContent = 'All Months'; }
    else {
      const sample = allRecords.find(r => r.monthKey === mk);
      lbl.textContent = sample?.monthDisplay || mk;
    }
  }
};

// ── FILTER ────────────────────────────────────────────────────────────────────
function applyFilter() {
  const q = searchQuery.toLowerCase();
  filteredRecords = allRecords.filter(r => {
    // monthKey is now 'YYYY-MM' format
    const inMonth = activeMonth === 'ALL' || r.monthKey === activeMonth;
    if (!q) return inMonth;
    return inMonth && (
      r.area?.toLowerCase().includes(q) ||
      r.productName?.toLowerCase().includes(q) ||
      r.batchLotNo?.toLowerCase().includes(q) ||
      r.nonConformity?.toLowerCase().includes(q) ||
      r.responsiblePerson?.toLowerCase().includes(q) ||
      r.displayDate?.includes(q)
    );
  });
  renderTable();
}

window.onSearchChange = function(v) { searchQuery = v; applyFilter(); };

// ── TABLE ─────────────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('capa-tbody');
  if (!tbody) return;
  if (!filteredRecords.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-row">No CAPA records found. <a href="javascript:void(0)" onclick="openAddModal()" style="color:var(--brand-primary);font-weight:700;">+ Add New</a></td></tr>`;
    return;
  }
  tbody.innerHTML = filteredRecords.map(r => `
    <tr>
      <td style="text-align:center;font-weight:700;color:#94A3B8;font-size:13px;">${r.srNo}</td>
      <td style="white-space:nowrap;font-weight:600;">${esc(r.displayDate)}</td>
      <td><span class="area-badge">${esc(r.area)}</span></td>
      <td>
        <div style="font-weight:700;font-size:13px;">${esc(r.productName)}</div>
        <span class="batch-pill">${esc(r.batchLotNo)}</span>
      </td>
      <td class="td-nc" style="color:var(--brand-primary);font-weight:600;">${esc(r.nonConformity)}</td>
      <td class="td-action" style="color:#16A34A;">${esc(r.immediateAction)}</td>
      <td class="td-root">${esc(r.rootCause)}</td>
      <td class="td-prevent">${esc(r.preventiveAction)}</td>
      <td style="font-weight:700;font-size:13px;">${esc(r.responsiblePerson)}</td>
      <td><span class="verify-ok">${esc(r.verification)}</span></td>
      <td>
        <button class="btn-edit-row" onclick="openEditModal('${r.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
      </td>
    </tr>
  `).join('');
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const el = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  const now = new Date();
  const curMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; // YYYY-MM
  el('stat-total', allRecords.length);
  el('stat-closed', allRecords.filter(r => r.verification?.toLowerCase().includes('clos') || r.verification?.toLowerCase().includes('complet')).length);
  el('stat-this-month', allRecords.filter(r => r.monthKey === curMonthKey).length);
  el('stat-persons', new Set(allRecords.map(r => r.responsiblePerson)).size);
  const lbl = document.getElementById('active-month-lbl');
  if (lbl) {
    if (activeMonth === 'ALL') { lbl.textContent = 'All Months'; }
    else {
      const sample = allRecords.find(r => r.monthKey === activeMonth);
      lbl.textContent = sample?.monthDisplay || activeMonth;
    }
  }
}

// ── SIDEBAR NAV / TOGGLE ──────────────────────────────────────────────────────
window.switchView = function(v) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  event.currentTarget?.classList?.add('active');
};
window.toggleSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
};
window.closeSidebar = function() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
};

// ── MODAL ─────────────────────────────────────────────────────────────────────
function populateDropdowns() {
  const aEl = document.getElementById('m-area');
  if (aEl) aEl.innerHTML = AREAS.map(a => `<option>${a}</option>`).join('');
  const pEl = document.getElementById('m-product');
  if (pEl) pEl.innerHTML = PRODUCTS.map(p => `<option>${p}</option>`).join('');
  const rEl = document.getElementById('m-responsible');
  if (rEl) rEl.innerHTML = RESPONSIBLE.map(r => `<option>${r}</option>`).join('');
  const vEl = document.getElementById('m-verification');
  if (vEl) vEl.innerHTML = VERIFICATIONS.map(v => `<option>${v}</option>`).join('');
}

window.openAddModal = function() {
  editingId = null;
  populateDropdowns();
  const g = id => document.getElementById(id);
  if (g('modal-title')) g('modal-title').textContent = 'New CAPA Entry';
  if (g('m-date')) g('m-date').value = new Date().toISOString().split('T')[0];
  if (g('m-batch')) g('m-batch').value = '';
  if (g('m-nc')) g('m-nc').value = '';
  if (g('m-immediate')) g('m-immediate').value = '';
  if (g('m-root')) g('m-root').value = '';
  if (g('m-preventive')) g('m-preventive').value = '';
  if (g('m-closing')) g('m-closing').value = '';
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.openEditModal = function(id) {
  const rec = allRecords.find(r => r.id === id);
  if (!rec) return;
  editingId = id;
  populateDropdowns();
  const g = i => document.getElementById(i);
  if (g('modal-title')) g('modal-title').textContent = 'Edit CAPA Record';
  if (g('m-date')) g('m-date').value = rec.date;
  if (g('m-area')) g('m-area').value = rec.area;
  if (g('m-product')) g('m-product').value = rec.productName;
  if (g('m-batch')) g('m-batch').value = rec.batchLotNo;
  if (g('m-nc')) g('m-nc').value = rec.nonConformity;
  if (g('m-immediate')) g('m-immediate').value = rec.immediateAction;
  if (g('m-root')) g('m-root').value = rec.rootCause;
  if (g('m-preventive')) g('m-preventive').value = rec.preventiveAction;
  if (g('m-responsible')) g('m-responsible').value = rec.responsiblePerson;
  if (g('m-verification')) g('m-verification').value = rec.verification;
  if (g('m-closing')) g('m-closing').value = rec.closingDate || '';
  document.getElementById('modal-overlay').style.display = 'flex';
};

window.closeModal = function() {
  document.getElementById('modal-overlay').style.display = 'none';
  editingId = null;
};

window.saveEntry = async function() {
  const g = i => document.getElementById(i);
  const dateVal = g('m-date')?.value;
  if (!dateVal) { alert('Date required'); return; }
  const [yr, mo, dd] = dateVal.split('-');
  // mk is now 'YYYY-MM' format — compatible with filterMonth
  const mk = `${yr}-${mo}`;
  const cDate = g('m-closing')?.value || dateVal;
  const [cyr,cmm,cdd] = cDate.split('-');
  const id = editingId || `CAPA-${dateVal}-${Date.now()}`;

  const record = {
    id, srNo: 0, date: dateVal,
    displayDate: `${dd}/${mo}/${yr}`,
    closingDate: cDate,
    closingDateDisplay: `${cdd}/${cmm}/${cyr}`,
    monthKey: mk,
    monthDisplay: (() => { const d=new Date(dateVal+'T00:00:00'); return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]+' '+d.getFullYear(); })(),
    area: g('m-area')?.value || '',
    productName: g('m-product')?.value || '',
    batchLotNo: g('m-batch')?.value || '',
    nonConformity: g('m-nc')?.value || '',
    immediateAction: g('m-immediate')?.value || '',
    rootCause: g('m-root')?.value || '',
    preventiveAction: g('m-preventive')?.value || '',
    responsiblePerson: g('m-responsible')?.value || '',
    verification: g('m-verification')?.value || 'Closed',
    isGenerated: false
  };

  if (editingId) {
    const idx = allRecords.findIndex(r => r.id === editingId);
    if (idx !== -1) allRecords[idx] = { ...allRecords[idx], ...record };
  } else {
    allRecords.push(record);
    allRecords.sort((a,b) => a.date.localeCompare(b.date));
    allRecords.forEach((r,i) => r.srNo = i+1);
  }

  await saveRecord(record);
  closeModal();
  renderSidebarMonths();
  applyFilter();
  updateStats();
};

// ── EXCEL EXPORT ──────────────────────────────────────────────────────────────
window.exportExcel = function() {
  const rows = filteredRecords.length ? filteredRecords : allRecords;
  if (!rows.length) { alert('No records to export'); return; }
  const headers = ['Sr.No','Date','Area / Process','Product','Batch No','Non-Conformity',
    'Immediate Action','Root Cause','Preventive Action','Responsible Person','Verification','Closing Date'];
  const data = [headers, ...rows.map(r => [
    r.srNo, r.displayDate, r.area, r.productName, r.batchLotNo,
    r.nonConformity, r.immediateAction, r.rootCause, r.preventiveAction,
    r.responsiblePerson, r.verification, r.closingDateDisplay
  ])];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [5,11,18,16,12,30,26,26,26,16,14,11].map(w => ({wch:w}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CAPA Register');
  XLSX.writeFile(wb, `LV_Spices_CAPA_Register.xlsx`);
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  init();
});
