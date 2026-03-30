// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/freezer.js — -80°C Freezer tab                     ║
// ║  Layout dimensions configured in config.js                  ║
// ║  Host colors & drawer colors stored in localStorage         ║
// ╚══════════════════════════════════════════════════════════════╝

let currentDrawer = null;

// ── Drawer color helpers ──────────────────────────────────────────────────────
function getDrawerColor(layer, drawer) {
  return localStorage.getItem(`xulab_dcolor_${layer}_${drawer}`) || null;
}
function setDrawerColor(layer, drawer, color) {
  localStorage.setItem(`xulab_dcolor_${layer}_${drawer}`, color);
  renderFreezer();
}

// ── Host color helpers ────────────────────────────────────────────────────────
// Stored as JSON: { "Alex": "#4D96FF", "Sarah": "#FF7E5F" }
function getHostColors() {
  try { return JSON.parse(localStorage.getItem('xulab_hostcolors') || '{}'); } catch { return {}; }
}
function saveHostColors(map) {
  localStorage.setItem('xulab_hostcolors', JSON.stringify(map));
}
function getHostColor(hostName) {
  if (!hostName) return null;
  const map = getHostColors();
  const key = Object.keys(map).find(k => k.toLowerCase() === hostName.toLowerCase());
  return key ? map[key] : null;
}
function setHostColor(name, color) {
  const map = getHostColors();
  map[name] = color;
  saveHostColors(map);
  renderFreezer();
}
function removeHostColor(name) {
  const map = getHostColors();
  delete map[name];
  saveHostColors(map);
  renderFreezer();
}

// ── Host Colors panel (shown on freezer overview page) ────────────────────────
function renderHostColorPanel() {
  const map      = getHostColors();
  const entries  = Object.entries(map);

  // Suggest names from existing freezer data + lab members
  const freezerHosts = [...new Set(state.freezer.map(s => s.host).filter(Boolean))];
  const memberNames  = state.members.map(m => m.name).filter(Boolean);
  const allHosts     = [...new Set([...freezerHosts, ...memberNames])];
  const unassigned   = allHosts.filter(
    h => !Object.keys(map).find(k => k.toLowerCase() === h.toLowerCase())
  );

  return `
    <div style="background:#fff;border-radius:16px;padding:18px 20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,.06)">
      <div style="font-weight:700;font-size:13px;color:#1A1410;margin-bottom:14px;display:flex;align-items:center;gap:8px">
        🎨 Host Colors
        <span style="font-size:11px;font-weight:400;color:#8C7B6B">Assign a color per person — their boxes will be highlighted throughout the freezer</span>
      </div>

      <!-- Existing entries -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;${entries.length ? 'margin-bottom:14px' : ''}">
        ${entries.map(([name, color]) => `
          <div style="display:inline-flex;align-items:center;gap:7px;background:#F5F0E8;border-radius:8px;padding:6px 10px;border:1.5px solid ${color}66">
            <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;border:1px solid rgba(0,0,0,.1)"></div>
            <span style="font-size:12px;font-weight:600;color:#1A1410">${name}</span>
            <input type="color" value="${color}"
              style="width:22px;height:22px;border:none;border-radius:4px;cursor:pointer;background:transparent;padding:1px"
              title="Change color"
              onchange="setHostColor('${name}', this.value)">
            <button onclick="removeHostColor('${name}')"
              style="background:none;border:none;cursor:pointer;color:#C0BBAF;font-size:13px;line-height:1;padding:0 2px"
              title="Remove">✕</button>
          </div>`).join('')}
        ${entries.length === 0 ? `<div style="font-size:12px;color:#C0BBAF">No host colors set yet.</div>` : ''}
      </div>

      <!-- Add new -->
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

// ── Slot helpers ──────────────────────────────────────────────────────────────
function getFSlot(layer, drawer, row, col) {
  return state.freezer.find(s => s.layer == layer && s.drawer == drawer && s.row == row && s.col == col) || null;
}
function slotMatch(s, q) {
  if (!q || !s) return false;
  return [s.label, s.host, s.tissue, s.species, s.project, s.notes].some(v => v && String(v).toLowerCase().includes(q));
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
          const sl       = getFSlot(layer, drawer, r, col);
          const f        = sl && (sl.label || sl.host || sl.tissue || sl.project);
          const h        = q && sl && slotMatch(sl, q);
          // Host color takes priority over drawer color for individual dots
          const hostCol  = f && sl?.host ? getHostColor(sl.host) : null;
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
function openDrawer(layer, drawer) { currentDrawer = { layer, drawer }; renderDrawerInside(layer, drawer, ($('freezer-search')?.value || '').toLowerCase().trim()); }
function closeDrawer()             { currentDrawer = null; renderFreezer(); }

function renderDrawerInside(layer, drawer, q) {
  const container = $('freezer-view');
  const dColor    = getDrawerColor(layer, drawer);
  let grid = '';

  for (let row = 1; row <= FREEZER_ROWS; row++) {
    for (let col = 1; col <= FREEZER_COLS; col++) {
      const sl       = getFSlot(layer, drawer, row, col);
      const filled   = sl && (sl.label || sl.host || sl.tissue || sl.project);
      const hit      = q && sl && slotMatch(sl, q);
      const hostCol  = filled && sl?.host ? getHostColor(sl.host) : null;
      const cellColor = hostCol || dColor;
      const cellStyle = filled && cellColor ? `background:${cellColor}18;border-color:${cellColor}66` : '';
      const hostTextColor = hostCol || dColor || '#4D96FF';

      grid += `
        <div class="drawer-cell ${filled ? 'filled' : ''} ${hit ? 'match' : ''}" style="${cellStyle}" onclick="openSlotEdit(${layer},${drawer},${row},${col})">
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

  // Build host color legend for hosts present in this drawer
  const drawerHosts = [...new Set(
    state.freezer.filter(s => s.layer == layer && s.drawer == drawer && s.host).map(s => s.host)
  )];
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
        <label style="font-size:11px;color:#8C7B6B;cursor:pointer">Drawer color:</label>
        <input type="color" id="drawer-color-inside" value="${dColor || '#4D96FF'}"
          style="width:28px;height:22px;border:none;border-radius:5px;cursor:pointer;background:transparent;padding:1px"
          onchange="setDrawerColor(${layer},${drawer},this.value)">
        ${dColor ? `<button class="btn btn-outline btn-sm" style="font-size:10px;padding:3px 8px" onclick="localStorage.removeItem('xulab_dcolor_${layer}_${drawer}');renderDrawerInside(${layer},${drawer},'')">✕ Remove</button>` : ''}
      </div>
      <div style="font-size:12px;color:#8C7B6B">(view from right)</div>
    </div>
    ${legend}
    <div class="drawer-grid">${grid}</div>`;
}

// ── Slot edit modal ───────────────────────────────────────────────────────────
function openSlotEdit(layer, drawer, row, col) {
  const s = getFSlot(layer, drawer, row, col) || {};
  $('fs-layer').value = layer; $('fs-drawer').value = drawer;
  $('fs-row').value   = row;   $('fs-col').value    = col;
  $('fs-title').textContent = `Layer ${layer} · Drawer ${drawer} · R${row}C${col}`;
  $('fs-label').value   = s.label   || ''; $('fs-host').value    = s.host    || '';
  $('fs-species').value = s.species || ''; $('fs-tissue').value  = s.tissue  || '';
  $('fs-project').value = s.project || ''; $('fs-notes').value   = s.notes   || '';
  updateSlotHostColorHint(s.host || '');
  openModal('freezer-slot-modal');
}

// Show color dot in modal when host already has a color assigned
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

async function saveFreezerSlot() {
  const layer = parseInt($('fs-layer').value), drawer = parseInt($('fs-drawer').value),
        row   = parseInt($('fs-row').value),   col    = parseInt($('fs-col').value);
  const existing = getFSlot(layer, drawer, row, col);
  const data = {
    layer, drawer, row, col,
    label:   $('fs-label').value.trim(),   host:    $('fs-host').value.trim(),
    species: $('fs-species').value.trim(), tissue:  $('fs-tissue').value.trim(),
    project: $('fs-project').value.trim(), notes:   $('fs-notes').value.trim(),
  };
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
  if (existing) {
    if (sb) await sbDelete('freezer_slots', existing.id);
    state.freezer = state.freezer.filter(s => s.id !== existing.id);
  }
  closeModal('freezer-slot-modal');
  renderDrawerInside(layer, drawer, '');
  showToast('Slot cleared');
}
