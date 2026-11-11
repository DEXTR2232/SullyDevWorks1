/* Sidebar navigation structure. */
const NAV_GROUPS = [
  {label:null, items:[
    {id:'dashboard', label:'Dashboard', icon:'dashboard'},
    {id:'alerts', label:'Alerts', icon:'alerts', count:()=>ALERTS.filter(a=>a.status!=='Closed').length},
    {id:'myalerts', label:'My Alerts', icon:'my', count:()=>ALERTS.filter(a=>a.owner===CURRENT_USER.id && a.status!=='Closed').length},
    {id:'cases', label:'Cases', icon:'cases'},
  ]},
  {label:'Operations', items:[
    {id:'integrations', label:'Integrations', icon:'integrations'},
    {id:'playbooks', label:'Playbooks', icon:'playbooks'},
    {id:'intel', label:'Threat Intelligence', icon:'intel'},
  ]},
  {label:'Insights', items:[
    {id:'team', label:'Team Activity', icon:'team'},
    {id:'reports', label:'Reports', icon:'reports'},
    {id:'audit', label:'Audit Logs', icon:'audit'},
  ]},
  {label:null, items:[
    {id:'settings', label:'Settings', icon:'settings'},
  ]}
];
