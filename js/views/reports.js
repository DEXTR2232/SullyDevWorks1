/* =========================================================
   VIEW: REPORTS (stub)
========================================================= */
function viewReports(){
  const reports = REPORTS;
  return `
  <div class="section-head"><h2>Reports</h2><span class="hint">Scheduled and on-demand SOC reporting</span></div>
  <div class="grid" style="grid-template-columns:repeat(2,1fr);">
    ${reports.map(r=>`
      <div class="card">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div class="int-icon" style="flex:0 0 34px;">${ICON.reports}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">${r.name}</div>
            <div style="font-size:11.5px;color:var(--text-secondary);margin-top:4px;line-height:1.5;">${r.desc}</div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:10px;">${r.updated}</div>
          </div>
          <button class="btn ghost">Export</button>
        </div>
      </div>`).join('')}
  </div>`;
}
