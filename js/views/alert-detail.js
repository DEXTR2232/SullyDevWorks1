/* =========================================================
   VIEW: ALERT DETAIL
========================================================= */
function viewAlertDetail(){
  const a = getAlert(STATE.selectedAlertId);
  if(!a) return `<p>Alert not found.</p>`;
  const owner = ANALYSTS[a.owner];
  const tabs = ['overview','investigation','timeline','evidence','intel','related','source','audit'];
  const tabLabels = {overview:'Overview',investigation:'Investigation',timeline:'Timeline',evidence:'Evidence',intel:'Threat Intelligence',related:'Related Alerts',source:'Source Details',audit:'Audit History'};

  return `
  <a class="back-link" data-back-to-alerts>${ICON.back}Back to alerts</a>
  <div class="detail-header">
    <div class="dh-top">
      <div class="dh-left">
        <div class="dh-id">${a.id}</div>
        <h1>${a.name}</h1>
        <div class="dh-meta">
          <div class="m-item"><div class="m-label">Severity</div><div class="m-val"><span class="sev ${a.severity}">${a.severity}</span></div></div>
          <div class="m-item"><div class="m-label">Source</div><div class="m-val"><span class="src-chip ${SRC_CLASS[a.source]}"><span class="d"></span>${fmtSrcShort(a.source)}</span></div></div>
          <div class="m-item"><div class="m-label">Source Alert ID</div><div class="m-val" style="font-family:var(--font-mono);">${a.sourceAlertId}</div></div>
          <div class="m-item"><div class="m-label">Status</div><div class="m-val"><span class="status-pill ${a.status}">${a.status}</span></div></div>
          <div class="m-item"><div class="m-label">Assigned To</div><div class="m-val">${a.owner==='unassigned'?'Unassigned':esc(owner.name)}</div></div>
        </div>
      </div>
      <div class="dh-actions">
        <button class="btn primary" data-act="claim">${ICON.claim}Take Ownership</button>
        ${hasRole('team_lead','admin')?`<button class="btn" data-act="reassign">${ICON.assign}Reassign</button>`:''}
        <button class="btn danger" data-act="escalate">${ICON.escalate}Escalate</button>
        <button class="btn" data-act="gotonote">${ICON.note}Add Note</button>
        <button class="btn success" data-act="closealert">${ICON.close}Close Alert</button>
      </div>
    </div>
    <div class="sync-row">
      <div class="sync-chip"><div class="s-label">${fmtSrcShort(a.source)} Status</div><div class="s-val"><span class="d" style="background:${a.status==='Closed'?'var(--success)':'var(--medium)'}"></span>${a.sourceStatus.split('→')[0]}</div></div>
      <div class="sync-chip"><div class="s-label">SOAR Status</div><div class="s-val"><span class="d" style="background:var(--accent)"></span>${a.status}</div></div>
      <div class="sync-chip"><div class="s-label">Sync Status</div><div class="s-val"><span class="d" style="background:var(--success)"></span>${a.syncStatus}</div></div>
    </div>
  </div>

  <div class="tabs">
    ${tabs.map(t=>`<div class="tab-btn ${STATE.tab===t?'active':''}" data-tab="${t}">${tabLabels[t]}</div>`).join('')}
  </div>

  <div id="tab-content">${renderAlertTab(a)}</div>
  `;
}

function renderAlertTab(a){
  switch(STATE.tab){
    case 'overview': return tabOverview(a);
    case 'investigation': return tabInvestigation(a);
    case 'timeline': return tabTimeline(a);
    case 'evidence': return tabEvidence(a);
    case 'intel': return tabIntel(a);
    case 'related': return tabRelated(a);
    case 'source': return tabSource(a);
    case 'audit': return tabAudit(a);
    default: return tabOverview(a);
  }
}

function tabOverview(a){
  return `
  <div class="detail-grid">
    <div class="card">
      <div class="desc-block">${a.description}</div>
      <div class="info-grid">
        <div class="info-item"><div class="i-label">Alert Name</div><div class="i-val">${a.name}</div></div>
        <div class="info-item"><div class="i-label">Source Product</div><div class="i-val">${fmtSrcShort(a.source)}</div></div>
        <div class="info-item"><div class="i-label">Source Alert ID</div><div class="i-val mono">${a.sourceAlertId}</div></div>
        <div class="info-item"><div class="i-label">Detection Time</div><div class="i-val">Today, ${a.timeline[0]?a.timeline[0].time:'--:--'}</div></div>
        <div class="info-item"><div class="i-label">Affected Host</div><div class="i-val mono">${a.host}</div></div>
        <div class="info-item"><div class="i-label">User</div><div class="i-val mono">${a.user}</div></div>
        <div class="info-item"><div class="i-label">Source IP</div><div class="i-val mono">${a.sourceIp}</div></div>
        <div class="info-item"><div class="i-label">Destination IP</div><div class="i-val mono">${a.destIp}</div></div>
        <div class="info-item"><div class="i-label">Domain</div><div class="i-val mono">${a.domain}</div></div>
        <div class="info-item"><div class="i-label">MITRE ATT&amp;CK Technique</div><div class="i-val"><span class="mitre-tag">${a.mitreTechnique}</span> ${a.mitreDesc}</div></div>
        <div class="info-item"><div class="i-label">MITRE Tactic</div><div class="i-val">${a.mitreTacTag}</div></div>
        <div class="info-item"><div class="i-label">Severity</div><div class="i-val"><span class="sev ${a.severity}">${a.severity}</span></div></div>
        <div class="info-item"><div class="i-label">Confidence</div><div class="i-val">${a.confidence}</div></div>
      </div>
    </div>
    <div class="card">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;text-align:center;margin-bottom:4px;font-weight:600;">Risk Score</div>
      ${riskGauge(a.riskScore)}
      <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:12px;display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-secondary);">
        <span>Confidence</span><b style="color:var(--text-primary)">${a.confidence}</b>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-secondary);margin-top:6px;">
        <span>Open for</span><b style="color:var(--text-primary)">${ageText(a.created)}</b>
      </div>
    </div>
  </div>`;
}

function tabInvestigation(a){
  return `
  <div class="detail-grid">
    <div class="card">
      <div class="section-head" style="margin-bottom:12px;"><h2 style="font-size:13px;">Analyst Notes</h2></div>
      ${a.notes.length ? a.notes.map(n=>`
        <div class="note-card">
          <div class="note-head">${avatar(analystByName(n.author),24)}<span class="n-name">${esc(n.author)}</span><span class="n-time">${esc(n.time)}</span></div>
          <div class="note-body">${esc(n.text)}</div>
        </div>`).join('') : `<div class="empty-tab">${ICON.note}<div>No investigation notes yet.</div></div>`}
      <div class="note-add" style="margin-top:14px;">
        <textarea id="note-input" placeholder="Add an investigation note. Use @name to mention a teammate..."></textarea>
        <div class="note-add-foot">
          <span class="note-hint">Attach evidence and mention teammates with @</span>
          <button class="btn primary" data-act="addnote">${ICON.note}Add Note</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div style="font-size:12px;font-weight:600;margin-bottom:10px;">Investigation Checklist</div>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:9px;">
        <li style="display:flex;gap:8px;font-size:12px;color:var(--text-secondary);"><span style="color:var(--success)">${ICON.check}</span>Alert triaged and severity confirmed</li>
        <li style="display:flex;gap:8px;font-size:12px;color:var(--text-secondary);"><span style="color:${a.status!=='New'?'var(--success)':'var(--text-muted)'}">${ICON.check}</span>Ownership assigned</li>
        <li style="display:flex;gap:8px;font-size:12px;color:var(--text-secondary);"><span style="color:${a.notes.length?'var(--success)':'var(--text-muted)'}">${ICON.check}</span>Indicators enriched with threat intel</li>
        <li style="display:flex;gap:8px;font-size:12px;color:var(--text-secondary);"><span style="color:${a.status==='Closed'?'var(--success)':'var(--text-muted)'}">${ICON.check}</span>Root cause documented and alert closed</li>
      </ul>
    </div>
  </div>`;
}

function analystByName(name){
  return Object.values(ANALYSTS).find(a=>a.name===name) || {initials:'??'};
}

function tabTimeline(a){
  return `
  <div class="card" style="max-width:640px;">
    <div class="timeline">
      ${a.timeline.map(t=>`
        <div class="t-item">
          <div class="t-time">${esc(t.time)} — ${esc(t.actor)}</div>
          <div class="t-text">${esc(t.text)}</div>
          ${t.quote?`<div class="t-quote">"${esc(t.quote)}"</div>`:''}
        </div>`).join('')}
    </div>
  </div>`;
}

function tabEvidence(a){
  const items = a.severity==='Critical' || a.severity==='High' ? [
    {name:'network_capture_'+a.host.toLowerCase()+'.pcap', size:'4.2 MB', by:'System'},
    {name:'memory_snapshot_'+a.host.toLowerCase()+'.dmp', size:'812 MB', by:ANALYSTS[a.owner]?ANALYSTS[a.owner].name.split(' ')[0]:'System'},
    {name:'ioc_indicators.csv', size:'6 KB', by:'System'},
  ] : [];
  return `
  <div class="card">
    ${items.length ? `<div class="stub-list">${items.map(f=>`
      <div class="row"><div class="int-icon" style="width:30px;height:30px;flex:0 0 30px;">${ICON.file}</div>
      <div style="flex:1;"><div style="font-size:12.5px;font-weight:500;font-family:var(--font-mono);">${f.name}</div><div style="font-size:10.5px;color:var(--text-muted);">Added by ${f.by}</div></div>
      <div style="font-size:11px;color:var(--text-muted);">${f.size}</div></div>`).join('')}</div>`
      : `<div class="empty-tab">${ICON.empty}<div>No evidence attached to this alert yet.</div></div>`}
  </div>`;
}

function tabIntel(a){
  if(a.domain==='—' && a.destIp==='—') return `<div class="card"><div class="empty-tab">${ICON.intel}<div>No external indicators to enrich for this alert.</div></div></div>`;
  return `
  <div class="card">
    <div class="info-grid">
      <div class="info-item"><div class="i-label">Destination IP Reputation</div><div class="i-val">${a.severity==='Critical'?'Malicious':'Unknown'} · ${a.severity==='Critical'?'96/100':'40/100'}</div></div>
      <div class="info-item"><div class="i-label">Domain Reputation</div><div class="i-val">${a.domain!=='—'?(a.severity==='Critical'?'Known malicious infrastructure':'No prior reputation data'):'—'}</div></div>
      <div class="info-item"><div class="i-label">Associated Campaign</div><div class="i-val">${a.severity==='Critical'?'Tracked C2 cluster — "Silent Ferry"':'None identified'}</div></div>
      <div class="info-item"><div class="i-label">First Seen (Global)</div><div class="i-val">${a.severity==='Critical'?'11 days ago':'—'}</div></div>
    </div>
  </div>`;
}

function tabRelated(a){
  const related = ALERTS.filter(r=>r.id!==a.id && (r.host===a.host || r.destIp===a.destIp && a.destIp!=='—' || r.user===a.user)).slice(0,5);
  return `
  <div class="card">
    ${related.length ? related.map(r=>`
      <div class="related-row" data-open-alert="${r.id}" style="cursor:pointer;">
        <span class="sev ${r.severity}">${r.severity}</span>
        <span class="alert-id">${r.id}</span>
        <span style="flex:1;font-size:12.5px;">${r.name}</span>
        <span class="entity">${r.host}</span>
        <span class="status-pill ${r.status}">${r.status}</span>
      </div>`).join('') : `<div class="empty-tab">${ICON.link}<div>No related alerts found for this host, user, or destination.</div></div>`}
  </div>`;
}

function tabSource(a){
  return `
  <div class="card" style="max-width:520px;">
    <div class="info-grid">
      <div class="info-item"><div class="i-label">Source Platform</div><div class="i-val">${fmtSrcShort(a.source)}</div></div>
      <div class="info-item"><div class="i-label">Source Detection ID</div><div class="i-val mono">${a.sourceAlertId}</div></div>
      <div class="info-item"><div class="i-label">Source Status</div><div class="i-val">${a.status==='Closed'?'Closed':'Open'}</div></div>
      <div class="info-item"><div class="i-label">SOAR Status</div><div class="i-val"><span class="status-pill ${a.status}">${a.status}</span></div></div>
      <div class="info-item"><div class="i-label">Last Synchronization</div><div class="i-val">${a.lastSync}</div></div>
      <div class="info-item"><div class="i-label">Synchronization</div><div class="i-val" style="color:var(--success);">● Successful</div></div>
    </div>
  </div>`;
}

function tabAudit(a){
  const entries = AUDIT_LOG.filter(e=>e.alertId===a.id);
  return `
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Source</th><th>Old Value</th><th>New Value</th><th>Result</th></tr></thead>
      <tbody>
        ${entries.length ? entries.map(e=>`
          <tr style="cursor:default;">
            <td class="mono" style="font-family:var(--font-mono);">${e.ts}</td>
            <td>${e.user}</td><td>${e.role}</td><td>${e.action}</td><td>${e.source}</td>
            <td style="color:var(--text-muted);">${e.oldVal}</td><td>${e.newVal}</td>
            <td style="color:var(--success);">${e.result}</td>
          </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:26px;color:var(--text-muted);">No audit entries recorded for this alert yet.</td></tr>`}
      </tbody>
    </table>
  </div>`;
}
