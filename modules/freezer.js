// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/freezer.js — -80°C Freezer tab                     ║
// ║  Layout dimensions are configured in config.js              ║
// ╚══════════════════════════════════════════════════════════════╝

let currentDrawer = null;

// ── Drawer color helpers (stored in localStorage) ─────────────────────────────
function getDrawerColor(layer, drawer) {
  return localStorage.getItem(`xulab_dcolor_${layer}_${drawer}`) || null;
}
function setDrawerColor(layer, drawer, color) {
  localStorage.setItem(`xulab_dcolor_${layer}_${drawer}`, color);
  renderFreezer();
}

// ── Slot lookup ───────────────────────────────────────────────────────────────
function getFSlot(layer, drawer, row, col) {
  return state.freezer.find(s => s.layer == layer && s.drawer == drawer && s.row == row && s.col == col) || null;
}
function slotMatch(s, q) {
  if (!q || !s) return false;
  return [s.label, s.host, s.tissue, s.species, s.project, s.notes].some(v => v && String(v).toLowerCase().includes(q));
}

// ── Main freezer overview ─────────────────────────────────────────────────────
function renderFreezer() {
  const q         = ($('freezer-search')?.value || '').toLowerCase().trim();
  const container = $('freezer-view'); if (!container) return;
  if (currentDrawer) { renderDrawerInside(currentDrawer.layer, currentDrawer.drawer, q); return; }

  let html = '';
  for (let layer = 1; layer <= FREEZER_LAYERS; layer++) {
    html += `<div style="margin-bottom:20px">
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
          const sl = getFSlot(layer, drawer, r, col);
          const f  = sl && (sl.label || sl.host || sl.tissue || sl.project);
          const h  = q && sl && slotMatch(sl, q);
          const dotColor = dColor && f ? dColor : null;
          dots += `<div class="fd ${h ? 'hit' : f ? 'on' : ''}" style="${dotColor ? `background:${dotColor};opacity:0.85` : ''}"></div>`;
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

  // Search results summary
  const srEl = $('freezer-search-results');
  if (q) {
    const hits = state.freezer.filter(s => slotMatch(s, q));
    srEl.classList.remove('hidden');
    srEl.innerHTML = hits.length
      ? `<div style="font-size:12px;font-weight:700;color:#8C7B6B;margin-bottom:10px">Found ${hits.length} matching slot${hits.length > 1 ? 's' : ''} — highlighted in yellow</div>` +
        hits.map(s => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#FFF8E6;border-radius:8px;margin-bottom:6px;font-size:12px">
            <span style="font-weight:700;color:#1A1410;font-family:'DM Mono',monospace">L${s.layer}·D${s.drawer}·R${s.row}C${s.col}</span>
            <span>${s.label || ''}</span>
            ${s.tissue  ? `<span class="m-tag">${s.tissue}</span>`  : ''}
            ${s.project ? `<span class="m-tag">${s.project}</span>` : ''}
            ${s.host    ? `<span style="color:#8C7B6B">· ${s.host}</span>` : ''}
            <button class="btn btn-outline btn-sm" style="margin-left:auto;font-size:10px" onclick="openDrawer(${s.layer},${s.drawer})">View</button>
          </div>`).join('')
      : `<div style="color:#8C7B6B;font-size:13px">No slots match "${q}"</div>`;
  } else { srEl.classList.add('hidden'); }
}

// ── Drawer inside view ────────────────────────────────────────────────────────
function openDrawer(layer, drawer)  { currentDrawer = { layer, drawer }; renderDrawerInside(layer, drawer, ($('freezer-search')?.value || '').toLowerCase().trim()); }
function closeDrawer()              { currentDrawer = null; renderFreezer(); }

function renderDrawerInside(layer, drawer, q) {
  const container = $('freezer-view');
  const dColor    = getDrawerColor(layer, drawer);
  let grid = '';

  for (let row = 1; row <= FREEZER_ROWS; row++) {
    for (let col = 1; col <= FREEZER_COLS; col++) {
      const sl     = getFSlot(layer, drawer, row, col);
      const filled = sl && (sl.label || sl.host || sl.tissue || sl.project);
      const hit    = q && sl && slotMatch(sl, q);
      const cellStyle = filled && dColor ? `background:${dColor}18;border-color:${dColor}55` : '';
      grid += `
        <div class="drawer-cell ${filled ? 'filled' : ''} ${hit ? 'match' : ''}" style="${cellStyle}" onclick="openSlotEdit(${layer},${drawer},${row},${col})">
          <div class="dc-pos">R${row}C${col}</div>
          <div class="dc-label">${sl?.label || ''}</div>
          <div class="dc-sub">${sl?.tissue || ''}${sl?.project ? ' · ' + sl.project : ''}</div>
          ${sl?.host ? `<div class="dc-sub" style="color:${dColor || '#4D96FF'}">${sl.host}</div>` : ''}
        </div>`;
    }
  }

  const colorDot = dColor ? `<div style="width:14px;height:14px;border-radius:50%;background:${dColor};border:1.5px solid rgba(0,0,0,.15);flex-shrink:0"></div>` : '';

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" onclick="closeDrawer()">← Back</button>
      <div style="font-family:'DM Serif Display',serif;font-size:18px;color:#1A1410">Layer ${layer} · Drawer ${drawer}</div>
      ${colorDot}
      <div style="display:flex;align-items:center;gap:6px">
        <label style="font-size:11px;color:#8C7B6B;cursor:pointer" for="drawer-color-inside">Drawer color:</label>
        <input type="color" id="drawer-color-inside" value="${dColor || '#4D96FF'}" style="width:28px;height:22px;border:none;border-radius:5px;cursor:pointer;background:transparent;padding:1px"
          onchange="setDrawerColor(${layer},${drawer},this.value)">
        ${dColor ? `<button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 8px" onclick="localStorage.removeItem('xulab_dcolor_${layer}_${drawer}');renderDrawerInside(${layer},${drawer},'')">✕ Remove</button>` : ''}
      </div>
      <div style="font-size:12px;color:#8C7B6B">(Left: Front; Right: Back)</div>
    </div>
    <div class="drawer-grid">${grid}</div>`;
}

// ── Slot edit modal ───────────────────────────────────────────────────────────
function openSlotEdit(layer, drawer, row, col) {
  const s = getFSlot(layer, drawer, row, col) || {};
  $('fs-layer').value = layer; $('fs-drawer').value = drawer; $('fs-row').value = row; $('fs-col').value = col;
  $('fs-title').textContent = `Layer ${layer} · Drawer ${drawer} · R${row}C${col}`;
  $('fs-label').value   = s.label   || ''; $('fs-host').value    = s.host    || '';
  $('fs-species').value = s.species || ''; $('fs-tissue').value  = s.tissue  || '';
  $('fs-project').value = s.project || ''; $('fs-notes').value   = s.notes   || '';
  openModal('freezer-slot-modal');
}
async function saveFreezerSlot() {
  const layer = parseInt($('fs-layer').value), drawer = parseInt($('fs-drawer').value),
        row   = parseInt($('fs-row').value),   col    = parseInt($('fs-col').value);
  const existing = getFSlot(layer, drawer, row, col);
  const data = { layer, drawer, row, col, label: $('fs-label').value.trim(), host: $('fs-host').value.trim(), species: $('fs-species').value.trim(), tissue: $('fs-tissue').value.trim(), project: $('fs-project').value.trim(), notes: $('fs-notes').value.trim() };
  if (existing) { if (sb) await sbUpdate('freezer_slots', existing.id, data); Object.assign(existing, data); }
  else          { const r = { id: uid(), ...data }; if (sb) await sbInsert('freezer_slots', r); state.freezer.push(r); }
  closeModal('freezer-slot-modal');
  renderDrawerInside(layer, drawer, ($('freezer-search')?.value || '').toLowerCase().trim());
  showToast('Slot saved');
}
async function clearFreezerSlot() {
  const layer = parseInt($('fs-layer').value), drawer = parseInt($('fs-drawer').value),
        row   = parseInt($('fs-row').value),   col    = parseInt($('fs-col').value);
  const existing = getFSlot(layer, drawer, row, col);
  if (existing) { if (sb) await sbDelete('freezer_slots', existing.id); state.freezer = state.freezer.filter(s => s.id !== existing.id); }
  closeModal('freezer-slot-modal'); renderDrawerInside(layer, drawer, ''); showToast('Slot cleared');
}
