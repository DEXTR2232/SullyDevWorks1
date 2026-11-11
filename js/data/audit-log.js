/* Mock audit trail entries. */
const AUDIT_LOG = [
  {ts:'23:42:05',user:'Omar',role:'SOC Analyst',action:'Take Ownership',alertId:'SOC-00451',source:'Vectra',oldVal:'Unassigned',newVal:'Omar',result:'Success'},
  {ts:'23:44:11',user:'Omar',role:'SOC Analyst',action:'Status Change',alertId:'SOC-00451',source:'Vectra',oldVal:'New',newVal:'Investigating',result:'Success'},
  {ts:'23:47:02',user:'Omar',role:'SOC Analyst',action:'Add Note',alertId:'SOC-00451',source:'Vectra',oldVal:'—',newVal:'Note added',result:'Success'},
  {ts:'23:30:44',user:'Rami',role:'SOC Analyst',action:'Take Ownership',alertId:'SOC-00449',source:'LogRhythm',oldVal:'Unassigned',newVal:'Rami',result:'Success'},
  {ts:'23:24:19',user:'Yusuf',role:'SOC Analyst',action:'Take Ownership',alertId:'SOC-00448',source:'Vectra',oldVal:'Unassigned',newVal:'Yusuf',result:'Success'},
  {ts:'23:30:02',user:'Yusuf',role:'SOC Analyst',action:'Escalate',alertId:'SOC-00448',source:'Vectra',oldVal:'Investigating',newVal:'Escalated',result:'Success'},
  {ts:'23:04:37',user:'Omar',role:'SOC Analyst',action:'Close Alert',alertId:'SOC-00444',source:'LogRhythm',oldVal:'Investigating',newVal:'Closed',result:'Success'},
  {ts:'23:04:38',user:'System',role:'SOAR',action:'Source Synchronization',alertId:'SOC-00444',source:'LogRhythm',oldVal:'Open',newVal:'Closed',result:'Success'},
  {ts:'22:58:51',user:'Yusuf',role:'SOC Analyst',action:'Escalate',alertId:'SOC-00442',source:'LogRhythm',oldVal:'Investigating',newVal:'Escalated',result:'Success'},
  {ts:'22:31:07',user:'Omar',role:'SOC Analyst',action:'Take Ownership',alertId:'SOC-00439',source:'Trend Vision One',oldVal:'Unassigned',newVal:'Omar',result:'Success'},
  {ts:'22:15:12',user:'Administrator',role:'Administrator',action:'Update Severity Rule',alertId:'—',source:'System',oldVal:'T1110 = Low',newVal:'T1110 = Medium',result:'Success'},
  {ts:'00:02:18',user:'Omar',role:'SOC Analyst',action:'Close Alert',alertId:'SOC-00451',source:'Vectra',oldVal:'Investigating',newVal:'Closed',result:'Success'},
  {ts:'00:02:19',user:'System',role:'SOAR',action:'Source Synchronization',alertId:'SOC-00451',source:'Vectra',oldVal:'Open',newVal:'Closed',result:'Success'}
];
