// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/freezer.js — -80°C Freezer tab                     ║
// ║  Host colors & drawer colors shared via Supabase            ║
// ║  Multi-select batch edit: Shift/Ctrl/Cmd + click            ║
// ╚══════════════════════════════════════════════════════════════╝

let currentDrawer = null;
let selectedSlots = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────
function enc(v) { return encodeURIComponent(v || ''); }
function dec(v) { return decodeURIComponent(v || ''); }
function slotKey(layer, drawer, row, col) { return `${layer}-${drawer}-${row}-${col}`; }
function parseSlotKey(key) {
  const [layer, drawer, row, col] = key.split('-').map(Number);
  return { layer, drawer, row, col };
}
function getFSlot(layer, drawer, row, col) {
  return state.freezer.find(s => s.layer == layer && s.drawer == drawer && s.row == row && s.col == col) || null;
}
function slotMatch(s, q) {
  if (!q || !s) return false;
  return [s.label, s.host, s.tissue, s.species, s.project, s.notes].some(v => v && String(v).toLowerCase().includes(q));
}

// ── Drawer color helpers (Supabase-backed, shared) ────────────────────────────
function getDrawerColorRecord(layer, drawer) {
  return (state.freezerDrawerColors || []).find(d => d.layer == layer && d.drawer == drawer) || null;
}
function getDrawerColor(layer, drawer) {
  return getDrawerColorRecord(layer, drawer)?.color || null;
}
async function setDrawerColor(layer, drawer, color) {
  const existing = getDrawerColorRecord(layer, drawer);
  if (existing) {
    if (sb) { const ok = await sbUpdate('freezer_drawer_colors', existing.id, { color }); if (!ok) { showToast('Failed to save drawer color', '⚠️'); return; } }
    existing.color = color;
  } else {
    const row = { id: uid(), layer, drawer, color };
    if (sb) { const ok = await sbInsert('freezer_drawer_colors', row); if (!ok) { showToast('Failed to save drawer color', '⚠️'); return; } }
    state.freezerDrawerColors.push(row);
  }
  if (currentDrawer) renderDrawerInside(currentDrawer.layer, currentDrawer.drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
  else renderFreezer();
}
async function clearDrawerColor(layer, drawer) {
  const existing = getDrawerColorRecord(layer, drawer);
  if (!existing) return;
  if (sb) { const ok = await sbDelete('freezer_drawer_colors', existing.id); if (!ok) { showToast('Failed to remove drawer color', '⚠️'); return; } }
  state.freezerDrawerColors = state.freezerDrawerColors.filter(d => d.id !== existing.id);
  if (currentDrawer) renderDrawerInside(currentDrawer.layer, currentDrawer.drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
  else renderFreezer();
}

// ── Host color helpers (Supabase-backed, shared) ──────────────────────────────
function getHostColors() {
  return (state.freezerHostColors || []).reduce((acc, item) => {
    if (item?.name && item?.color) acc[item.name] = item.color;
    return acc;
  }, {});
}
function getHostColorRecord(hostName) {
  if (!hostName) return null;
  return (state.freezerHostColors || []).find(h => h.name && h.name.toLowerCase() === hostName.toLowerCase()) || null;
}
function getHostColor(hostName) {
  return getHostColorRecord(hostName)?.color || null;
}
async function setHostColor(name, color) {
  const existing = getHostColorRecord(name);
  if (existing) {
    if (sb) { const ok = await sbUpdate('freezer_host_colors', existing.id, { name, color }); if (!ok) { showToast('Failed to save host color', '⚠️'); return; } }
    existing.name = name; existing.color = color;
  } else {
    const row = { id: uid(), name, color };
    if (sb) { const ok = await sbInsert('freezer_host_colors', row); if (!ok) { showToast('Failed to save host color', '⚠️'); return; } }
    state.freezerHostColors.push(row);
  }
  renderFreezer();
}
async function removeHostColor(name) {
  const existing = getHostColorRecord(name);
  if (!existing) return;
  if (sb) { const ok = await sbDelete('freezer_host_colors', existing.id); if (!ok) { showToast('Failed to remove host color', '⚠️'); return; } }
  state.freezerHostColors = state.freezerHostColors.filter(h => h.id !== existing.id);
  renderFreezer();
}
function setHostColorEncoded(encodedName, color) { setHostColor(dec(encodedName), color); }
function removeHostColorEncoded(encodedName) { removeHostColor(dec(encodedName)); }

// ── Host Colors panel ─────────────────────────────────────────────────────────
function renderHostColorPanel() {
  const map     = getHostColors();
  const entries = Object.entries(map);
  const freezerHosts = [...new Set(state.freezer.map(s => s.host).filter(Boolean))];
  const memberNames  = state.members.map(m => m.name).filter(Boolean);
  const allHosts     = [...new Set([...freezerHosts, ...memberNames])];
  const unassigned   = allHosts.filter(h => !Object.keys(map).find(k => k.toLowerCase() === h.toLowerCase()));

  return `
    <div style="background:#fff;border-radius:16px;padding:18px 20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,.06)">
      <div style="font-weight:700;font-size:13px;color:#1A1410;margin-bottom:14px;display:flex;align-items:center;gap:8px">
        🎨 Host Colors
        <span style="font-size:11px;font-weight:400;color:#8C7B6B">Assign a color per person — synced across all lab members</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;${entries.length ? 'margin-bottom:14px' : ''}">
        ${entries.map(([name, color]) => `
          <div style="display:inline-flex;align-items:center;gap:7px;background:#F5F0E8;border-radius:8px;padding:6px 10px;border:1.5px solid ${color}66">
            <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;border:1px solid rgba(0,0,0,.1)"></div>
            <span style="font-size:12px;font-weight:600;color:#1A1410">${name}</span>
            <input type="color" value="${color}"
              style="width:22px;height:22px;border:none;border-radius:4px;cursor:pointer;background:transparent;padding:1px"
              title="Change color" onchange="setHostColorEncoded('${enc(name)}', this.value)">
            <button onclick="removeHostColorEncoded('${enc(name)}')"
              style="background:none;border:none;cursor:pointer;color:#C0BBAF;font-size:13px;line-height:1;padding:0 2px">✕</button>
          </div>`).join('')}
        ${entries.length === 0 ? `<div style="font-size:12px;color:#C0BBAF">No host colors set yet.</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <input type="text" id="new-host-name" placeholder="Host name…"
          style="width:160px;font-size:12px;padding:6px 10px"
          list="host-name-suggestions"
          onkeydown="if(event.key==='Enter') addHostColorFromInput()">
        <datalist id="host-name-suggestions">
          ${unassigned.map(h => `<option value="${h}">`).join('')}
        </datalist>
        <input type="color" id="new-host-color" value="#4D96FF"
          style="width:36px;height:34px;border:none;border-radius:8px;cursor:pointer;background:transparent;padding:2px">
        <button class="btn btn-dark btn-sm" onclick="addHostColorFromInput()">+ Add</button>
      </div>
    </div>`;
}

function addHostColorFromInput() {
  const nameEl  = $('new-host-name');
  const colorEl = $('new-host-color');
  const name    = nameEl?.value.trim();
  if (!name) { showToast('Please enter a host name', '⚠️'); return; }
  setHostColor(name, colorEl?.value || '#4D96FF');
  if (nameEl)  nameEl.value  = '';
  if (colorEl) colorEl.value = '#4D96FF';
}

// ── Freezer overview ──────────────────────────────────────────────────────────
function renderFreezer() {
  const q         = ($('freezer-search')?.value || '').toLowerCase().trim();
  const container = $('freezer-view'); if (!container) return;
  if (currentDrawer) { renderDrawerInside(currentDrawer.layer, currentDrawer.drawer, q); return; }

  let html = renderHostColorPanel();

  for (let layer = 1; layer <= FREEZER_LAYERS; layer++) {
    html += `
      <div style="margin-bottom:20px">
        <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:#8C7B6B;letter-spacing:.07em;text-transform:uppercase;margin-bottom:8px">Layer ${layer}</div>
        <div class="freezer-drawers">`;

    for (let drawer = 1; drawer <= FREEZER_DRAWERS; drawer++) {
      const slots  = state.freezer.filter(s => s.layer == layer && s.drawer == drawer);
      const filled = slots.filter(s => s.label || s.host || s.tissue || s.project);
      const hasHit = q && slots.some(s => slotMatch(s, q));
      const dColor = getDrawerColor(layer, drawer);

      let dots = '';
      for (let r = 1; r <= FREEZER_ROWS; r++) {
        for (let col = 1; col <= FREEZER_COLS; col++) {
          const sl      = getFSlot(layer, drawer, r, col);
          const f       = sl && (sl.label || sl.host || sl.tissue || sl.project);
          const h       = q && sl && slotMatch(sl, q);
          const hostCol = f && sl?.host ? getHostColor(sl.host) : null;
          const dotColor = h ? null : (hostCol || (dColor && f ? dColor : null));
          dots += `<div class="fd ${h ? 'hit' : f ? 'on' : ''}" style="${dotColor ? `background:${dotColor};opacity:0.9` : ''}"></div>`;
        }
      }

      const borderStyle = dColor
        ? `border-color:${dColor};box-shadow:0 2px 10px ${dColor}33`
        : (hasHit ? 'border-color:#E8C547;box-shadow:0 0 0 2px #E8C54766' : '');
      const drawerBg = dColor ? `background:${dColor}11` : '';

      html += `
        <div class="freezer-drawer ${filled.length ? 'has-data' : ''}" style="${borderStyle};${drawerBg}" onclick="openDrawer(${layer},${drawer})">
          <div class="freezer-drawer-num">D${drawer}</div>
          <div style="font-size:11px;font-weight:600;color:${dColor || (filled.length ? '#1A1410' : '#C0BBAF')};margin-top:2px">${filled.length ? filled.length + ' boxes' : ''}</div>
          <div class="freezer-preview">${dots}</div>
          <input type="color" class="drawer-color-btn" value="${dColor || '#4D96FF'}" title="Set drawer color"
            onclick="event.stopPropagation()" oninput="event.stopPropagation()"
            onchange="event.stopPropagation();setDrawerColor(${layer},${drawer},this.value)">
        </div>`;
    }
    html += '</div></div>';
  }
  container.innerHTML = html;

  // Search results
  const srEl = $('freezer-search-results');
  if (q) {
    const hits = state.freezer.filter(s => slotMatch(s, q));
    srEl.classList.remove('hidden');
    srEl.innerHTML = hits.length
      ? `<div style="font-size:12px;font-weight:700;color:#8C7B6B;margin-bottom:10px">Found ${hits.length} matching slot${hits.length > 1 ? 's' : ''} — highlighted in yellow</div>` +
        hits.map(s => {
          const hc = s.host ? getHostColor(s.host) : null;
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#FFF8E6;border-radius:8px;margin-bottom:6px;font-size:12px">
              <span style="font-weight:700;color:#1A1410;font-family:'DM Mono',monospace">L${s.layer}·D${s.drawer}·R${s.row}C${s.col}</span>
              <span>${s.label || ''}</span>
              ${s.tissue  ? `<span class="m-tag">${s.tissue}</span>` : ''}
              ${s.project ? `<span class="m-tag">${s.project}</span>` : ''}
              ${s.host ? `<span style="display:inline-flex;align-items:center;gap:4px;color:#8C7B6B">
                ${hc ? `<span style="width:8px;height:8px;border-radius:50%;background:${hc};display:inline-block"></span>` : ''}
                ${s.host}</span>` : ''}
              <button class="btn btn-outline btn-sm" style="margin-left:auto;font-size:10px" onclick="openDrawer(${s.layer},${s.drawer})">View</button>
            </div>`;
        }).join('')
      : `<div style="color:#8C7B6B;font-size:13px">No slots match "${q}"</div>`;
  } else { srEl.classList.add('hidden'); }
}

// ── Drawer inside view ────────────────────────────────────────────────────────
function openDrawer(layer, drawer) {
  currentDrawer = { layer, drawer };
  selectedSlots.clear();
  renderDrawerInside(layer, drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
}
function closeDrawer() { currentDrawer = null; selectedSlots.clear(); renderFreezer(); }

function handleDrawerCellClick(layer, drawer, row, col, e) {
  const key = slotKey(layer, drawer, row, col);
  if (e?.shiftKey || e?.ctrlKey || e?.metaKey) {
    if (selectedSlots.has(key)) selectedSlots.delete(key);
    else selectedSlots.add(key);
    renderDrawerInside(layer, drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
    return;
  }
  selectedSlots.clear();
  openSlotEdit(layer, drawer, row, col);
}

function clearSelectedSlots() {
  selectedSlots.clear();
  if (currentDrawer) renderDrawerInside(currentDrawer.layer, currentDrawer.drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
}

function renderDrawerInside(layer, drawer, q) {
  const container = $('freezer-view');
  const dColor    = getDrawerColor(layer, drawer);
  let grid = '';

  for (let row = 1; row <= FREEZER_ROWS; row++) {
    for (let col = 1; col <= FREEZER_COLS; col++) {
      const sl         = getFSlot(layer, drawer, row, col);
      const filled     = sl && (sl.label || sl.host || sl.tissue || sl.project);
      const hit        = q && sl && slotMatch(sl, q);
      const hostCol    = filled && sl?.host ? getHostColor(sl.host) : null;
      const cellColor  = hostCol || dColor;
      const cellStyle  = filled && cellColor ? `background:${cellColor}18;border-color:${cellColor}66` : '';
      const hostTextColor = hostCol || dColor || '#4D96FF';
      const key        = slotKey(layer, drawer, row, col);
      const selected   = selectedSlots.has(key);

      grid += `
        <div class="drawer-cell ${filled ? 'filled' : ''} ${hit ? 'match' : ''}"
          style="${cellStyle}${selected ? ';box-shadow:0 0 0 2px #1A1410 inset' : ''}"
          onclick="handleDrawerCellClick(${layer},${drawer},${row},${col},event)">
          <div class="dc-pos">R${row}C${col}</div>
          <div class="dc-label">${sl?.label || ''}</div>
          <div class="dc-sub">${sl?.tissue || ''}${sl?.project ? ' · ' + sl.project : ''}</div>
          ${sl?.host ? `
            <div class="dc-sub" style="display:flex;align-items:center;gap:3px;color:${hostTextColor}">
              ${hostCol ? `<span style="width:6px;height:6px;border-radius:50%;background:${hostCol};flex-shrink:0;display:inline-block"></span>` : ''}
              ${sl.host}
            </div>` : ''}
        </div>`;
    }
  }

  // Host color legend for this drawer
  const drawerHosts = [...new Set(state.freezer.filter(s => s.layer == layer && s.drawer == drawer && s.host).map(s => s.host))];
  const coloredHosts = drawerHosts.map(h => ({ name: h, color: getHostColor(h) })).filter(x => x.color);
  const legend = coloredHosts.length ? `
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      ${coloredHosts.map(x => `
        <div style="display:inline-flex;align-items:center;gap:5px;background:#F5F0E8;border-radius:6px;padding:4px 10px;border:1px solid ${x.color}55">
          <span style="width:8px;height:8px;border-radius:50%;background:${x.color};display:inline-block"></span>
          <span style="font-size:11px;font-weight:600;color:#1A1410">${x.name}</span>
        </div>`).join('')}
    </div>` : '';

  const colorDot = dColor ? `<div style="width:14px;height:14px;border-radius:50%;background:${dColor};border:1.5px solid rgba(0,0,0,.15);flex-shrink:0"></div>` : '';

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" onclick="closeDrawer()">← Back</button>
      <div style="font-family:'DM Serif Display',serif;font-size:18px;color:#1A1410">Layer ${layer} · Drawer ${drawer}</div>
      ${colorDot}
      <div style="display:flex;align-items:center;gap:6px">
        <label style="font-size:11px;color:#8C7B6B">Drawer color:</label>
        <input type="color" id="drawer-color-inside" value="${dColor || '#4D96FF'}"
          style="width:28px;height:22px;border:none;border-radius:5px;cursor:pointer;background:transparent;padding:1px"
          onchange="setDrawerColor(${layer},${drawer},this.value)">
        ${dColor ? `<button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 8px" onclick="clearDrawerColor(${layer},${drawer})">✕ Remove</button>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="openBatchSlotEdit()" ${selectedSlots.size ? '' : 'disabled'}>
          Batch Edit (${selectedSlots.size} selected)
        </button>
        ${selectedSlots.size ? `<button class="btn btn-outline btn-sm" onclick="clearSelectedSlots()">Clear Selection</button>` : ''}
        <span style="font-size:11px;color:#C0BBAF">Shift/Ctrl/Cmd + click to multi-select</span>
      </div>
      <div style="font-size:12px;color:#8C7B6B">(view from right)</div>
    </div>
    ${legend}
    <div class="drawer-grid">${grid}</div>`;
}

// ── Single slot edit ──────────────────────────────────────────────────────────
function openSlotEdit(layer, drawer, row, col) {
  const s = getFSlot(layer, drawer, row, col) || {};
  $('fs-mode').value = 'single';
  $('fs-batch-keys').value = '';
  $('fs-batch-summary').classList.add('hidden');
  $('fs-clear-btn').classList.remove('hidden');
  $('fs-layer').value = layer; $('fs-drawer').value = drawer;
  $('fs-row').value   = row;   $('fs-col').value    = col;
  $('fs-title').textContent = `Layer ${layer} · Drawer ${drawer} · R${row}C${col}`;
  $('fs-label').value   = s.label   || ''; $('fs-host').value    = s.host    || '';
  $('fs-species').value = s.species || ''; $('fs-tissue').value  = s.tissue  || '';
  $('fs-project').value = s.project || ''; $('fs-notes').value   = s.notes   || '';
  updateSlotHostColorHint(s.host || '');
  openModal('freezer-slot-modal');
}

// ── Batch slot edit ───────────────────────────────────────────────────────────
function openBatchSlotEdit() {
  if (!currentDrawer || !selectedSlots.size) return;
  const targets = [...selectedSlots].map(parseSlotKey)
    .filter(s => s.layer === currentDrawer.layer && s.drawer === currentDrawer.drawer);
  if (!targets.length) { showToast('No slots selected in current drawer', '⚠️'); return; }

  const first = getFSlot(targets[0].layer, targets[0].drawer, targets[0].row, targets[0].col) || {};
  $('fs-layer').value  = currentDrawer.layer;
  $('fs-drawer').value = currentDrawer.drawer;
  $('fs-row').value    = ''; $('fs-col').value = '';
  $('fs-mode').value   = 'batch';
  $('fs-batch-keys').value = JSON.stringify(targets);
  $('fs-title').textContent = `Batch Edit · ${targets.length} Slot${targets.length > 1 ? 's' : ''}`;
  $('fs-label').value   = first.label   || ''; $('fs-host').value    = first.host    || '';
  $('fs-species').value = first.species || ''; $('fs-tissue').value  = first.tissue  || '';
  $('fs-project').value = first.project || ''; $('fs-notes').value   = first.notes   || '';
  updateSlotHostColorHint(first.host || '');
  const summary = targets.map(s => `R${s.row}C${s.col}`).join(', ');
  $('fs-batch-summary').textContent = `Selected: ${summary}`;
  $('fs-batch-summary').classList.remove('hidden');
  $('fs-clear-btn').classList.add('hidden');
  openModal('freezer-slot-modal');
}

function updateSlotHostColorHint(hostName) {
  const hint = $('fs-host-color-hint');
  if (!hint) return;
  const color = getHostColor(hostName);
  if (color) {
    hint.style.display = 'flex';
    hint.innerHTML = `
      <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;margin-right:4px"></span>
      <span style="font-size:11px;color:#8C7B6B">Color assigned · manage in freezer overview</span>`;
  } else {
    hint.style.display = 'none';
  }
}

// ── Save / Clear ──────────────────────────────────────────────────────────────
async function saveFreezerSlot() {
  const mode   = $('fs-mode').value || 'single';
  const layer  = parseInt($('fs-layer').value);
  const drawer = parseInt($('fs-drawer').value);
  const data   = {
    label:   $('fs-label').value.trim(),   host:    $('fs-host').value.trim(),
    species: $('fs-species').value.trim(), tissue:  $('fs-tissue').value.trim(),
    project: $('fs-project').value.trim(), notes:   $('fs-notes').value.trim(),
  };

  if (mode === 'batch') {
    let targets = [];
    try { targets = JSON.parse($('fs-batch-keys').value || '[]'); } catch { targets = []; }
    if (!targets.length) { showToast('No slots selected', '⚠️'); return; }
    let saved = 0;
    for (const t of targets) {
      const existing  = getFSlot(t.layer, t.drawer, t.row, t.col);
      const slotData  = { layer: t.layer, drawer: t.drawer, row: t.row, col: t.col, ...data };
      if (existing) {
        if (sb) { const ok = await sbUpdate('freezer_slots', existing.id, slotData); if (!ok) continue; }
        Object.assign(existing, slotData);
      } else {
        const r = { id: uid(), ...slotData };
        if (sb) { const ok = await sbInsert('freezer_slots', r); if (!ok) continue; }
        state.freezer.push(r);
      }
      saved++;
    }
    selectedSlots.clear();
    closeModal('freezer-slot-modal');
    renderDrawerInside(layer, drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
    saved === targets.length ? showToast(`Updated ${saved} slots`) : showToast(`Updated ${saved}/${targets.length} slots`, '⚠️');
    return;
  }

  // Single slot
  const row = parseInt($('fs-row').value), col = parseInt($('fs-col').value);
  const existing  = getFSlot(layer, drawer, row, col);
  const slotData  = { layer, drawer, row, col, ...data };
  if (existing) {
    if (sb) { const ok = await sbUpdate('freezer_slots', existing.id, slotData); if (!ok) { showToast('Failed to save slot', '⚠️'); return; } }
    Object.assign(existing, slotData);
  } else {
    const r = { id: uid(), ...slotData };
    if (sb) { const ok = await sbInsert('freezer_slots', r); if (!ok) { showToast('Failed to save slot', '⚠️'); return; } }
    state.freezer.push(r);
  }
  closeModal('freezer-slot-modal');
  renderDrawerInside(layer, drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
  showToast('Slot saved');
}

async function clearFreezerSlot() {
  const layer = parseInt($('fs-layer').value), drawer = parseInt($('fs-drawer').value),
        row   = parseInt($('fs-row').value),   col    = parseInt($('fs-col').value);
  const existing = getFSlot(layer, drawer, row, col);
  if (existing) {
    if (sb) { const ok = await sbDelete('freezer_slots', existing.id); if (!ok) { showToast('Failed to clear slot', '⚠️'); return; } }
    state.freezer = state.freezer.filter(s => s.id !== existing.id);
  }
  closeModal('freezer-slot-modal');
  renderDrawerInside(layer, drawer, '');
  showToast('Slot cleared');
}
