/* =========================================================
   VIEW: THREAT INTELLIGENCE (stub)
========================================================= */
function viewIntel(){
  const iocs = IOCS;
  return `
  <div class="section-head"><h2>Threat Intelligence</h2><span class="hint">Indicators observed across active alerts</span></div>
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>Indicator</th><th>Type</th><th>Reputation</th><th>Sources</th><th>Associated Campaign</th></tr></thead>
      <tbody>
        ${iocs.map(i=>`
          <tr style="cursor:default;">
            <td class="mono" style="font-family:var(--font-mono);">${i.ioc}</td>
            <td>${i.type}</td>
            <td><span class="status-pill ${i.rep==='Malicious'?'Escalated':i.rep==='Suspicious'?'Investigating':'New'}">${i.rep}</span></td>
            <td>${i.src}</td>
            <td>${i.tag}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}
