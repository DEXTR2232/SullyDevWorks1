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
          <div class="u-name">${CURRENT_USER.name}</div>
          <div class="u-role">${CURRENT_USER.role}</div>
        </div>
        <button class="logout-btn" title="Log out">${ICON.logout}</button>
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
          <div class="soc-status"><span class="pulse-dot"></span>SOC STATUS: OPERATIONAL</div>
          <button class="icon-btn" title="Notifications">${ICON.bell}<span class="badge-dot"></span></button>
          <div class="topbar-user">
            ${avatar(CURRENT_USER, 28)}
            <div>
              <div class="u-name">${CURRENT_USER.name}</div>
              <div class="u-role">${CURRENT_USER.role}</div>
            </div>
          </div>
        </div>
      </header>
      <div class="view-root" id="view-root"></div>
    </div>
  `;
  document.getElementById('global-search').addEventListener('input', e=>{
    STATE.filters.search = e.target.value;
    if(STATE.view!=='alerts' && STATE.view!=='myalerts'){ setView('alerts'); } else { renderView(); }
  });
  attachNavHandlers();
}

function renderNav(){
  return NAV_GROUPS.map(g=>{
    let html = g.label ? `<div class="nav-label">${g.label}</div>` : (g!==NAV_GROUPS[0] ? '<div class="nav-divider"></div>' : '');
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
    case 'settings': root.innerHTML = viewSettings(); break;
    default: root.innerHTML = viewDashboard();
  }
  attachViewHandlers();
  if(STATE.view==='team') initTeamCharts();
}

function renderShellNavOnly(){
  const nav = document.querySelector('.nav');
  if(nav) nav.innerHTML = renderNav();
  attachNavHandlers();
}
