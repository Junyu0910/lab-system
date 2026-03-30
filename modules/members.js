// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/members.js — Lab Members tab                       ║
// ╚══════════════════════════════════════════════════════════════╝

function renderMembers() {
  $('members-sub').textContent = state.members.length + ' member' + (state.members.length !== 1 ? 's' : '');
  $('member-grid').innerHTML = state.members.length === 0
    ? '<div class="empty-state">No members yet. Add the first one!</div>'
    : state.members.map(m => `
        <div class="card card-hover" style="padding:20px;cursor:pointer" onclick="showMember('${m.id}')">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div class="m-avatar" style="background:${m.color || '#E8C547'}">${m.avatar || '?'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;color:#1A1410;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.name}</div>
              <div style="font-size:11px;color:#8C7B6B;margin-top:1px">${m.role || '—'}</div>
            </div>
            <button class="edit-btn" onclick="event.stopPropagation();editMember('${m.id}')">✏️</button>
            <button class="del-btn"  onclick="event.stopPropagation();trashItem('member','${m.id}')">🗑</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:7px;font-size:11px;color:#5C4D3C"><span>✉️</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.email || '—'}</span></div>
            <div style="display:flex;align-items:center;gap:7px;font-size:11px;color:#5C4D3C"><span>📞</span>${m.phone || '—'}</div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:5px">${(m.projects || []).map(p => `<span class="m-tag">${p}</span>`).join('')}</div>
        </div>`).join('');
}

function showMember(id) {
  const m = state.members.find(x => x.id == id); if (!m) return;
  $('member-detail-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div class="m-avatar" style="background:${m.color || '#E8C547'};width:56px;height:56px;font-size:22px">${m.avatar}</div>
      <div><div style="font-size:19px;font-weight:700;color:#1A1410">${m.name}</div><div style="color:#8C7B6B;margin-top:1px">${m.role || ''}</div></div>
    </div>
    <div class="info-row"><span>✉️</span><div><div style="font-size:10px;color:#8C7B6B">Email</div><div style="font-size:13px">${m.email || '—'}</div></div></div>
    <div class="info-row"><span>📞</span><div><div style="font-size:10px;color:#8C7B6B">Phone</div><div style="font-size:13px">${m.phone || '—'}</div></div></div>
    <div style="margin-top:14px">
      <div class="form-label" style="margin-bottom:8px">Projects / Responsibilities</div>
      ${(m.projects || []).length
        ? (m.projects || []).map(p => `<div style="background:#F0EBE2;border-radius:8px;padding:9px 12px;margin-bottom:7px;font-size:13px;color:#1A1410">📌 ${p}</div>`).join('')
        : '<div style="color:#8C7B6B;font-size:13px">No projects listed</div>'}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-outline" onclick="editMember('${m.id}')">✏️ Edit</button>
    </div>`;
  openModal('member-detail-modal');
}

async function addMember() {
  const name = $('m-name').value.trim(); if (!name) { showToast('Please enter a name', '⚠️'); return; }
  const projects = $('m-projects').value.split(',').map(s => s.trim()).filter(Boolean);
  const row = { id: uid(), name, role: $('m-role').value, email: $('m-email').value, phone: $('m-phone').value, projects: JSON.stringify(projects), color: $('m-color').value };
  const ok = await sbInsert('members', row); if (!ok) { showToast('Failed to save', '⚠️'); return; }
  state.members.push({ ...row, projects, avatar: name[0].toUpperCase() });
  renderMembers();
  ['m-name', 'm-role', 'm-email', 'm-phone', 'm-projects'].forEach(id => $(id).value = '');
  closeModal('add-member-modal'); showToast('Member added');
}

function editMember(id) {
  const m = state.members.find(x => x.id == id); if (!m) return;
  $('em-id').value = id; $('em-name').value = m.name || ''; $('em-role').value = m.role || '';
  $('em-email').value = m.email || ''; $('em-phone').value = m.phone || '';
  $('em-projects').value = (m.projects || []).join(', '); $('em-color').value = m.color || '#E8C547';
  closeModal('member-detail-modal'); openModal('edit-member-modal');
}

async function saveMember() {
  const id = $('em-id').value; const name = $('em-name').value.trim(); if (!name) { showToast('Please enter a name', '⚠️'); return; }
  const projects = $('em-projects').value.split(',').map(s => s.trim()).filter(Boolean);
  const upd = { name, role: $('em-role').value, email: $('em-email').value, phone: $('em-phone').value, projects: JSON.stringify(projects), color: $('em-color').value };
  await sbUpdate('members', id, upd);
  const m = state.members.find(x => x.id == id); if (m) Object.assign(m, { ...upd, projects, avatar: name[0].toUpperCase() });
  renderMembers(); closeModal('edit-member-modal'); showToast('Member updated');
}
