/* =========================================================
   VIEW: INTEGRATIONS
========================================================= */
function viewIntegrations(){
  return `
  <div class="section-head"><h2>Integrations</h2><span class="hint">Connected security platforms feeding this console</span></div>
  <div class="grid" style="grid-template-columns:repeat(3,1fr);">
    ${INTEGRATIONS.map(i=>`
      <div class="card">
        <div class="int-top" style="margin-bottom:14px;">
          <div class="int-icon" style="width:38px;height:38px;flex:0 0 38px;">${ICON[i.icon]}</div>
          <div><div class="int-name" style="font-size:13.5px;">${i.name}</div><div class="int-type">${i.type}</div></div>
        </div>
        <div class="info-grid" style="grid-template-columns:1fr 1fr;gap:12px 16px;">
          <div class="info-item"><div class="i-label">Connection Status</div><div class="i-val" style="color:var(--success);">● ${i.status}</div></div>
          <div class="info-item"><div class="i-label">API Status</div><div class="i-val" style="color:${i.apiStatus==='Healthy'?'var(--success)':'var(--medium)'};">● ${i.apiStatus}</div></div>
          <div class="info-item"><div class="i-label">Last Successful Sync</div><div class="i-val">${i.lastSync}</div></div>
          <div class="info-item"><div class="i-label">Last Failed Sync</div><div class="i-val">${i.lastFail}</div></div>
          <div class="info-item"><div class="i-label">Alerts Received Today</div><div class="i-val mono">${i.alertsToday}</div></div>
          <div class="info-item"><div class="i-label">API Latency</div><div class="i-val mono">${i.latency}</div></div>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:11px;color:var(--text-muted);">Integration Health</span>
          <span class="status-pill ${i.health==='Healthy'?'Closed':'Investigating'}">${i.health}</span>
        </div>
      </div>`).join('')}
  </div>`;
}
