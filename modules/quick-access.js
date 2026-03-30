// ╔══════════════════════════════════════════════════════════════╗
// ║  modules/quick-access.js — Quick Access tab                 ║
// ║  Links are configured in config.js → QUICK_LINKS            ║
// ╚══════════════════════════════════════════════════════════════╝

function renderWaste() {
  const container = $('quick-access-links');
  if (!container) return;

  container.innerHTML = QUICK_LINKS.map(link => `
    <a class="qa-card" href="${link.url}" target="_blank" rel="noopener noreferrer">
      <div class="qa-icon" style="background:${link.bg}">${link.icon}</div>
      <div>
        <div style="font-weight:700;font-size:15px;color:#1A1410;margin-bottom:3px">${link.label}</div>
        <div style="font-size:12px;color:#8C7B6B">${new URL(link.url).hostname}</div>
      </div>
      <div style="margin-left:auto;color:#8C7B6B;font-size:20px">↗</div>
    </a>`).join('');
}
