/* =========================================================
   VIEW: ALERTS TABLE (shared by Dashboard / Alerts / My Alerts)
========================================================= */
function alertsTableBlock(list, title, showFilters){
  const f = STATE.filters;
  let rows = list.filter(a=>{
    if(f.source!=='all' && a.source!==f.source) return false;
    if(f.severity!=='all' && a.severity!==f.severity) return false;
    if(f.status!=='all' && a.status!==f.status) return false;
    if(f.owner!=='all' && a.owner!==f.owner) return false;
    if(f.search){
      const s=f.search.toLowerCase();
      const hay=(a.id+' '+a.name+' '+a.host+' '+a.user+' '+a.sourceIp).toLowerCase();
      if(!hay.includes(s)) return false;
    }
    return true;
  }).sort((a,b)=>a.created-b.created);

  return `
  <div class="section-head"><h2>${title}</h2><span class="hint">${rows.length} of ${list.length} alerts shown</span></div>
  <div class="filter-bar">
    <select data-filter="source">
      <option value="all">All Sources</option>
      <option value="trend" ${f.source==='trend'?'selected':''}>Trend Micro Vision One</option>
      <option value="vectra" ${f.source==='vectra'?'selected':''}>Vectra AI NDR</option>
      <option value="logrhythm" ${f.source==='logrhythm'?'selected':''}>LogRhythm SIEM</option>
    </select>
    <select data-filter="severity">
      <option value="all">Severity: All</option>
      ${['Critical','High','Medium','Low','Informational'].map(s=>`<option value="${s}" ${f.severity===s?'selected':''}>${s}</option>`).join('')}
    </select>
    <select data-filter="status">
      <option value="all">Status: All</option>
      ${['New','Investigating','Escalated','Closed'].map(s=>`<option value="${s}" ${f.status===s?'selected':''}>${s}</option>`).join('')}
    </select>
    <select data-filter="owner">
      <option value="all">Assigned Analyst: All</option>
      ${Object.values(ANALYSTS).map(a=>`<option value="${a.id}" ${f.owner===a.id?'selected':''}>${a.name==='Unassigned'?'Unassigned':a.name}</option>`).join('')}
    </select>
    <select class="dr"><option>Date Range: Last 24h</option><option>Last 7 days</option><option>Last 30 days</option></select>
    <div class="tbl-search">${ICON.search}<input type="text" id="tbl-search-input" placeholder="Search Alert ID, Host, IP, User..." value="${f.search}"></div>
  </div>
  <div class="tbl-wrap">
    <table>
      <thead><tr>
        <th>Severity</th><th>Alert ID</th><th>Alert Name</th><th>Source</th><th>Affected Entity</th>
        <th>MITRE</th><th>Owner</th><th>Status</th><th>Created</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${rows.map(alertRow).join('') || `<tr><td colspan="10" style="text-align:center;padding:30px;color:var(--text-muted);">No alerts match the current filters.</td></tr>`}
      </tbody>
    </table>
    <div class="table-foot"><span>Showing ${rows.length} alert${rows.length===1?'':'s'}</span><span>Auto-refreshing every 15s</span></div>
  </div>`;
}

function alertRow(a){
  const owner = ANALYSTS[a.owner];
  return `
  <tr data-open-alert="${a.id}">
    <td><span class="sev ${a.severity}">${a.severity}</span></td>
    <td><span class="alert-id">${a.id}</span></td>
    <td><span class="alert-name">${a.name}</span></td>
    <td><span class="src-chip ${SRC_CLASS[a.source]}"><span class="d"></span>${fmtSrcShort(a.source)}</span></td>
    <td><span class="entity">${a.host}</span></td>
    <td><span class="mitre-tag">${a.mitreTechnique}</span></td>
    <td>
      ${a.owner==='unassigned'
        ? `<span class="owner-cell unassigned">Unassigned</span>`
        : `<span class="owner-cell"><span class="mini-av">${owner.initials}</span>${owner.name.split(' ')[0]}</span>`}
    </td>
    <td><span class="status-pill ${a.status}">${a.status}</span></td>
    <td><span class="age-cell">${ageText(a.created)}</span></td>
    <td>
      <div class="action-cell">
        <button class="mini-btn" data-quick="claim" data-id="${a.id}" title="Take Ownership">${ICON.claim}</button>
        <button class="mini-btn" data-quick="investigate" data-id="${a.id}" title="Investigate">${ICON.investigate}</button>
        <button class="mini-btn esc-a" data-quick="escalate" data-id="${a.id}" title="Escalate">${ICON.escalate}</button>
        <button class="mini-btn close-a" data-quick="close" data-id="${a.id}" title="Close">${ICON.close}</button>
      </div>
    </td>
  </tr>`;
}

/* =========================================================
   VIEW: ALERTS / MY ALERTS
========================================================= */
function viewAlerts(mineOnly){
  const list = mineOnly ? ALERTS.filter(a=>a.owner===CURRENT_USER.id) : ALERTS;
  return alertsTableBlock(list, mineOnly ? 'My Alerts' : 'Active Security Alerts', true);
}
