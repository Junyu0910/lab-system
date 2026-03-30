// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/todos.js — To-Do tab                               ║
// ╚══════════════════════════════════════════════════════════════╝

function setNewPrio(p) {
  newPrio = p;
  ['high', 'medium', 'low'].forEach(x => {
    $('pf-' + x).style.borderColor  = x === p ? '#1A1410' : 'transparent';
    $('pf-' + x).style.fontWeight   = x === p ? '700' : '600';
  });
}

function renderTodos() {
  const pending = state.todos.filter(t => !t.done);
  const done    = state.todos.filter(t =>  t.done);
  $('todos-sub').textContent = `${pending.length} pending · ${done.length} done`;

  const ri = t => `
    <div class="todo-item ${t.done ? 'done' : ''}">
      <div class="todo-check" onclick="toggleTodo('${t.id}',${!t.done})">${t.done ? '✓' : ''}</div>
      <div style="flex:1">
        <div style="font-size:13px;color:${t.done ? '#8C7B6B' : '#1A1410'};font-weight:500;text-decoration:${t.done ? 'line-through' : 'none'}">${t.text}</div>
        ${t.due ? `<div style="font-size:11px;color:#8C7B6B;margin-top:1px">📅 Due ${t.due}</div>` : ''}
      </div>
      <span class="prio-badge" style="background:${PRIO_COLOR[t.priority] || '#E8C547'}33;color:${PRIO_COLOR[t.priority] || '#E8C547'}">${PRIO_LABEL[t.priority] || ''}</span>
      <button class="edit-btn" onclick="editTodo('${t.id}')">✏️</button>
      <button class="del-btn"  onclick="trashItem('todo','${t.id}')">🗑</button>
    </div>`;

  $('todo-list').innerHTML =
    (pending.length ? pending.map(ri).join('') : '<div class="empty-state" style="padding:20px">All caught up! 🎉</div>') +
    (done.length ? `<div class="section-divider">Completed</div>${done.map(ri).join('')}` : '');
}

async function addTodo() {
  const text = $('todo-input').value.trim(); if (!text) return;
  const t = { id: uid(), text, done: false, priority: newPrio, due: $('todo-due').value };
  const ok = await sbInsert('todos', t); if (!ok) { showToast('Failed to save', '⚠️'); return; }
  state.todos.unshift(t); renderTodos();
  $('todo-input').value = ''; $('todo-due').value = '';
  showToast('Task added');
}

async function toggleTodo(id, done) {
  const t = state.todos.find(x => x.id == id); if (t) t.done = done;
  await sbUpdate('todos', id, { done }); renderTodos();
}

function editTodo(id) {
  const t = state.todos.find(x => x.id == id); if (!t) return;
  $('et-id').value = id; $('et-text').value = t.text || ''; $('et-due').value = t.due || ''; $('et-priority').value = t.priority || 'medium';
  openModal('edit-todo-modal');
}

async function saveTodo() {
  const id = $('et-id').value; const text = $('et-text').value.trim(); if (!text) { showToast('Please enter task text', '⚠️'); return; }
  const upd = { text, due: $('et-due').value, priority: $('et-priority').value };
  await sbUpdate('todos', id, upd);
  const t = state.todos.find(x => x.id == id); if (t) Object.assign(t, upd);
  renderTodos(); closeModal('edit-todo-modal'); showToast('Task updated');
}
