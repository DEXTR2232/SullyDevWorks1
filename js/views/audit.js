/* =========================================================
   VIEW: AUDIT LOG
========================================================= */
function viewAudit(){
  return `
  <div class="section-head"><h2>Audit Logs</h2><span class="hint">Immutable record of every action taken in the platform</span></div>
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Alert ID</th><th>Source</th><th>Old Value</th><th>New Value</th><th>Result</th></tr></thead>
      <tbody>
        ${AUDIT_LOG.slice().reverse().map(e=>`
          <tr style="cursor:${e.alertId!=='—'?'pointer':'default'};" ${e.alertId!=='—'?`data-open-alert="${e.alertId}"`:''}>
            <td style="font-family:var(--font-mono);">${e.ts}</td>
            <td>${e.user}</td><td>${e.role}</td><td>${e.action}</td>
            <td>${e.alertId!=='—'?`<span class="alert-id">${e.alertId}</span>`:'—'}</td>
            <td>${e.source}</td>
            <td style="color:var(--text-muted);">${e.oldVal}</td>
            <td>${e.newVal}</td>
            <td style="color:var(--success);">● ${e.result}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div class="table-foot"><span>${AUDIT_LOG.length} entries · Last 24 hours</span><span>Logs retained for 400 days</span></div>
  </div>`;
}
