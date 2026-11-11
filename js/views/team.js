/* =========================================================
   VIEW: TEAM ACTIVITY
========================================================= */

function viewTeam(){
  return `
  <div class="section-head"><h2>Team Activity</h2><span class="hint">SOC analyst workload and performance</span></div>
  <div class="grid team-cards">
    ${Object.values(ANALYSTS).filter(a=>TEAM_STATS[a.id]).map(a=>{
      const s = TEAM_STATS[a.id];
      return `
      <div class="team-card">
        <div class="tc-head">${avatar(a,36)}<div><div class="u-name">${esc(a.name)}</div><div class="u-role">${esc(a.role)}</div></div></div>
        <div class="tc-stats">
          <div class="tc-stat"><div class="ts-label">Assigned</div><div class="ts-val">${s.assigned}</div></div>
          <div class="tc-stat"><div class="ts-label">Investigating</div><div class="ts-val">${s.investigating}</div></div>
          <div class="tc-stat"><div class="ts-label">Closed Today</div><div class="ts-val" style="color:var(--success);">${s.closedToday}</div></div>
          <div class="tc-stat"><div class="ts-label">Escalated</div><div class="ts-val" style="color:var(--critical);">${s.escalated}</div></div>
        </div>
        <div class="tc-mrt">Avg. Response Time <b>${s.avgResponse}</b></div>
      </div>`;
    }).join('')}
  </div>

  <div class="grid chart-grid">
    <div class="chart-card"><h3>Alerts handled per analyst</h3><div class="chart-box"><canvas id="ch-handled"></canvas></div></div>
    <div class="chart-card"><h3>Critical alerts handled</h3><div class="chart-box"><canvas id="ch-critical"></canvas></div></div>
    <div class="chart-card"><h3>Alerts by security source</h3><div class="chart-box"><canvas id="ch-source"></canvas></div></div>
    <div class="chart-card"><h3>MTTA / MTTI / MTTR (minutes)</h3><div class="chart-box"><canvas id="ch-mtt"></canvas></div></div>
    <div class="chart-card"><h3>Alerts closed today</h3><div class="chart-box"><canvas id="ch-closed"></canvas></div></div>
    <div class="chart-card"><h3>False positive rate</h3><div class="chart-box"><canvas id="ch-fp"></canvas></div></div>
  </div>

  <div class="section-head"><h2>Team Activity Feed</h2><span class="hint">Real-time analyst actions</span></div>
  <div class="card">
    ${TEAM_FEED.map(f=>`<div class="feed-item"><div class="feed-time">${f.time}</div><div class="feed-text">${f.text}</div></div>`).join('')}
  </div>`;
}

function chartDefaults(){
  Chart.defaults.color = '#8b98a8';
  Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
  Chart.defaults.font.size = 11;
}
let CHART_INSTANCES = [];
function initTeamCharts(){
  CHART_INSTANCES.forEach(c=>c.destroy());
  CHART_INSTANCES = [];
  chartDefaults();
  const grid = {color:'#232c37'};
  const names = ['Sulaiman','Ahmed','Mohammed'];
  const barColors = ['#4c8dff','#3fb67f','#e8c547'];

  CHART_INSTANCES.push(new Chart(document.getElementById('ch-handled'), {
    type:'bar', data:{labels:names, datasets:[{data:[22,16,19], backgroundColor:barColors, borderRadius:4, barThickness:34}]},
    options:{plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{grid, beginAtZero:true}}}
  }));
  CHART_INSTANCES.push(new Chart(document.getElementById('ch-critical'), {
    type:'bar', data:{labels:names, datasets:[{data:[5,2,4], backgroundColor:'#e5484d', borderRadius:4, barThickness:34}]},
    options:{plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{grid, beginAtZero:true}}}
  }));
  CHART_INSTANCES.push(new Chart(document.getElementById('ch-source'), {
    type:'doughnut', data:{labels:['Trend Vision One','Vectra AI','LogRhythm'], datasets:[{data:[42,31,54], backgroundColor:['#c0392b','#8e44ec','#2f9e6c'], borderWidth:0}]},
    options:{plugins:{legend:{position:'bottom', labels:{boxWidth:9, padding:10}}}, cutout:'62%'}
  }));
  CHART_INSTANCES.push(new Chart(document.getElementById('ch-mtt'), {
    type:'bar', data:{labels:names, datasets:[
      {label:'MTTA', data:[1.8,2.4,2.0], backgroundColor:'#4c8dff', borderRadius:3},
      {label:'MTTI', data:[3.6,4.3,3.9], backgroundColor:'#e8c547', borderRadius:3},
      {label:'MTTR', data:[9.2,11.5,10.1], backgroundColor:'#e5484d', borderRadius:3}
    ]},
    options:{plugins:{legend:{position:'bottom', labels:{boxWidth:9,padding:10}}}, scales:{x:{grid:{display:false}}, y:{grid, beginAtZero:true}}}
  }));
  CHART_INSTANCES.push(new Chart(document.getElementById('ch-closed'), {
    type:'bar', data:{labels:[...names,'Other'], datasets:[{data:[12,9,11,16], backgroundColor:['#4c8dff','#3fb67f','#e8c547','#5b6675'], borderRadius:4, barThickness:30}]},
    options:{plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{grid, beginAtZero:true}}}
  }));
  CHART_INSTANCES.push(new Chart(document.getElementById('ch-fp'), {
    type:'doughnut', data:{labels:['False Positive','Confirmed'], datasets:[{data:[8.4,91.6], backgroundColor:['#e8c547','#232c37'], borderWidth:0}]},
    options:{plugins:{legend:{display:false}}, cutout:'72%'}
  }));
}
