// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/trash.js — Trash tab                               ║
// ╚══════════════════════════════════════════════════════════════╝

const TICON = { meeting: '📋', todo: '✅', log: '✨', member: '👥', mouse: '🐭', strain: '🧬' };

function renderTrash() {
  const trash = state.trash;
  const badge = $('trash-badge');
  trash.length > 0
    ? (badge.textContent = trash.length, badge.classList.remove('hidden'))
    : badge.classList.add('hidden');

  $('trash-list').innerHTML = trash.length === 0
    ? '<div class="empty-state">Trash is empty 🎉</div>'
    : trash.map(t => {
        const item  = t.item || {};
        const label = item.name || item.title || item.text || item.cageNo || item.cage_no || item.content?.substring(0, 40) || '(item)';
        return `
          <div class="card trash-item" style="padding:18px 20px;margin-bottom:10px;display:flex;align-items:center;gap:14px">
            <div style="font-size:24px;flex-shrink:0">${TICON[t.type] || '📄'}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-radius:5px;padding:2px 8px;background:#F0EBE2;color:#8C7B6B">${t.type}</span>
                <span style="font-size:11px;color:#8C7B6B">${t.deletedAt || ''}</span>
              </div>
              <div style="font-size:13px;font-weight:600;color:#1A1410;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="restoreItem('${t.id}','${t.type}')">↩ Restore</button>
            <button class="del-btn" onclick="permDelete('${t.id}','${t.type}')">✕</button>
          </div>`;
      }).join('');
}

async function trashItem(type, id) {
  const tmap = { meeting: 'meetings', todo: 'todos', log: 'logs', member: 'members', mouse: 'mice', strain: 'strains' };
  const src  = state[tmap[type]]; const item = src?.find(x => x.id == id); if (!item) return;
  const deletedAt = new Date().toLocaleDateString('en-US');
  await sbDelete(tmap[type], id);
  await sbInsert('trash', { id: item.id, type, item_json: JSON.stringify(item), deleted_at: deletedAt });
  state[tmap[type]] = src.filter(x => x.id != id);
  state.trash.unshift({ id: item.id, type, item, deletedAt });
  renderAll();
  closeModal('meeting-detail-modal'); closeModal('member-detail-modal');
  showToast('Moved to trash — restore anytime', '🗑');
}

async function restoreItem(id, type) {
  const t = state.trash.find(x => x.id == id && x.type === type); if (!t) return;
  const tmap = { meeting: 'meetings', todo: 'todos', log: 'logs', member: 'members', mouse: 'mice', strain: 'strains' };
  const item = { ...t.item };
  if (type === 'mouse')   { item.cage_no = item.cageNo || item.cage_no; item.mating_unit = item.matingUnit || item.mating_unit || 0; item.exp_cages = item.expCages || item.exp_cages || 0; delete item.cageNo; delete item.matingUnit; delete item.expCages; }
  if (type === 'member'  && Array.isArray(item.projects)) { item.projects = JSON.stringify(item.projects); delete item.avatar; }
  if (type === 'meeting' && Array.isArray(item.tags))     { item.tags = JSON.stringify(item.tags); }
  await sbInsert(tmap[type], item);
  await sbDelete('trash', id);
  state.trash = state.trash.filter(x => !(x.id == id && x.type === type));
  if (tmap[type]) state[tmap[type]].push(t.item);
  renderAll(); showToast('Item restored ↩');
}

async function permDelete(id, type) {
  if (!confirm('Permanently delete? This cannot be undone.')) return;
  await sbDelete('trash', id);
  state.trash = state.trash.filter(x => !(x.id == id && x.type === type));
  renderTrash(); showToast('Permanently deleted');
}

async function clearTrash() {
  if (!state.trash.length) return;
  if (!confirm(`Permanently delete all ${state.trash.length} item(s)?`)) return;
  if (sb) await sb.from('trash').delete().neq('id', '__none__');
  state.trash = []; renderTrash(); showToast('Trash emptied');
}
