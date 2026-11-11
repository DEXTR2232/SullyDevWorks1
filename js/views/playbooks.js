/* =========================================================
   VIEW: PLAYBOOKS
========================================================= */
function viewPlaybooks(){
  return `
  <div class="notice">${ICON.info}Playbooks preview: automated actions marked "pending approval" require analyst sign-off before executing. This console prioritizes centralized alert management — automation expands in a later release.</div>
  <div class="section-head"><h2>Automation Playbooks</h2><span class="hint">${PLAYBOOKS.filter(p=>p.enabled).length} of ${PLAYBOOKS.length} enabled</span></div>
  ${PLAYBOOKS.map((p,idx)=>`
    <div class="pb-card">
      <div class="pb-top">
        <div class="switch ${p.enabled?'on':''}" data-toggle-pb="${idx}"></div>
        <div class="pb-name">${p.name}</div>
        <span style="margin-left:auto;font-size:11px;color:var(--text-muted);">Success rate</span>
        <span style="font-family:var(--font-mono);font-weight:600;font-size:13px;color:${p.successRate>=95?'var(--success)':'var(--text-primary)'};">${p.successRate}%</span>
      </div>
      <div class="pb-body">
        <div class="pb-col"><div class="p-label">Trigger</div><div class="p-val">${p.trigger}</div></div>
        <div class="pb-col"><div class="p-label">Actions</div><div class="pb-actions-list">${p.actions.map(a=>`<span>${a}</span>`).join('')}</div></div>
        <div class="pb-col"><div class="p-label">Last Execution</div><div class="p-val">${p.lastExec}</div></div>
        <div class="pb-col"><div class="p-label">Status</div><div class="p-val" style="color:${p.enabled?'var(--success)':'var(--text-muted)'};">${p.enabled?'Enabled':'Disabled'}</div></div>
      </div>
    </div>`).join('')}
  `;
}
