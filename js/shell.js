/* =========================================================
   RENDER: SHELL
========================================================= */
function renderShell(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">${ICON.shield}</div>
        <div class="brand-text">
          <div class="name">Unified SOAR</div>
          <div class="sub">Centralized Security Operations &amp; Response Platform</div>
        </div>
      </div>
      <nav class="nav">${renderNav()}</nav>
      <div class="sidebar-foot">
        ${avatar(CURRENT_USER)}
        <div class="user-meta">
          <div class="u-name">${esc(CURRENT_USER.name)}</div>
          <div class="u-role">${esc(CURRENT_USER.role)}</div>
        </div>
        <button class="logout-btn" id="logout-btn" title="Log out">${ICON.logout}</button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="topbar-title">Security Operations Center<span class="dot">·</span><span class="sub">Unified SOAR Console</span></div>
        <div class="search-wrap">
          ${ICON.search}
          <input type="text" id="global-search" placeholder="Search Alert ID, Host, IP, User...">
        </div>
        <div class="topbar-right">
          ${CURRENT_USER.isDemo ? `<label class="demo-switch" title="Demo only: switch role to see what each one can do">View as
            <select id="demo-role">${Object.entries(ROLE_LABELS).map(([v,l])=>`<option value="${v}" ${CURRENT_USER.appRole===v?'selected':''}>${l}</option>`).join('')}</select></label>` : ''}
          <div class="soc-status"><span class="pulse-dot"></span>SOC STATUS: OPERATIONAL</div>
          <button class="icon-btn" title="Notifications">${ICON.bell}<span class="badge-dot"></span></button>
          <div class="topbar-user">
            ${avatar(CURRENT_USER, 28)}
            <div>
              <div class="u-name">${esc(CURRENT_USER.name)}</div>
              <div class="u-role">${esc(CURRENT_USER.role)}</div>
            </div>
          </div>
        </div>
      </header>
      <div class="view-root" id="view-root"></div>
    </div>
    ${CURRENT_USER.isDemo ? `<div class="demo-watermark" aria-hidden="true"><div class="dw-title">DEMO MODE</div><div class="dw-sub">Sandbox · fake data · ends in <span id="demo-countdown">--:--</span></div></div>` : ''}
  `;
  const demoRole = document.getElementById('demo-role');
  if(demoRole) demoRole.addEventListener('change', ()=>switchDemoRole(demoRole.value));
  document.getElementById('global-search').addEventListener('input', e=>{
    STATE.filters.search = e.target.value;
    if(STATE.view!=='alerts' && STATE.view!=='myalerts'){ setView('alerts'); } else { renderView(); }
  });
  document.getElementById('logout-btn').addEventListener('click', signOut);
  attachNavHandlers();
}

function navAllowed(it){ return !it.roles || hasRole(...it.roles); }

function renderNav(){
  return NAV_GROUPS.map(g=>({...g, items:g.items.filter(navAllowed)})).filter(g=>g.items.length).map((g,gi)=>{
    let html = g.label ? `<div class="nav-label">${g.label}</div>` : (gi>0 ? '<div class="nav-divider"></div>' : '');
    html += g.items.map(it=>{
      const active = STATE.view===it.id ? 'active':'';
      const count = it.count ? `<span class="nav-count">${it.count()}</span>` : '';
      return `<div class="nav-item ${active}" data-nav="${it.id}">${ICON[it.icon]}<span>${it.label}</span>${count}</div>`;
    }).join('');
    return html;
  }).join('');
}

function attachNavHandlers(){
  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', ()=> setView(el.getAttribute('data-nav')) );
  });
}

function setView(view, alertId){
  const item = NAV_GROUPS.flatMap(g=>g.items).find(i=>i.id===view);
  if(item && !navAllowed(item)) view = 'dashboard';
  STATE.view = view;
  if(alertId){ STATE.selectedAlertId = alertId; STATE.tab='overview'; }
  document.querySelectorAll('.nav-item').forEach(el=>{
    el.classList.toggle('active', el.getAttribute('data-nav')===view);
  });
  renderView();
  document.getElementById('view-root').scrollTop = 0;
}

/* =========================================================
   RENDER: VIEW ROUTER
========================================================= */
function renderView(){
  const root = document.getElementById('view-root');
  switch(STATE.view){
    case 'dashboard': root.innerHTML = viewDashboard(); break;
    case 'alerts': root.innerHTML = viewAlerts(false); break;
    case 'myalerts': root.innerHTML = viewAlerts(true); break;
    case 'alert-detail': root.innerHTML = viewAlertDetail(); break;
    case 'cases': root.innerHTML = viewCases(); break;
    case 'integrations': root.innerHTML = viewIntegrations(); break;
    case 'playbooks': root.innerHTML = viewPlaybooks(); break;
    case 'intel': root.innerHTML = viewIntel(); break;
    case 'team': root.innerHTML = viewTeam(); break;
    case 'reports': root.innerHTML = viewReports(); break;
    case 'audit': root.innerHTML = viewAudit(); break;
    case 'users': root.innerHTML = viewUsers(); break;
    case 'settings': root.innerHTML = viewSettings(); break;
    default: root.innerHTML = viewDashboard();
  }
  attachViewHandlers();
  if(STATE.view==='team') initTeamCharts();
  if(STATE.view==='users') initUsersView();
}

function renderShellNavOnly(){
  const nav = document.querySelector('.nav');
  if(nav) nav.innerHTML = renderNav();
  attachNavHandlers();
}
