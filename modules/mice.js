// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/mice.js — Mouse Colony tab                         ║
// ╚══════════════════════════════════════════════════════════════╝

// ── Filter state ──────────────────────────────────────────────────────────────
const MF = { strain: new Set(), project_tag: new Set(), host: new Set() };
let ageFilter = { min: null, max: null };

// ── Filter helpers ────────────────────────────────────────────────────────────
function toggleMF(field, val) {
  MF[field].has(val) ? MF[field].delete(val) : MF[field].add(val);
  renderMice();
}
function clearMF(field) { MF[field].clear(); renderMice(); }
function clearAllFilters() {
  MF.strain.clear(); MF.project_tag.clear(); MF.host.clear();
  ageFilter = { min: null, max: null };
  const minEl = $('age-min-filter'), maxEl = $('age-max-filter');
  if (minEl) minEl.value = ''; if (maxEl) maxEl.value = '';
  renderMice();
}
function setAgeFilter() {
  const minVal = $('age-min-filter')?.value, maxVal = $('age-max-filter')?.value;
  ageFilter.min = minVal !== '' ? parseInt(minVal) : null;
  ageFilter.max = maxVal !== '' ? parseInt(maxVal) : null;
  renderMice();
}

function filteredMice() {
  return state.mice.filter(m => {
    if (MF.strain.size > 0 && !MF.strain.has(m.strain)) return false;
    if (MF.project_tag.size > 0 && !MF.project_tag.has(m.project_tag)) return false;
    if (MF.host.size > 0 && !MF.host.has(m.host)) return false;
    const age = m.age_months != null ? Number(m.age_months) : null;
    if (ageFilter.min !== null && (age === null || age < ageFilter.min)) return false;
    if (ageFilter.max !== null && (age === null || age > ageFilter.max)) return false;
    return true;
  });
}

// ── Strain color helper ───────────────────────────────────────────────────────
function strainColor(name) {
  const s = state.strains.find(x => x.name === name);
  return s ? s.color : '#8C7B6B';
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderMice() {
  // Strain filter buttons
  const strains = [...new Set(state.mice.map(m => m.strain).filter(Boolean))];
  $('sf-btns').innerHTML = strains.map(s => {
    const active = MF.strain.has(s), c = strainColor(s);
    return `<button class="log-type-btn ${active ? 'active' : ''}" onclick="toggleMF('strain',\`${s}\`)" style="font-size:10px;padding:3px 8px;${active ? `background:${c}33;border-color:${c};color:${c}` : `border-color:${c}44`}">${s}</button>`;
  }).join('');
  const sfCount = MF.strain.size; $('sf-count').textContent = sfCount ? `(${sfCount} selected)` : '';
  $('sf-all').classList.toggle('active', MF.strain.size === 0);

  // Project tag filter buttons
  const tags = [...new Set(state.mice.map(m => m.project_tag).filter(Boolean))];
  $('pf-btns').innerHTML = tags.map(t => {
    const active = MF.project_tag.has(t);
    return `<button class="log-type-btn ${active ? 'active' : ''}" onclick="toggleMF('project_tag',\`${t}\`)" style="font-size:10px;padding:3px 8px">${t}</button>`;
  }).join('');
  const pfCount = MF.project_tag.size; $('pf-count').textContent = pfCount ? `(${pfCount} selected)` : '';
  $('pf-all').classList.toggle('active', MF.project_tag.size === 0);

  // Host filter buttons
  const hosts = [...new Set(state.mice.map(m => m.host).filter(Boolean))];
  $('hf-btns').innerHTML = hosts.map(h => {
    const active = MF.host.has(h);
    return `<button class="log-type-btn ${active ? 'active' : ''}" onclick="toggleMF('host',\`${h}\`)" style="font-size:10px;padding:3px 8px">${h}</button>`;
  }).join('');
  const hfCount = MF.host.size; $('hf-count').textContent = hfCount ? `(${hfCount} selected)` : '';
  $('hf-all').classList.toggle('active', MF.host.size === 0);

  const fm = filteredMice();
  const totalCages = fm.reduce((s, m) => s + (Number(m.num_cages) || 1), 0);
  const totalExp   = fm.reduce((s, m) => s + (Number(m.expCages)  || 0), 0);
  const totalMU    = fm.reduce((s, m) => s + (Number(m.matingUnit)|| 0), 0);
  $('mice-sub').textContent = `${state.mice.length} records · showing ${fm.length}`;

  // Stats bar
  $('mice-stats-bar').innerHTML = [
    { label: 'Total Cages',       val: totalCages, color: '#4D96FF', bg: '#EEF4FF', icon: '🧺' },
    { label: 'Exp. Cages Used',   val: totalExp,   color: '#FF7E5F', bg: '#FFF1EE', icon: '🔬' },
    { label: 'Total Mating Units',val: totalMU,    color: '#6BCB77', bg: '#F0FBF0', icon: '🐣' },
  ].map(s => `
    <div style="background:${s.bg};border-radius:14px;padding:16px 20px;border:1.5px solid ${s.color}33">
      <div style="font-size:22px;margin-bottom:4px">${s.icon}</div>
      <div style="font-family:'DM Serif Display',serif;font-size:28px;color:${s.color};line-height:1">${s.val}</div>
      <div style="font-size:11px;font-weight:600;color:#8C7B6B;margin-top:4px">${s.label}</div>
    </div>`).join('');

  // Table rows
  $('mice-rows').innerHTML = fm.length === 0
    ? '<div class="empty-state">No cages match the current filters.</div>'
    : fm.map(m => {
        const c      = strainColor(m.strain);
        const female = Number(m.female_count) || 0;
        const male   = Number(m.male_count)   || 0;
        const age    = m.age_months != null ? m.age_months + 'mo' : '—';
        return `
          <div class="mice-tr mice-cols" onclick="editMouse('${m.id}')">
            <div style="font-size:11px;font-family:'DM Mono',monospace;color:#1A1410;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.cageNo || m.cage_no || '—'}</div>
            <div><span class="strain-badge" style="background:${c}22;color:${c}">${m.strain || '—'}</span></div>
            <div style="font-size:13px;font-weight:600;color:#5C4D3C">${m.matingUnit}</div>
            <div style="font-size:13px;font-weight:600;color:#FF7E5F">${female || '—'}</div>
            <div style="font-size:13px;font-weight:600;color:#4D96FF">${male || '—'}</div>
            <div style="font-size:13px;font-weight:600;color:#FF7E5F">${m.expCages}</div>
            <div style="font-size:11px;color:#8C7B6B;font-weight:600">${age}</div>
            <div style="font-size:11px;color:#5C4D3C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.host || '—'}</div>
            <div style="font-size:11px;color:#4D96FF;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.project_tag || '—'}</div>
            <div style="font-size:11px;color:#8C7B6B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.notes || ''}</div>
            <button class="del-btn" onclick="event.stopPropagation();trashItem('mouse','${m.id}')">🗑</button>
          </div>`;
      }).join('');
}

// ── Strain management ─────────────────────────────────────────────────────────
function refreshStrainDropdown() {
  ['mc-strain', 'ems-strain'].forEach(id => {
    const s = $(id); if (!s) return;
    s.innerHTML = state.strains.map(st => `<option value="${st.name}">${st.name}</option>`).join('');
  });
}
function renderStrainList() {
  $('strain-list').innerHTML = state.strains.map(s => `
    <div class="strain-item">
      <div style="width:20px;height:20px;border-radius:5px;background:${s.color};flex-shrink:0"></div>
      <span style="font-size:13px;font-weight:600;color:#1A1410;flex:1">${s.name}</span>
      <button class="del-btn btn-sm" onclick="deleteStrain('${s.id}')">🗑</button>
    </div>`).join('');
}
async function addStrain() {
  const name = $('ns-name').value.trim(); if (!name) { showToast('Please enter a strain name', '⚠️'); return; }
  if (state.strains.find(s => s.name === name)) { showToast('Strain already exists', '⚠️'); return; }
  const s = { id: uid(), name, color: $('ns-color').value };
  const ok = await sbInsert('strains', s); if (!ok) { showToast('Failed to save', '⚠️'); return; }
  state.strains.push(s); $('ns-name').value = '';
  renderStrainList(); refreshStrainDropdown(); showToast('Strain added');
}
async function deleteStrain(id) {
  if (!confirm('Delete this strain?')) return;
  await sbDelete('strains', id);
  state.strains = state.strains.filter(s => s.id != id);
  renderStrainList(); refreshStrainDropdown(); showToast('Strain deleted');
}

// ── Add / Edit / Save cage records ────────────────────────────────────────────
async function addMouse() {
  const numCages = parseInt($('mc-num').value) || 1;
  const rawNos   = $('mc-cagenos').value.trim();
  const cage_no  = rawNos
    ? rawNos.split(/[,\n]+/).map(s => s.trim()).filter(Boolean).join(', ')
    : `${numCages} cage${numCages > 1 ? 's' : ''}`;
  const ptag = $('mc-ptag').value.trim(); if (!ptag) { showToast('Project Tag is required', '⚠️'); return; }
  const ageVal = $('mc-age').value.trim();
  const age_months = ageVal !== '' ? parseInt(ageVal) : null;
  const row = {
    id: uid(), cage_no, num_cages: numCages, strain: $('mc-strain').value,
    mating_unit: parseInt($('mc-mu').value) || 0, exp_cages: parseInt($('mc-exp').value) || 0,
    female_count: parseInt($('mc-female').value) || 0, male_count: parseInt($('mc-male').value) || 0,
    host: $('mc-host').value, project_tag: ptag, age_months, notes: $('mc-notes').value,
  };
  const ok = await sbInsert('mice', row); if (!ok) { showToast('Failed to save', '⚠️'); return; }
  state.mice.push({ ...row, cageNo: row.cage_no, matingUnit: row.mating_unit, expCages: row.exp_cages });
  renderMice();
  ['mc-num','mc-cagenos','mc-mu','mc-exp','mc-female','mc-male','mc-host','mc-ptag','mc-age','mc-notes'].forEach(id => {
    const e = $(id); if (e) e.value = id === 'mc-num' ? '1' : '';
  });
  closeModal('add-mouse-modal'); showToast('Cage record added');
}

function editMouse(id) {
  const m = state.mice.find(x => x.id == id); if (!m) return;
  const sel = $('ems-strain');
  sel.innerHTML = state.strains.map(s => `<option value="${s.name}" ${s.name === m.strain ? 'selected' : ''}>${s.name}</option>`).join('');
  $('ems-id').value   = id;
  $('ems-num').value  = m.num_cages || 1;
  $('ems-cagenos').value = m.cageNo || m.cage_no || '';
  $('ems-mu').value   = m.matingUnit || 0; $('ems-exp').value  = m.expCages || 0;
  $('ems-female').value = m.female_count || 0; $('ems-male').value = m.male_count || 0;
  $('ems-host').value = m.host || ''; $('ems-ptag').value = m.project_tag || '';
  $('ems-age').value  = m.age_months != null ? m.age_months : '';
  $('ems-notes').value = m.notes || '';
  openModal('edit-mouse-modal');
}

async function saveMouse() {
  const id       = $('ems-id').value;
  const numCages = parseInt($('ems-num').value) || 1;
  const rawNos   = $('ems-cagenos').value.trim();
  const cage_no  = rawNos || `${numCages} cage${numCages > 1 ? 's' : ''}`;
  const ageVal   = $('ems-age').value.trim();
  const age_months = ageVal !== '' ? parseInt(ageVal) : null;
  const upd = {
    cage_no, num_cages: numCages, strain: $('ems-strain').value,
    mating_unit: parseInt($('ems-mu').value) || 0, exp_cages: parseInt($('ems-exp').value) || 0,
    female_count: parseInt($('ems-female').value) || 0, male_count: parseInt($('ems-male').value) || 0,
    host: $('ems-host').value, project_tag: $('ems-ptag').value, age_months, notes: $('ems-notes').value,
  };
  await sbUpdate('mice', id, upd);
  const m = state.mice.find(x => x.id == id);
  if (m) Object.assign(m, { ...upd, cageNo: cage_no, matingUnit: upd.mating_unit, expCages: upd.exp_cages });
  renderMice(); closeModal('edit-mouse-modal'); showToast('Cage record updated');
}
