/* =========================================================
   VIEW: AUDIT LOG
   One list combining:
     - alert actions  (sample data until alerts live in the database)
     - user & access changes (real, from public.audit_log; row-level
       security decides what each user may see)
   Search/filter, then export exactly what is shown to CSV or Excel.
========================================================= */
let AUDIT_ROWS = [];
let AUDIT_FILTER = {q:'', cat:'all'};

const AUDIT_ACTION_LABEL = {
  'user.created':'User created', 'user.updated':'User updated', 'user.password_reset':'Password reset',
  'user.mfa_reset':'MFA reset', 'user.enabled':'User enabled', 'user.disabled':'User disabled',
  'demo.role_switched':'Demo role switched'
};

/* Sample entries only carry a time ("23:42:05"): place them in the last 24 h. */
function sampleAuditTime(ts){
  const [h,m,s] = String(ts).split(':').map(Number);
  const d = new Date(); d.setHours(h||0, m||0, s||0, 0);
  if(d > new Date()) d.setDate(d.getDate()-1);
  return d;
}
function fmtAuditValue(v){
  if(v == null) return '';
  if(typeof v !== 'object') return String(v);
  return Object.entries(v).map(([k,x]) => `${k}: ${x}`).join(', ');
}

function sampleAuditRows(){
  return AUDIT_LOG.map(e => ({
    time: sampleAuditTime(e.ts), category:'Alert action', user:e.user, role:e.role, action:e.action,
    target: e.alertId, source:e.source, oldVal:e.oldVal, newVal:e.newVal, result:e.result,
    alertId: e.alertId !== '—' ? e.alertId : null
  }));
}

async function loadDbAuditRows(){
  if(!SB || !hasRole('team_lead','admin')) return {rows:[], error:null};
  const {data, error} = await SB.from('audit_log').select('*').order('created_at',{ascending:false}).limit(1000);
  if(error) return {rows:[], error:error.message};
  // Resolve user ids to emails where this user is allowed to see them.
  const names = {};
  const tbl = CURRENT_USER.isDemo ? 'demo_users' : 'profiles';
  const {data:people} = await SB.from(tbl).select('id,email');
  (people||[]).forEach(p => names[p.id] = p.email);
  if(CURRENT_USER) names[CURRENT_USER.id] = CURRENT_USER.email;
  return {error:null, rows:(data||[]).map(e => ({
    time: new Date(e.created_at), category:'User & access', user: e.actor_email || 'system', role:'',
    action: AUDIT_ACTION_LABEL[e.action] || e.action, target: names[e.target_id] || e.target_id || '',
    source:'Unified SOAR', oldVal: fmtAuditValue(e.old_value), newVal: fmtAuditValue(e.new_value), result:'Success', alertId:null
  }))};
}

function filteredAuditRows(){
  const q = AUDIT_FILTER.q.trim().toLowerCase();
  return AUDIT_ROWS.filter(r =>
    (AUDIT_FILTER.cat === 'all' || r.category === AUDIT_FILTER.cat) &&
    (!q || [r.user, r.role, r.action, r.target, r.source, r.oldVal, r.newVal].some(v => String(v||'').toLowerCase().includes(q))));
}

const AUDIT_COLUMNS = ['Timestamp','Category','User','Role','Action','Target','Source','Old value','New value','Result'];
function auditRowCells(r){ return [r.time, r.category, r.user, r.role, r.action, r.target, r.source, r.oldVal, r.newVal, r.result]; }

function viewAudit(){
  return `
  <div class="section-head"><h2>Audit Logs</h2><span class="hint">Record of every action taken in the platform</span></div>
  <div class="filter-bar audit-bar">
    <div class="tbl-search">${ICON.search}<input type="text" id="audit-q" placeholder="Search user, action, target, value…" value="${esc(AUDIT_FILTER.q)}"></div>
    <select id="audit-cat">
      <option value="all">All categories</option>
      <option value="Alert action" ${AUDIT_FILTER.cat==='Alert action'?'selected':''}>Alert actions</option>
      <option value="User & access" ${AUDIT_FILTER.cat==='User & access'?'selected':''}>User &amp; access</option>
    </select>
    <div style="flex:1;"></div>
    <button class="btn" id="audit-csv">${ICON.download}CSV</button>
    <button class="btn primary" id="audit-xlsx">${ICON.download}Excel</button>
  </div>
  <div class="notice" id="audit-msg" style="display:none;"></div>
  <div class="tbl-wrap">
    <table>
      <thead><tr>${AUDIT_COLUMNS.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody id="audit-body"><tr><td colspan="10" style="text-align:center;padding:26px;color:var(--text-muted);">Loading…</td></tr></tbody>
    </table>
    <div class="table-foot"><span id="audit-count"></span><span>Alert actions are sample data · user &amp; access changes are live</span></div>
  </div>`;
}

function renderAuditBody(){
  const body = document.getElementById('audit-body');
  if(!body) return;
  const rows = filteredAuditRows();
  body.innerHTML = rows.length ? rows.map(r => `
    <tr style="cursor:${r.alertId?'pointer':'default'};" ${r.alertId?`data-open-alert="${esc(r.alertId)}"`:''}>
      <td style="font-family:var(--font-mono);white-space:nowrap;">${esc(fmtDateTime(r.time))}</td>
      <td><span class="audit-cat ${r.category==='User & access'?'cat-user':'cat-alert'}">${esc(r.category)}</span></td>
      <td>${esc(r.user)}</td><td>${esc(r.role||'—')}</td><td>${esc(r.action)}</td>
      <td>${r.alertId ? `<span class="alert-id">${esc(r.alertId)}</span>` : esc(r.target||'—')}</td>
      <td>${esc(r.source)}</td>
      <td style="color:var(--text-muted);white-space:normal;">${esc(r.oldVal||'—')}</td>
      <td style="white-space:normal;">${esc(r.newVal||'—')}</td>
      <td style="color:var(--success);">● ${esc(r.result)}</td>
    </tr>`).join('') : `<tr><td colspan="10" style="text-align:center;padding:26px;color:var(--text-muted);">No entries match.</td></tr>`;
  body.querySelectorAll('[data-open-alert]').forEach(el => el.addEventListener('click', ()=> setView('alert-detail', el.getAttribute('data-open-alert'))));
  document.getElementById('audit-count').textContent = `${rows.length} of ${AUDIT_ROWS.length} entries`;
}

function exportAudit(format){
  const rows = filteredAuditRows();
  const sheets = [tableSheet('Audit log', AUDIT_COLUMNS, rows.map(auditRowCells))];
  const base = 'unified-soar_audit-log' + (AUDIT_FILTER.cat !== 'all' ? '_' + safeFileName(AUDIT_FILTER.cat) : '');
  if(format === 'xlsx') exportXLSX(base, sheets); else exportCSV(base, sheets);
}

async function initAuditView(){
  AUDIT_ROWS = sampleAuditRows().sort((a,b)=>b.time-a.time);
  renderAuditBody();
  const q = document.getElementById('audit-q'), cat = document.getElementById('audit-cat');
  q.addEventListener('input', ()=>{ AUDIT_FILTER.q = q.value; renderAuditBody(); });
  cat.addEventListener('change', ()=>{ AUDIT_FILTER.cat = cat.value; renderAuditBody(); });
  document.getElementById('audit-csv').addEventListener('click', ()=>exportAudit('csv'));
  document.getElementById('audit-xlsx').addEventListener('click', ()=>exportAudit('xlsx'));
  const {rows, error} = await loadDbAuditRows();
  if(!document.getElementById('audit-body')) return;   // user navigated away
  if(error){
    const m = document.getElementById('audit-msg');
    m.style.display = 'flex'; m.className = 'notice notice-error'; m.textContent = 'Could not load user & access log: ' + error;
  }
  AUDIT_ROWS = AUDIT_ROWS.concat(rows).sort((a,b)=>b.time-a.time);
  renderAuditBody();
}
