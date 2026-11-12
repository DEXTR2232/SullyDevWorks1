/* =========================================================
   VIEW: REPORTS
   Five reports, each with a mini view (headline numbers, mini chart,
   preview table) and export to CSV or Excel. Built by reports-engine.js.
========================================================= */
const REPORT_ORDER = ['daily','weekly','monthly','integrations','analysts'];

function viewReports(){
  const now = new Date();
  const reports = REPORT_ORDER.map(k => REPORT_BUILDERS[k](now));
  return `
  <div class="section-head"><h2>Reports</h2><span class="hint">Generated live · export any report as CSV or Excel</span></div>
  <div class="notice notice-sample">${ICON.info}<div><b>Proof-of-concept data.</b> Reports combine the live alert list with a 30-day sample history. They'll switch to real alerts automatically once alerts are stored in the database.</div></div>
  <div class="report-grid">
    ${reports.map(reportCard).join('')}
  </div>`;
}

function reportCard(r){
  const max = Math.max(1, ...(r.spark||[]).map(s => s.value));
  return `
  <div class="card report-card" data-report="${r.key}">
    <div class="rc-head">
      <div class="int-icon" style="flex:0 0 34px;">${ICON.reports}</div>
      <div style="flex:1;min-width:0;">
        <div class="rc-title">${esc(r.title)}</div>
        <div class="rc-desc">${esc(r.desc)}</div>
        <div class="rc-period">${esc(r.periodText)}</div>
      </div>
    </div>
    <div class="rc-kpis">
      ${r.kpis.slice(0,4).map(k => `<div class="rc-kpi"><div class="v">${esc(k[1])}</div><div class="l">${esc(k[0])}</div></div>`).join('')}
    </div>
    ${r.spark && r.spark.length ? `<div class="rc-spark" title="${esc(r.title)} trend">
      ${r.spark.map(s => `<div class="bar" style="height:${Math.max(3, Math.round(s.value/max*100))}%" title="${esc(s.label)}: ${s.value}"></div>`).join('')}
    </div>` : ''}
    <table class="rc-table">
      <thead><tr>${r.preview.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${r.preview.rows.slice(0,7).map(row => `<tr>${row.map(c => `<td>${esc(c==null?'—':c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="rc-foot">
      <span>${r.sections.length} section${r.sections.length>1?'s':''} · ${r.sections.reduce((n,s)=>n+s.rows.length,0)} rows in export</span>
      <div class="rc-actions">
        <button class="btn" data-export="${r.key}" data-fmt="csv">${ICON.download}CSV</button>
        <button class="btn primary" data-export="${r.key}" data-fmt="xlsx">${ICON.download}Excel</button>
      </div>
    </div>
  </div>`;
}

function initReportsView(){
  document.querySelectorAll('[data-export]').forEach(b => b.addEventListener('click', ()=>{
    exportReport(b.dataset.export, b.dataset.fmt);
  }));
}
