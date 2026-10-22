// app.js — LV Spices CAPA Register
// Table style (like vehicle cleaning): month tabs + table view
// 1 CAPA entry per month from April 2026 to today

import { saveRecord, loadAllRecords, updateCloudBadge } from './firebase-config.js';

// ── 20 NON-CONFORMITY REASONS (for auto-generation only, NOT shown in UI) ──
const NC_REASONS = [
  'Raw material bag found open or not properly closed',
  'Foreign matter (stones, sticks, insects, etc.) found in raw material',
  'Wrong raw material used in blending',
  'Incorrect blending ratio',
  'Machine / mixer not cleaned properly',
  'Previous product residue found in equipment',
  'Incorrect product label (wrong name, weight, date, etc.)',
  'Missing or unlabelled packages',
  'Wrong net weight in packed product',
  'Damaged or leaking packaging material',
  'Expired raw material used',
  'Improper storage conditions (moisture, heat, direct sunlight)',
  'Pest signs (insects, rodents, droppings) found in storage area',
  'Workers not wearing required PPE (hair cap, mask, gloves, apron)',
  'Poor personal hygiene (unclean hands, nails, etc.)',
  'Unclean work surface or handling tools',
  'Cross-contamination between different spices',
  'Improper waste disposal / open waste bins',
  'Temperature / humidity outside recommended limit',
  'Inadequate supervision or lack of training of staff'
];

const AREAS = [
  'Blending / Mixing', 'Repacking & Filling', 'Packing Area',
  'Storage / Warehouse', 'Hygiene & Sanitation', 'Quality Checking',
  'Loading & Dispatch', 'Raw Material Receiving'
];

const PRODUCTS_CAPA = [
  'Turmeric Powder', 'Red Chilli Powder', 'Coriander Powder', 'Cumin Seeds',
  'Garam Masala', 'Black Pepper Powder', 'Mustard Seeds', 'Mixed Masala'
];

const IMMEDIATE_ACTIONS = [
  'Product batch quarantined and re-checked immediately.',
  'Equipment cleaned and sanitized before restart.',
  'Labelling corrected and re-applied on all affected units.',
  'Faulty stock segregated and disposed as per FSSAI norms.',
  'Work halted; supervisor informed; corrective action taken.',
  'Re-weighing of entire batch done; records updated.',
  'Storage area thoroughly cleaned and pest treated.',
  'Workers counselled and PPE issued immediately.',
  'Product returned to supplier with rejection note.',
  'Cleaning schedule enforced immediately for all equipment.'
];

const ROOT_CAUSES = [
  'Lack of operator awareness on FSSAI hygiene standards.',
  'Inadequate supervision during production shift.',
  'Equipment maintenance schedule not followed properly.',
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

const RESPONSIBLE_PERSONS = ['Rajesh Sharma', 'Vishal Chaturvedi', 'Mukesh Vora', 'Vinod Singh'];
const VERIFICATIONS = ['Closed', 'Verified & Closed', 'Completed', 'Reviewed & Closed'];

// ── STATE ─────────────────────────────────────────────────────────────────────
let records = [];
let editingId = null;

const MONTH_NAMES = ['APRIL','MAY','JUNE','JULY','AUG','SEP','OCT','NOV','DEC'];
const MONTH_MAP = {
  'APRIL':'2026-04','MAY':'2026-05','JUNE':'2026-06','JULY':'2026-07',
  'AUG':'2026-08','SEP':'2026-09','OCT':'2026-10','NOV':'2026-11','DEC':'2026-12'
};
const MONTH_DISPLAY = {
  'APRIL':'April 2026','MAY':'May 2026','JUNE':'June 2026','JULY':'July 2026',
  'AUG':'Aug 2026','SEP':'Sep 2026','OCT':'Oct 2026','NOV':'Nov 2026','DEC':'Dec 2026'
};

function getCurrentMonthKey() {
  const m = new Date().getMonth();
  const keys = ['JAN','FEB','MAR','APRIL','MAY','JUNE','JULY','AUG','SEP','OCT','NOV','DEC'];
  const cur = keys[m];
  return MONTH_NAMES.includes(cur) ? cur : 'OCT';
}

let activeMonth = getCurrentMonthKey();

function seedRng(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── DATA GENERATION (1 per month) ────────────────────────────────────────────
function generateRecords() {
  const generated = [];
  const monthsToGenerate = ['APRIL','MAY','JUNE','JULY','AUG','SEP','OCT'];
  const today = new Date();

  let srNo = 1;
  monthsToGenerate.forEach(monthKey => {
    const prefix = MONTH_MAP[monthKey];
    const [yr, mo] = prefix.split('-').map(Number);
    const firstOfMonth = new Date(yr, mo-1, 5); // 5th of each month

    // Don't generate future months
    if (firstOfMonth > today) return;

    const seed = yr * 1000 + mo * 10;
    const rng = seedRng(seed);

    const d = String(firstOfMonth.getDate()).padStart(2,'0');
    const m = String(firstOfMonth.getMonth()+1).padStart(2,'0');
    const dateStr = `${yr}-${m}-${d}`;
    const displayDate = `${d}/${m}/${yr}`;

    const ncIdx      = Math.floor(rng() * NC_REASONS.length);
    const areaIdx    = Math.floor(rng() * AREAS.length);
    const prodIdx    = Math.floor(rng() * PRODUCTS_CAPA.length);
    const immIdx     = Math.floor(rng() * IMMEDIATE_ACTIONS.length);
    const rootIdx    = Math.floor(rng() * ROOT_CAUSES.length);
    const prevIdx    = Math.floor(rng() * PREVENTIVE_ACTIONS.length);
    const respIdx    = Math.floor(rng() * RESPONSIBLE_PERSONS.length);
    const verIdx     = Math.floor(rng() * VERIFICATIONS.length);
    const batchNo    = `BT-${yr.toString().slice(2)}${m}${Math.floor(1000 + rng()*9000)}`;

    generated.push({
      id: `CAPA-${dateStr}`,
      srNo: srNo++,
      date: dateStr,
      displayDate,
      monthKey,
      area: AREAS[areaIdx],
      productName: PRODUCTS_CAPA[prodIdx],
      batchLotNo: batchNo,
      nonConformity: NC_REASONS[ncIdx],
      immediateAction: IMMEDIATE_ACTIONS[immIdx],
      rootCause: ROOT_CAUSES[rootIdx],
      preventiveAction: PREVENTIVE_ACTIONS[prevIdx],
      responsiblePerson: RESPONSIBLE_PERSONS[respIdx],
      verification: VERIFICATIONS[verIdx],
      isGenerated: true
    });
  });
  return generated;
}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const cloudData = await loadAllRecords();
    const cloudMap = {};
    cloudData.forEach(r => { cloudMap[r.id] = r; });
    const generated = generateRecords();
    generated.forEach(r => {
      if (!cloudMap[r.id]) cloudMap[r.id] = r;
      else cloudMap[r.id] = { ...r, ...cloudMap[r.id] };
    });
    records = Object.values(cloudMap).sort((a,b) => a.date.localeCompare(b.date));
    // Fix srNo
    records.forEach((r, i) => r.srNo = i + 1);
  } catch(e) {
    records = generateRecords();
  }
  renderMonthTabs();
  renderTable();
  updateKPIs();
}

// ── MONTH TABS ────────────────────────────────────────────────────────────────
function renderMonthTabs() {
  const bar = document.getElementById('month-tabs');
  if (!bar) return;
  bar.innerHTML = MONTH_NAMES.map(m => `
    <button class="month-tab ${m === activeMonth ? 'active' : ''}" onclick="setMonth('${m}')">${m}</button>
  `).join('');
}

window.setMonth = function(m) {
  activeMonth = m;
  renderMonthTabs();
  renderTable();
  updateKPIs();
};

// ── TABLE RENDER ──────────────────────────────────────────────────────────────
function getMonthRecords() {
  const prefix = MONTH_MAP[activeMonth] || '2026-10';
  return records.filter(r => r.date.startsWith(prefix));
}

function renderTable() {
  const tbody = document.getElementById('capa-tbody');
  if (!tbody) return;
  const monthRecs = getMonthRecords();

  if (monthRecs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-cell">No CAPA records for ${activeMonth} 2026. <button class="btn-add-inline" onclick="openAddModal()">+ Add Record</button></td></tr>`;
    return;
  }

  tbody.innerHTML = monthRecs.map(r => `
    <tr>
      <td class="td-sr">${r.srNo}</td>
      <td class="td-date"><strong>${escapeHtml(r.displayDate)}</strong></td>
      <td class="td-area"><span class="area-badge">${escapeHtml(r.area)}</span></td>
      <td class="td-product">${escapeHtml(r.productName)}</td>
      <td class="td-batch"><span class="batch-code">${escapeHtml(r.batchLotNo)}</span></td>
      <td class="td-nc">${escapeHtml(r.nonConformity)}</td>
      <td class="td-action">${escapeHtml(r.immediateAction)}</td>
      <td class="td-root">${escapeHtml(r.rootCause)}</td>
      <td class="td-prevent">${escapeHtml(r.preventiveAction)}</td>
      <td class="td-person">${escapeHtml(r.responsiblePerson)}</td>
      <td class="td-verify"><span class="verify-badge">${escapeHtml(r.verification)}</span></td>
      <td class="td-edit">
        <button class="edit-btn" onclick="openEditModal('${r.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
function updateKPIs() {
  const monthRecs = getMonthRecords();
  const el = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  el('kpi-total', records.length);
  el('kpi-month', monthRecs.length);
  el('kpi-closed', monthRecs.filter(r => r.verification && r.verification.toLowerCase().includes('clos')).length);
  el('kpi-persons', new Set(monthRecs.map(r => r.responsiblePerson)).size);
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function populateDropdowns() {
  const areaEl = document.getElementById('m-area');
  if (areaEl) areaEl.innerHTML = AREAS.map(a => `<option>${a}</option>`).join('');
  const prodEl = document.getElementById('m-product');
  if (prodEl) prodEl.innerHTML = PRODUCTS_CAPA.map(p => `<option>${p}</option>`).join('');
  const respEl = document.getElementById('m-responsible');
  if (respEl) respEl.innerHTML = RESPONSIBLE_PERSONS.map(p => `<option>${p}</option>`).join('');
  const verEl = document.getElementById('m-verification');
  if (verEl) verEl.innerHTML = VERIFICATIONS.map(v => `<option>${v}</option>`).join('');
}

window.openAddModal = function() {
  editingId = null;
  populateDropdowns();
  const el = i => document.getElementById(i);
  if (el('m-modal-title')) el('m-modal-title').textContent = 'Add CAPA Record';
  if (el('m-date')) el('m-date').value = new Date().toISOString().split('T')[0];
  if (el('m-batch')) el('m-batch').value = '';
  if (el('m-nc')) el('m-nc').value = '';
  if (el('m-immediate')) el('m-immediate').value = '';
  if (el('m-root')) el('m-root').value = '';
  if (el('m-preventive')) el('m-preventive').value = '';
  document.getElementById('capa-modal').style.display = 'flex';
};

window.openEditModal = function(id) {
  const rec = records.find(r => r.id === id);
  if (!rec) return;
  editingId = id;
  populateDropdowns();
  const el = i => document.getElementById(i);
  if (el('m-modal-title')) el('m-modal-title').textContent = 'Edit CAPA Record';
  if (el('m-date')) el('m-date').value = rec.date;
  if (el('m-area')) el('m-area').value = rec.area;
  if (el('m-product')) el('m-product').value = rec.productName;
  if (el('m-batch')) el('m-batch').value = rec.batchLotNo;
  if (el('m-nc')) el('m-nc').value = rec.nonConformity;
  if (el('m-immediate')) el('m-immediate').value = rec.immediateAction;
  if (el('m-root')) el('m-root').value = rec.rootCause;
  if (el('m-preventive')) el('m-preventive').value = rec.preventiveAction;
  if (el('m-responsible')) el('m-responsible').value = rec.responsiblePerson;
  if (el('m-verification')) el('m-verification').value = rec.verification;
  document.getElementById('capa-modal').style.display = 'flex';
};

window.closeModal = function() {
  document.getElementById('capa-modal').style.display = 'none';
  editingId = null;
};

window.saveEntry = async function() {
  const el = i => document.getElementById(i);
  const dateVal = el('m-date')?.value;
  if (!dateVal) { alert('Date is required'); return; }

  const [yr,mo,dd] = dateVal.split('-');
  const displayDate = `${dd}/${mo}/${yr}`;
  const id = editingId || `CAPA-${dateVal}-${Date.now()}`;

  const record = {
    id, date: dateVal, displayDate,
    monthKey: activeMonth,
    area: el('m-area')?.value || '',
    productName: el('m-product')?.value || '',
    batchLotNo: el('m-batch')?.value || '',
    nonConformity: el('m-nc')?.value || '',
    immediateAction: el('m-immediate')?.value || '',
    rootCause: el('m-root')?.value || '',
    preventiveAction: el('m-preventive')?.value || '',
    responsiblePerson: el('m-responsible')?.value || '',
    verification: el('m-verification')?.value || 'Closed',
    isGenerated: false
  };

  if (editingId) {
    const idx = records.findIndex(r => r.id === editingId);
    if (idx !== -1) records[idx] = { ...records[idx], ...record };
  } else {
    records.push(record);
    records.sort((a,b) => a.date.localeCompare(b.date));
    records.forEach((r,i) => r.srNo = i+1);
  }

  await saveRecord(record);
  closeModal();
  renderTable();
  updateKPIs();
};

// ── EXCEL EXPORT ──────────────────────────────────────────────────────────────
window.exportToExcel = function() {
  const monthRecs = getMonthRecords();
  if (!monthRecs.length) { alert('No records for ' + activeMonth); return; }

  const headers = [
    'Sr.No','Date','Area / Process','Product Name','Batch / Lot No',
    'Non-Conformity / Problem Observed','Immediate Corrective Action',
    'Root Cause (Why it happened)','Preventive Action','Responsible Person',
    'Verification / Closure'
  ];
  const data = [headers, ...monthRecs.map(r => [
    r.srNo, r.displayDate, r.area, r.productName, r.batchLotNo,
    r.nonConformity, r.immediateAction, r.rootCause, r.preventiveAction,
    r.responsiblePerson, r.verification
  ])];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [6,12,18,16,12,32,28,28,28,18,16].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `CAPA ${activeMonth} 2026`);
  XLSX.writeFile(wb, `LV_Spices_CAPA_Register_${activeMonth}_2026.xlsx`);
};

window.printLog = function() { window.print(); };

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('capa-modal')?.addEventListener('click', e => {
    if (e.target.id === 'capa-modal') closeModal();
  });
  init();
});
