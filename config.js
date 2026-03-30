// ╔══════════════════════════════════════════════════════════════╗
// ║  config.js — Xu Lab Management System                       ║
// ║  All lab-specific settings live here.                       ║
// ║  This is the ONLY file you need to edit for most changes.   ║
// ╚══════════════════════════════════════════════════════════════╝

// ── Lab Identity ──────────────────────────────────────────────────────────────
const LAB_NAME     = 'Xu Lab · Management System';
const LAB_SUB      = 'MIBAM UMN';
const LAB_PASSWORD = 'xulab2024';

// ── Supabase Connection ───────────────────────────────────────────────────────
const SB_URL = 'https://cmadqjpqfsmgpohawzkz.supabase.co';
const SB_KEY = 'sb_publishable_lUfLjrtk1n_fHIoTLkjj2w_yMwI-6T-';

// ── Quick Access Links ────────────────────────────────────────────────────────
// To add a link: copy one block and change the values.
// To remove a link: delete the block.
const QUICK_LINKS = [
  {
    label: 'Chematix · Chemical Waste Portal',
    url:   'https://www.dehs-tools.umn.edu/Chematix/Login',
    icon:  '☣️',
    bg:    '#FFF1EE',
  },
  {
    label: 'Histology Lab · Appointment Booking',
    url:   'https://calendar.google.com/calendar/u/0/appointments/AcZssZ2-SlfrJgHAbLX_IEAa6VxXfielAIl1BbRgCy4=',
    icon:  '🔬',
    bg:    '#EEF4FF',
  },
  {
    label: 'iLab · Core Facilities',
    url:   'https://umn.corefacilities.org/account/login',
    icon:  '🧪',
    bg:    '#F0FBF0',
  },
  {
    label: 'Flow Cytometry · Instrument Sign-Ups',
    url:   'https://ufcr.umn.edu/instrument_sign_ups',
    icon:  '🌊',
    bg:    '#F5F0FF',
  },
];

// ── Team Moments Types ────────────────────────────────────────────────────────
// To add a type: copy one block and add the matching filter button in index.html.
// To remove a type: delete the block and remove its filter button in index.html.
const MOMENT_TYPES = {
  celebration: { label: 'Celebration', icon: '🎉', bg: '#FFF1EE',    color: '#C0392B' },
  milestone:   { label: 'Milestone',   icon: '🏆', bg: '#E8C54722',  color: '#7A5200' },
  memory:      { label: 'Memory',      icon: '📸', bg: '#EEF4FF',    color: '#1A4E8C' },
  note:        { label: 'Note',        icon: '📝', bg: '#F0EBE2',    color: '#5C4D3C' },
};

// ── To-Do Priority Levels ─────────────────────────────────────────────────────
const PRIO_COLOR = { high: '#FF7E5F', medium: '#E8C547', low: '#6BCB77' };
const PRIO_LABEL = { high: 'Urgent',  medium: 'Medium',  low: 'Low'    };

// ── Freezer Layout ────────────────────────────────────────────────────────────
// Change these if your freezer has a different number of layers/drawers/slots.
const FREEZER_LAYERS  = 3;
const FREEZER_DRAWERS = 6;
const FREEZER_ROWS    = 7;
const FREEZER_COLS    = 4;

// ── Navigation Tabs ───────────────────────────────────────────────────────────
// Order here controls the order they appear. Must match id="tab-X" in index.html.
const TABS = ['overview', 'members', 'meetings', 'todos', 'logs', 'mice', 'waste', 'freezer', 'trash'];
