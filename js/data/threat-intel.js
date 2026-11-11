/* Mock threat-intel indicators. Campaign names are fictional. */
const IOCS = [
  {ioc:'185.220.101.47', type:'IP', rep:'Malicious', src:'3 sources', tag:'Silent Ferry C2 cluster'},
  {ioc:'update-cdn-sync.net', type:'Domain', rep:'Malicious', src:'4 sources', tag:'Silent Ferry C2 cluster'},
  {ioc:'file-drop-share.io', type:'Domain', rep:'Suspicious', src:'1 source', tag:'Unverified exfil host'},
  {ioc:'41.202.66.9', type:'IP', rep:'Unknown', src:'0 sources', tag:'—'},
];
