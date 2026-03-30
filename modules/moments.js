// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/moments.js — Team Moments tab                      ║
// ║  Types are configured in config.js → MOMENT_TYPES           ║
// ╚══════════════════════════════════════════════════════════════╝

function setLogFilter(f) {
  logFilter = f;
  // 'all' + all keys in MOMENT_TYPES
  ['all', ...Object.keys(MOMENT_TYPES)].forEach(x => {
    const el = $('lf-' + x); if (el) el.classList.toggle('active', x === f);
  });
  renderLogs();
}

function renderLogs() {
  const logs = logFilter === 'all' ? state.logs : state.logs.filter(l => l.type === logFilter);
  $('logs-sub').textContent = state.logs.length + ' moment' + (state.logs.length !== 1 ? 's' : '');

  $('log-list').innerHTML = logs.length === 0
    ? '<div class="empty-state">No moments yet. Add your first one!</div>'
    : [...logs].map(l => {
        const m    = MOMENT_TYPES[l.type] || MOMENT_TYPES.note;
        const icon = m.icon;
        return `
          <div class="card log-item" style="margin-bottom:10px;border-left:4px solid ${m.color}44">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:20px">${icon}</span>
                <span class="log-type-label" style="background:${m.bg};color:${m.color}">${m.label}</span>
                <span style="font-size:11px;color:#8C7B6B">📅 ${l.date || '—'}</span>
                ${l.author ? `<span style="font-size:11px;color:#8C7B6B">· ${l.author}</span>` : ''}
              </div>
              <div style="display:flex;gap:6px">
                <button class="edit-btn" onclick="editLog('${l.id}')">✏️</button>
                <button class="del-btn"  onclick="trashItem('log','${l.id}')">🗑</button>
              </div>
            </div>
            <div style="font-size:13px;color:#1A1410;line-height:1.7;white-space:pre-wrap">${l.content}</div>
          </div>`;
      }).join('');
}

async function addLog() {
  const content = $('lg-content').value.trim(); if (!content) { showToast('Please enter content', '⚠️'); return; }
  const l = { id: uid(), date: $('lg-date').value, type: $('lg-type').value, content, author: $('lg-author').value || USER_NAME };
  const ok = await sbInsert('logs', l); if (!ok) { showToast('Failed to save', '⚠️'); return; }
  state.logs.unshift(l); renderLogs();
  ['lg-date', 'lg-content', 'lg-author'].forEach(id => $(id).value = '');
  closeModal('add-log-modal'); showToast('Moment saved ✨');
}

function editLog(id) {
  const l = state.logs.find(x => x.id == id); if (!l) return;
  $('el-id').value = id; $('el-date').value = l.date || ''; $('el-type').value = l.type || 'note';
  $('el-author').value = l.author || ''; $('el-content').value = l.content || '';
  openModal('edit-log-modal');
}

async function saveLog() {
  const id = $('el-id').value; const content = $('el-content').value.trim(); if (!content) { showToast('Please enter content', '⚠️'); return; }
  const upd = { date: $('el-date').value, type: $('el-type').value, author: $('el-author').value, content };
  await sbUpdate('logs', id, upd);
  const l = state.logs.find(x => x.id == id); if (l) Object.assign(l, upd);
  renderLogs(); closeModal('edit-log-modal'); showToast('Moment updated');
}
