// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/overview.js — Overview tab                         ║
// ╚══════════════════════════════════════════════════════════════╝

function renderOverview() {
  const pending = state.todos.filter(t => !t.done);
  const urgent  = pending.filter(t => t.priority === 'high');

  $('ov-meetings').textContent = state.meetings.length;
  $('ov-todos').textContent    = pending.length;
  $('ov-urgent').textContent   = urgent.length;

  // Recent meetings
  $('ov-meetings-list').innerHTML = state.meetings.slice(0, 3).length === 0
    ? '<div class="overview-empty">No meetings yet.</div>'
    : state.meetings.slice(0, 3).map(m => `
        <div class="overview-item" onclick="switchTab('meetings')">
          <span style="flex-shrink:0">📋</span>
          <div>
            <div style="font-weight:600">${m.title}</div>
            <div style="font-size:11px;color:#8C7B6B">${m.date || 'No date'}${m.presenter ? ' · ' + m.presenter : ''}</div>
          </div>
        </div>`).join('');

  // Urgent to-dos
  $('ov-todos-list').innerHTML = urgent.length === 0
    ? '<div class="overview-empty">No urgent items 🎉</div>'
    : urgent.map(t => `
        <div class="overview-item overview-item-urgent" onclick="switchTab('todos')">
          <span style="color:#FF7E5F;flex-shrink:0">●</span>
          <span>${t.text}${t.due ? `<span style="font-size:11px;color:#8C7B6B;margin-left:8px">Due ${t.due}</span>` : ''}</span>
        </div>`).join('');

  // Recent moments
  const rLogs = [...state.logs].slice(0, 3);
  $('ov-logs-list').innerHTML = rLogs.length === 0
    ? '<div class="overview-empty">No moments yet.</div>'
    : rLogs.map(l => {
        const m    = MOMENT_TYPES[l.type] || MOMENT_TYPES.note;
        const icon = m.icon;
        return `
          <div class="overview-item" onclick="switchTab('logs')">
            <span style="font-size:16px;flex-shrink:0">${icon}</span>
            <div style="min-width:0">
              <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.content?.substring(0, 80) || ''}</div>
              <div style="font-size:11px;color:#8C7B6B">${l.date || ''}${l.author ? ' · ' + l.author : ''}</div>
            </div>
          </div>`;
      }).join('');

  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  $('overview-sub').textContent = `Last updated ${now}`;
}
