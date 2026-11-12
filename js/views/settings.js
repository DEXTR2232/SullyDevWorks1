/* =========================================================
   VIEW: SETTINGS
========================================================= */
function viewSettings(){
  return `
  <div class="section-head"><h2>Settings</h2><span class="hint">Roles, users, and platform configuration</span></div>

  <div class="section-head" style="margin-top:4px;"><h2 style="font-size:13px;">User Roles &amp; Permissions</h2></div>
  <div class="perm-grid" style="margin-bottom:24px;">
    <div class="card perm-card">
      <h3>SOC Analyst</h3>
      <ul>
        <li>${ICON.check}View alerts</li><li>${ICON.check}Take ownership</li><li>${ICON.check}Investigate</li>
        <li>${ICON.check}Add notes</li><li>${ICON.check}Escalate</li><li>${ICON.check}Close alerts</li>
        <li>${ICON.check}Download reports (own performance only)</li>
      </ul>
    </div>
    <div class="card perm-card">
      <h3>Team Leader</h3>
      <ul>
        <li>${ICON.check}All analyst permissions</li><li>${ICON.check}Reassign alerts</li>
        <li>${ICON.check}View team workload</li><li>${ICON.check}View analyst performance</li><li>${ICON.check}Team reports & audit export</li>
      </ul>
    </div>
    <div class="card perm-card">
      <h3>Administrator</h3>
      <ul>
        <li>${ICON.check}All permissions</li><li>${ICON.check}Manage integrations</li><li>${ICON.check}Manage users</li>
        <li>${ICON.check}Manage severity rules</li><li>${ICON.check}Manage system settings</li><li>${ICON.check}View complete audit logs</li>
      </ul>
    </div>
  </div>

  <div class="two-col">
    <div class="card">
      <div style="font-size:12.5px;font-weight:600;margin-bottom:12px;">Team Members</div>
      <div class="stub-list">
        ${Object.values(ANALYSTS).filter(a=>a.id!=='unassigned').map(a=>`
          <div class="row">${avatar(a,30)}<div style="flex:1;"><div style="font-size:12.5px;font-weight:500;">${esc(a.name)}</div><div style="font-size:10.5px;color:var(--text-muted);">${esc(a.role)}</div></div><span class="status-pill Closed">Active</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div style="font-size:12.5px;font-weight:600;margin-bottom:12px;">Severity Rules</div>
      <div class="stub-list">
        <div class="row"><span class="mitre-tag">T1486</span><span style="flex:1;font-size:12px;">Data Encrypted for Impact</span><span class="sev Critical">Critical</span></div>
        <div class="row"><span class="mitre-tag">T1071</span><span style="flex:1;font-size:12px;">Command and Control (App Layer)</span><span class="sev Critical">Critical</span></div>
        <div class="row"><span class="mitre-tag">T1110</span><span style="flex:1;font-size:12px;">Brute Force</span><span class="sev Medium">Medium</span></div>
        <div class="row"><span class="mitre-tag">T1046</span><span style="flex:1;font-size:12px;">Network Service Discovery</span><span class="sev Low">Low</span></div>
      </div>
    </div>
  </div>`;
}
