// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/app.js — App state, data loading, and init         ║
// ║  Owns the global `state` object and orchestrates startup.   ║
// ╚══════════════════════════════════════════════════════════════╝

// ── Global mutable state ──────────────────────────────────────────────────────
let USER_NAME = localStorage.getItem('xulab_user') || 'Lab Member';
let newPrio   = 'medium';
let logFilter = 'all';

let state = {
  members:  [],
  meetings: [],
  todos:    [],
  logs:     [],
  mice:     [],
  strains:  [],
  onboard:  [],
  trash:    [],
  waste:    [],
  freezer:  [],
  freezerDrawerColors: [],
  freezerHostColors:   [],
};

// ── Load all data from Supabase ───────────────────────────────────────────────
async function loadAll() {
  if (!sb) { renderAll(); return; }
  try {
    showToast('Loading…', '⏳');
    const [members, meetings, todos, logs, mice, strains, onboard, trash, waste, freezer, freezerDrawerColors, freezerHostColors] =
      await Promise.all([
        sbGet('members',       { order: 'created_at', asc: true  }),
        sbGet('meetings',      { order: 'created_at', asc: false }),
        sbGet('todos',         { order: 'created_at', asc: false }),
        sbGet('logs',          { order: 'created_at', asc: false }),
        sbGet('mice',          { order: 'cage_no',    asc: true  }),
        sbGet('strains',       { order: 'created_at', asc: true  }),
        sbGet('onboarding',    { order: 'created_at', asc: true  }),
        sbGet('trash',         { order: 'deleted_at', asc: false }),
        sbGet('waste_log',     { order: 'created_at', asc: false }),
        sbGet('freezer_slots',         { order: 'created_at', asc: true  }),
        sbGet('freezer_drawer_colors', { order: 'created_at', asc: true  }),
        sbGet('freezer_host_colors',   { order: 'created_at', asc: true  }),
      ]);

    state.members  = members.map(m => ({
      ...m,
      projects: typeof m.projects === 'string' ? JSON.parse(m.projects || '[]') : (m.projects || []),
      avatar: (m.name || '?')[0].toUpperCase(),
    }));
    state.meetings = meetings.map(m => ({
      ...m,
      tags: typeof m.tags === 'string' ? JSON.parse(m.tags || '[]') : (m.tags || []),
    }));
    state.todos   = todos;
    state.logs    = logs;
    state.mice    = mice.map(m => ({
      ...m,
      cageNo:      m.cage_no,
      matingUnit:  Number(m.mating_unit) || 0,
      expCages:    Number(m.exp_cages)   || 0,
    }));
    state.strains = strains;
    state.onboard = onboard;
    state.trash   = trash.map(t => ({
      ...t,
      item: typeof t.item_json === 'string' ? JSON.parse(t.item_json || '{}') : (t.item_json || {}),
    }));
    state.waste   = waste   || [];
    state.freezer             = freezer || [];
    state.freezerDrawerColors = freezerDrawerColors || [];
    state.freezerHostColors   = freezerHostColors || [];
  } catch (e) {
    console.error(e);
    showToast('Failed to load data', '⚠️');
  }
  renderAll();
}

// ── Re-render every module ────────────────────────────────────────────────────
// To add a new module: create modules/mymodule.js with a renderMyModule()
// function, then add renderMyModule() to the list below.
function renderAll() {
  renderOverview();
  renderMembers();
  renderMeetings();
  renderTodos();
  renderLogs();
  renderMice();
  renderWaste();
  renderFreezer();
  renderTrash();
}

// ── App initialisation ────────────────────────────────────────────────────────
(function init() {
  // Topbar
  $('today-date').textContent       = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  $('topbar-lab-name').textContent  = LAB_NAME;
  $('topbar-lab-sub').textContent   = LAB_SUB;
  document.title                    = LAB_NAME;

  // Defaults
  $('user-name-input').value = USER_NAME;
  $('lg-author').value       = USER_NAME;
  document.querySelectorAll('input[type=date]').forEach(el => {
    el.value = new Date().toISOString().split('T')[0];
  });
  setNewPrio('medium');

  // Hide all tabs except overview
  TABS.forEach(t => {
    if (t !== 'overview') {
      const el = $('tab-' + t);
      if (el) el.classList.add('hidden');
    }
  });
  $('nav-members').classList.remove('active');

  // Connect to DB and load data
  initSB();
  loadAll().then(() => {
    refreshStrainDropdown();
    renderStrainList();
  });
})();
