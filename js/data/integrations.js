/* Mock integration sources and their display labels. */
const INTEGRATIONS = [
  {key:'trend',name:'Trend Micro Vision One',type:'XDR',icon:'shield',status:'Connected',apiStatus:'Healthy',lastSync:'12 seconds ago',lastFail:'3 days ago',alertsToday:42,latency:'98 ms',health:'Healthy'},
  {key:'vectra',name:'Vectra AI NDR',type:'Network Detection & Response',icon:'radar',status:'Connected',apiStatus:'Healthy',lastSync:'18 seconds ago',lastFail:'6 days ago',alertsToday:31,latency:'124 ms',health:'Healthy'},
  {key:'logrhythm',name:'LogRhythm SIEM',type:'SIEM',icon:'siem',status:'Connected',apiStatus:'Degraded',lastSync:'46 seconds ago',lastFail:'42 minutes ago',alertsToday:54,latency:'312 ms',health:'Degraded'}
];
const SRC_LABEL = {trend:'Trend Vision One', vectra:'Vectra AI', logrhythm:'LogRhythm'};
const SRC_CLASS = {trend:'trend', vectra:'vectra', logrhythm:'logrhythm'};
