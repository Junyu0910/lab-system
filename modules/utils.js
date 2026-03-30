// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/utils.js — Shared utility functions                ║
// ║  Helpers used by all modules: toast, modal, uid, tabs, etc. ║
// ╚══════════════════════════════════════════════════════════════╝

// Shorthand for getElementById
const $ = id => document.getElementById(id);

// Generate a unique ID for new records
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Show a toast notification (bottom-right)
function showToast(msg, icon = '✅', dur = 2600) {
  const t = $('toast');
  t.innerHTML = `<span>${icon}</span>${msg}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// Open / close a modal by its overlay id
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

// Switch between main tabs
function switchTab(name) {
  TABS.forEach(t => {
    $('tab-' + t).classList.toggle('hidden', t !== name);
    $('nav-' + t).classList.toggle('active', t === name);
  });
}

// Member avatar color picker helpers
function selectColor(c) {
  $('m-color').value = c;
  document.querySelectorAll('.color-swatch').forEach(d =>
    d.classList.toggle('selected', d.style.background === c)
  );
}
function onColorChange(c) {
  $('m-color').value = c;
  document.querySelectorAll('.color-swatch').forEach(d => d.classList.remove('selected'));
}

// Settings modal: save display name
function saveSettings() {
  USER_NAME = $('user-name-input').value.trim() || 'Lab Member';
  localStorage.setItem('xulab_user', USER_NAME);
  closeModal('setup-modal');
  showToast('Name saved');
}

// Password gate
const LAB_PW_KEY = 'xulab_auth';
function checkPW() {
  const v = $('pw-input').value;
  if (v === LAB_PASSWORD) {
    sessionStorage.setItem(LAB_PW_KEY, '1');
    const o = $('pw-overlay');
    o.style.transition = 'opacity .4s'; o.style.opacity = '0';
    setTimeout(() => o.remove(), 400);
  } else {
    const i = $('pw-input'), e = $('pw-error');
    i.classList.add('error');
    e.textContent = 'Incorrect password. Try again.';
    i.value = '';
    setTimeout(() => { i.classList.remove('error'); e.textContent = ''; }, 1500);
  }
}
if (sessionStorage.getItem(LAB_PW_KEY) === '1') {
  document.addEventListener('DOMContentLoaded', () => {
    const o = $('pw-overlay'); if (o) o.remove();
  });
}

// Welcome overlay — dismiss on click or any keypress
function dismissWelcome() {
  const el = $('welcome-overlay'); if (!el) return;
  el.classList.add('hiding');
  setTimeout(() => el.remove(), 380);
}
document.addEventListener('keydown', function onKey() {
  dismissWelcome();
  document.removeEventListener('keydown', onKey);
}, { once: true });
