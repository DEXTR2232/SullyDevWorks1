/* =========================================================
   VIEW: CASES (stub)
========================================================= */
function viewCases(){
  const cases = CASES;
  return `
  <div class="section-head"><h2>Cases</h2><span class="hint">Grouped investigations spanning related alerts</span></div>
  <div class="grid" style="grid-template-columns:1fr;gap:12px;">
    ${cases.map(c=>`
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span class="alert-id" style="font-size:13px;">${c.id}</span>
          <span style="font-weight:600;font-size:13px;">${c.name}</span>
          <span class="status-pill ${c.status}">${c.status}</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text-muted);">Opened ${c.opened}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          ${c.alerts.map(id=>`<span class="mitre-tag" style="cursor:pointer;" data-open-alert="${id}">${id}</span>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:10px;border-top:1px solid var(--border);padding-top:10px;">
          ${avatar(c.owner,22)}<span style="font-size:11.5px;color:var(--text-secondary);">${c.owner.name}</span>
        </div>
      </div>`).join('')}
  </div>`;
}
