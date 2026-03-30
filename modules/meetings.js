// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/meetings.js — Meeting Records tab                  ║
// ╚══════════════════════════════════════════════════════════════╝

let activeTagFilter = '';

function setTagFilter(tag) {
  activeTagFilter = tag;
  document.querySelectorAll('[id^="tag-filter-"]').forEach(b => b.classList.remove('active'));
  const btn = tag
    ? document.getElementById('tag-filter-' + tag.replace(/[^a-zA-Z0-9]/g, '_'))
    : $('tag-filter-all');
  if (btn) btn.classList.add('active');
  renderMeetings();
}

function renderMeetings() {
  const allTags = [...new Set(state.meetings.flatMap(m => m.tags || []))].filter(Boolean);
  $('tag-filter-btns').innerHTML = allTags.map(t =>
    `<button class="log-type-btn ${activeTagFilter === t ? 'active' : ''}" id="tag-filter-${t.replace(/[^a-zA-Z0-9]/g, '_')}" onclick="setTagFilter('${t}')" style="font-size:11px;padding:4px 10px">${t}</button>`
  ).join('');

  const filtered = activeTagFilter
    ? state.meetings.filter(m => (m.tags || []).includes(activeTagFilter))
    : state.meetings;

  $('meetings-sub').textContent = state.meetings.length + ' record' + (state.meetings.length !== 1 ? 's' : '') +
    (activeTagFilter ? ` · filtered by "${activeTagFilter}"` : '');

  $('meeting-list').innerHTML = filtered.length === 0
    ? '<div class="empty-state">No meetings recorded yet.</div>'
    : filtered.map(m => `
        <div class="card card-hover meeting-card" onclick="showMeeting('${m.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <div style="font-weight:700;font-size:15px;color:#1A1410">${m.title}</div>
              <div style="font-size:12px;color:#8C7B6B;margin-top:3px">📅 ${m.date || 'No date'}${m.presenter ? ` · <strong>${m.presenter}</strong>` : ''}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="edit-btn" onclick="event.stopPropagation();editMeeting('${m.id}')">✏️</button>
              <button class="del-btn"  onclick="event.stopPropagation();trashItem('meeting','${m.id}')">🗑</button>
            </div>
          </div>
          ${m.summary ? `<p style="color:#5C4D3C;font-size:13px;line-height:1.6;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${m.summary}</p>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap">${(m.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}</div>
        </div>`).join('');
}

function showMeeting(id) {
  const m = state.meetings.find(x => x.id == id); if (!m) return;
  $('meeting-detail-title').textContent = m.title;
  $('meeting-detail-content').innerHTML = `
    <div style="font-size:12px;color:#8C7B6B;margin-bottom:16px">📅 ${m.date || 'No date'}${m.presenter ? ` · <strong>${m.presenter}</strong>` : ''}</div>
    ${m.summary ? `<div style="margin-bottom:14px"><div class="form-label" style="margin-bottom:6px">Summary</div><div style="background:#F5F0E8;border-radius:10px;padding:14px;font-size:13px;color:#1A1410;line-height:1.7">${m.summary}</div></div>` : ''}
    ${m.notes   ? `<div style="margin-bottom:14px"><div class="form-label" style="margin-bottom:6px">Notes / Action Items</div><div style="background:#FFF8E6;border-radius:10px;padding:14px;font-size:13px;color:#8C5E0A;line-height:1.7">⚡ ${m.notes}</div></div>` : ''}
    ${(m.tags || []).length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${(m.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}</div>` : ''}
    <div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn btn-outline" onclick="editMeeting('${m.id}')">✏️ Edit</button></div>`;
  openModal('meeting-detail-modal');
}

async function addMeeting() {
  const title = $('mt-title').value.trim(); if (!title) { showToast('Please enter a title', '⚠️'); return; }
  const tags = $('mt-tags').value.split(',').map(s => s.trim()).filter(Boolean);
  const row = { id: uid(), date: $('mt-date').value, title, presenter: $('mt-presenter').value, summary: $('mt-summary').value, notes: $('mt-notes').value, tags: JSON.stringify(tags) };
  const ok = await sbInsert('meetings', row); if (!ok) { showToast('Failed to save', '⚠️'); return; }
  state.meetings.unshift({ ...row, tags }); renderMeetings();
  ['mt-date', 'mt-title', 'mt-presenter', 'mt-summary', 'mt-notes', 'mt-tags'].forEach(id => $(id).value = '');
  closeModal('add-meeting-modal'); showToast('Meeting saved');
}

function editMeeting(id) {
  const m = state.meetings.find(x => x.id == id); if (!m) return;
  $('emt-id').value = id; $('emt-date').value = m.date || ''; $('emt-title').value = m.title || '';
  $('emt-presenter').value = m.presenter || ''; $('emt-summary').value = m.summary || '';
  $('emt-notes').value = m.notes || ''; $('emt-tags').value = (m.tags || []).join(', ');
  closeModal('meeting-detail-modal'); openModal('edit-meeting-modal');
}

async function saveMeeting() {
  const id = $('emt-id').value; const title = $('emt-title').value.trim(); if (!title) { showToast('Please enter a title', '⚠️'); return; }
  const tags = $('emt-tags').value.split(',').map(s => s.trim()).filter(Boolean);
  const upd = { date: $('emt-date').value, title, presenter: $('emt-presenter').value, summary: $('emt-summary').value, notes: $('emt-notes').value, tags: JSON.stringify(tags) };
  await sbUpdate('meetings', id, upd);
  const m = state.meetings.find(x => x.id == id); if (m) Object.assign(m, { ...upd, tags });
  renderMeetings(); closeModal('edit-meeting-modal'); showToast('Meeting updated');
}
