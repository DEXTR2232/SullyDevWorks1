/* =========================================================
   VIEW: REPORTS
   A custom-period report on top, then five standard reports. Each has
   a mini view (headline numbers, mini chart, preview table) and export
   to CSV or Excel. Built by reports-engine.js. Open to every role;
   analysts only see their own figures in analyst performance.
========================================================= */
const REPORT_ORDER = ['daily','weekly','monthly','integrations','analysts'];
const CUSTOM_REPORT = {kind:'soc', from:null, to:null};   // dates as 'YYYY-MM-DD'

function isoDay(d){ return fmtDateTime(d).slice(0,10); }
function customRange(){
  const from = new Date(CUSTOM_REPORT.from + 'T00:00:00');
  let to = new Date(CUSTOM_REPORT.to + 'T23:59:59.999');
  if(to > new Date()) to = new Date();
  return {kind: CUSTOM_REPORT.kind, from, to};
}
function customError(){
  if(!CUSTOM_REPORT.from || !CUSTOM_REPORT.to) return 'Pick a start and end date.';
  const {from, to} = customRange();
  if(isNaN(from) || isNaN(to)) return 'Those dates are not valid.';
  if(from > new Date()) return 'The start date is in the future.';
  if(from > to) return 'The start date is after the end date.';
  return '';
}

function viewReports(){
  const now = new Date();
  if(!CUSTOM_REPORT.from){
    const f = new Date(now); f.setDate(f.getDate() - 6);
    CUSTOM_REPORT.from = isoDay(f); CUSTOM_REPORT.to = isoDay(now);
  }
  const reports = REPORT_ORDER.map(k => REPORT_BUILDERS[k](now));
  return `
  <div class="section-head"><h2>Reports</h2><span class="hint">Generated live · export any report as CSV or Excel</span></div>
  <div class="notice notice-sample">${ICON.info}<div><b>Proof-of-concept data.</b> Reports combine the live alert list with a 30-day sample history. They'll switch to real alerts automatically once alerts are stored in the database.</div></div>
  ${customPanel()}
  <div class="report-grid">
    ${reports.map(r => reportCard(r)).join('')}
  </div>`;
}

function customPanel(){
  const err = customError();
  const minDay = isoDay(reportDataStart()), today = isoDay(new Date());
  return `
  <div class="card custom-report" id="custom-report">
    <div class="cr-form">
      <div class="cr-title"><div class="int-icon" style="flex:0 0 34px;">${ICON.reports}</div>
        <div><div class="rc-title">Custom period</div><div class="rc-desc">Pick a report and any date range, preview it, then download.</div></div></div>
      <label>Report
        <select id="cr-kind">
          <option value="soc" ${CUSTOM_REPORT.kind==='soc'?'selected':''}>SOC activity</option>
          <option value="analysts" ${CUSTOM_REPORT.kind==='analysts'?'selected':''}>${hasRole('team_lead','admin') ? 'Analyst performance' : 'My performance'}</option>
        </select></label>
      <label>From <input type="date" id="cr-from" value="${CUSTOM_REPORT.from}" min="${minDay}" max="${today}"></label>
      <label>To <input type="date" id="cr-to" value="${CUSTOM_REPORT.to}" min="${minDay}" max="${today}"></label>
      <div class="cr-presets">
        ${[['Today',0],['Last 7 days',6],['Last 14 days',13],['Last 30 days',29]].map(([l,d]) => `<button class="btn sm" data-cr-preset="${d}">${l}</button>`).join('')}
      </div>
    </div>
    <div id="cr-result">${err ? `<div class="cr-error">${esc(err)}</div>` : reportCard(buildCustomReport(customRange()), true)}</div>
  </div>`;
}

function reportCard(r, embedded){
  const max = Math.max(1, ...(r.spark||[]).map(s => s.value));
  const head = embedded ? `<div class="rc-head"><div style="flex:1;min-width:0;">
        <div class="rc-title">${esc(r.title)}</div><div class="rc-period">${esc(r.periodText)}</div></div></div>` : `
    <div class="rc-head">
      <div class="int-icon" style="flex:0 0 34px;">${ICON.reports}</div>
      <div style="flex:1;min-width:0;">
        <div class="rc-title">${esc(r.title)}</div>
        <div class="rc-desc">${esc(r.desc)}</div>
        <div class="rc-period">${esc(r.periodText)}</div>
      </div>
    </div>`;
  return `
  <div class="${embedded ? 'report-card embedded' : 'card report-card'}" data-report="${r.key}">
    ${head}
    <div class="rc-kpis">
      ${r.kpis.slice(0,6).map(k => `<div class="rc-kpi"><div class="v">${esc(k[1])}</div><div class="l">${esc(k[0])}</div></div>`).join('')}
    </div>
    ${r.spark && r.spark.length ? `<div class="rc-spark" title="${esc(r.title)} trend">
      ${r.spark.map(s => `<div class="bar" style="height:${Math.max(3, Math.round(s.value/max*100))}%" title="${esc(s.label)}: ${s.value}"></div>`).join('')}
    </div>` : ''}
    <table class="rc-table">
      <thead><tr>${r.preview.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${r.preview.rows.length ? r.preview.rows.slice(0, embedded ? 10 : 7).map(row => `<tr>${row.map(c => `<td>${esc(c==null?'—':c)}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${r.preview.columns.length}" class="rc-empty">No alerts in this period.</td></tr>`}</tbody>
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

function refreshCustomReport(){
  const err = customError();
  document.getElementById('cr-result').innerHTML = err ? `<div class="cr-error">${esc(err)}</div>` : reportCard(buildCustomReport(customRange()), true);
}

function initReportsView(){
  // Listeners go on elements that are rebuilt with the view, so they never stack up.
  const onClick = e => {
    const b = e.target.closest('[data-export]');
    if(b){ exportReport(b.dataset.export, b.dataset.fmt, b.dataset.export === 'custom' ? customRange() : undefined); return; }
    const p = e.target.closest('[data-cr-preset]');
    if(p){
      const now = new Date(), f = new Date(now); f.setDate(f.getDate() - Number(p.dataset.crPreset));
      CUSTOM_REPORT.from = isoDay(f); CUSTOM_REPORT.to = isoDay(now);
      document.getElementById('cr-from').value = CUSTOM_REPORT.from;
      document.getElementById('cr-to').value = CUSTOM_REPORT.to;
      refreshCustomReport();
    }
  };
  document.getElementById('custom-report').addEventListener('click', onClick);
  document.querySelector('.report-grid').addEventListener('click', onClick);
  const on = (id, key) => document.getElementById(id).addEventListener('change', e => { CUSTOM_REPORT[key] = e.target.value; refreshCustomReport(); });
  on('cr-kind','kind'); on('cr-from','from'); on('cr-to','to');
}
