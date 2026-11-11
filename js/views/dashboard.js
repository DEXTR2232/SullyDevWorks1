/* =========================================================
   VIEW: DASHBOARD
========================================================= */
function viewDashboard(){
  const critical = ALERTS.filter(a=>a.severity==='Critical' && a.status!=='Closed').length;
  const high = ALERTS.filter(a=>a.severity==='High' && a.status!=='Closed').length;
  const unassigned = ALERTS.filter(a=>a.owner==='unassigned' && a.status!=='Closed').length;
  const mine = ALERTS.filter(a=>a.owner===CURRENT_USER.id && a.status!=='Closed').length;
  const total = 127, closedToday = 48;

  return `
  <div class="grid kpi-row">
    <div class="kpi"><div class="k-label">${ICON.alerts}Total Active Alerts</div><div class="k-val">${total}</div></div>
    <div class="kpi c-crit"><div class="k-label">${ICON.escalate}Critical</div><div class="k-val">8</div></div>
    <div class="kpi c-high"><div class="k-label">${ICON.escalate}High</div><div class="k-val">34</div></div>
    <div class="kpi c-un"><div class="k-label">${ICON.my}Unassigned</div><div class="k-val">21</div></div>
    <div class="kpi c-mine"><div class="k-label">${ICON.claim}My Alerts</div><div class="k-val">${mine||7}</div></div>
    <div class="kpi c-closed"><div class="k-label">${ICON.close}Closed Today</div><div class="k-val">${closedToday}</div></div>
  </div>

  <div class="section-head"><h2>Alert Source Overview</h2><span class="hint">Integrated security platforms</span></div>
  <div class="grid int-row">
    ${INTEGRATIONS.map(intCard).join('')}
  </div>

  ${alertsTableBlock(ALERTS, 'Active Security Alerts', false)}
  `;
}

function intCard(i){
  const degraded = i.apiStatus==='Degraded';
  return `
  <div class="int-card">
    <div class="int-top">
      <div class="int-icon">${ICON[i.icon]}</div>
      <div>
        <div class="int-name">${i.name}</div>
        <div class="int-type">${i.type}</div>
      </div>
      <div class="int-status ${degraded?'deg':''}"><span class="d"></span>${i.status}</div>
    </div>
    <div class="int-stats">
      <div>Last Sync<span class="v" style="font-size:12px;">${i.lastSync}</span></div>
      <div>Active Alerts<span class="v">${i.alertsToday}</span></div>
      <div>Latency<span class="v" style="font-size:12px;">${i.latency}</span></div>
    </div>
  </div>`;
}
