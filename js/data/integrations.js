/* Mock integration sources and their display labels.
   sync* / ingestDelay are sample health metrics used by the Integration
   Health report until real connector telemetry exists. */
const INTEGRATIONS = [
  {key:'trend',name:'Trend Micro Vision One',type:'XDR',icon:'shield',status:'Connected',apiStatus:'Healthy',lastSync:'12 seconds ago',lastFail:'3 days ago',alertsToday:42,latency:'98 ms',health:'Healthy',syncSuccess7d:99.92,failedSyncs7d:2,ingestDelay:'14 s'},
  {key:'vectra',name:'Vectra AI NDR',type:'Network Detection & Response',icon:'radar',status:'Connected',apiStatus:'Healthy',lastSync:'18 seconds ago',lastFail:'6 days ago',alertsToday:31,latency:'124 ms',health:'Healthy',syncSuccess7d:99.71,failedSyncs7d:6,ingestDelay:'22 s'},
  {key:'logrhythm',name:'LogRhythm SIEM',type:'SIEM',icon:'siem',status:'Connected',apiStatus:'Degraded',lastSync:'46 seconds ago',lastFail:'42 minutes ago',alertsToday:54,latency:'312 ms',health:'Degraded',syncSuccess7d:97.36,failedSyncs7d:57,ingestDelay:'1 m 48 s'}
];
const SRC_LABEL = {trend:'Trend Vision One', vectra:'Vectra AI', logrhythm:'LogRhythm'};
const SRC_CLASS = {trend:'trend', vectra:'vectra', logrhythm:'logrhythm'};
