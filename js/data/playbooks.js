/* Mock automation playbooks. */
const PLAYBOOKS = [
  {name:'Critical Malware Investigation',enabled:true,trigger:'Severity = Critical AND Category = Malware',actions:['Isolate affected host','Collect forensic snapshot','Notify Team Leader'],lastExec:'14 min ago',successRate:96},
  {name:'C2 Communication Response',enabled:true,trigger:'Detection = C2 Communication (Vectra AI)',actions:['Enrich destination IP reputation','Block at firewall (pending approval)','Create investigation case'],lastExec:'3 min ago',successRate:100},
  {name:'Brute Force Investigation',enabled:true,trigger:'≥5 failed authentications in 10 min',actions:['Lock account (pending approval)','Enrich user context','Notify assigned analyst'],lastExec:'11 min ago',successRate:91},
  {name:'Suspicious PowerShell Investigation',enabled:false,trigger:'MITRE Technique = T1059.001',actions:['Collect script block logs','Sandbox detonation'],lastExec:'2 hours ago',successRate:88},
  {name:'Compromised Account Investigation',enabled:true,trigger:'Anomalous login + privilege escalation',actions:['Force MFA re-authentication','Revoke active sessions',"Notify user's manager"],lastExec:'47 min ago',successRate:93}
];
