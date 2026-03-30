// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/db.js — Supabase database helpers                  ║
// ║  All database read/write/delete logic lives here.           ║
// ║  Modules call sbGet / sbInsert / sbUpdate / sbDelete.       ║
// ╚══════════════════════════════════════════════════════════════╝

let sb = null;

function initSB() {
  try {
    sb = supabase.createClient(SB_URL, SB_KEY);
    return true;
  } catch (e) {
    console.error('Supabase init failed', e);
    return false;
  }
}

async function sbGet(tbl, opts = {}) {
  if (!sb) return [];
  let q = sb.from(tbl).select('*');
  if (opts.order) q = q.order(opts.order, { ascending: opts.asc ?? false });
  const { data, error } = await q;
  if (error) { console.error('sbGet', tbl, error); return []; }
  return data || [];
}

async function sbInsert(tbl, row) {
  if (!sb) return false;
  const { error } = await sb.from(tbl).insert(row);
  if (error) { console.error('sbInsert', tbl, error); return false; }
  return true;
}

async function sbUpdate(tbl, id, upd) {
  if (!sb) return false;
  const { error } = await sb.from(tbl).update(upd).eq('id', id);
  if (error) { console.error('sbUpdate', tbl, error); return false; }
  return true;
}

async function sbDelete(tbl, id) {
  if (!sb) return false;
  const { error } = await sb.from(tbl).delete().eq('id', id);
  if (error) { console.error('sbDelete', tbl, error); return false; }
  return true;
}
