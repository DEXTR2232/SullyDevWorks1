/* =========================================================
   SAMPLE ALERT HISTORY (30 days) for reports.
   Generated from a fixed seed, so every load produces the same
   pattern, anchored to "now". Fictional. Replaced by real alerts once
   they are stored in the database.
========================================================= */
const HISTORY_DAYS = 30;

const HISTORY_ALERTS = (function(){
  // mulberry32: small deterministic PRNG
  let seed = 0x5EC0A11;
  const rnd = ()=>{ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = (items)=>{ const total = items.reduce((s,i)=>s+i[1],0); let r = rnd()*total; for(const [v,w] of items){ if((r-=w)<=0) return v; } return items[items.length-1][0]; };
  const between = (a,b)=> a + rnd()*(b-a);

  const CATALOG = {
    vectra: [['C2 Beacon Detected','Command and Control','T1071.001'],['Hidden HTTPS Tunnel','Command and Control','T1572'],['Port Scan Detected','Discovery','T1046'],
             ['SMB Brute Force','Credential Access','T1110'],['Suspicious Remote Execution','Lateral Movement','T1021.002'],['Data Smuggler','Exfiltration','T1048'],
             ['Kerberos Password Spray','Credential Access','T1110.003'],['LDAP Reconnaissance','Discovery','T1087.002']],
    trend:  [['Suspicious PowerShell Execution','Execution','T1059.001'],['Malware Detected','Execution','T1204.002'],['Ransomware Behavior Detected','Impact','T1486'],
             ['Credential Dumping Attempt','Credential Access','T1003'],['Phishing Link Clicked','Initial Access','T1566.002'],['Privilege Escalation Attempt','Privilege Escalation','T1068'],
             ['Suspicious Scheduled Task','Persistence','T1053.005']],
    logrhythm: [['Multiple Failed Logons','Credential Access','T1110'],['Anomalous Login Location','Defense Evasion','T1078'],['New Admin Account Created','Persistence','T1136'],
             ['Audit Log Cleared','Defense Evasion','T1070.001'],['Firewall Policy Change','Defense Evasion','T1562.004'],['Outbound Traffic to Rare Country','Command and Control','T1071'],
             ['Service Account Interactive Logon','Initial Access','T1078.002']]
  };
  const ACK = {Critical:[2,10], High:[3,22], Medium:[6,45], Low:[12,120], Informational:[20,240]};
  const now = Date.now(), DAY = 86400000;
  const out = [];
  let n = 30000;

  for(let d = HISTORY_DAYS; d >= 0; d--){
    const dayStart = new Date(now - d*DAY); dayStart.setHours(0,0,0,0);
    const weekend = [5,6].includes(dayStart.getDay());           // Fri/Sat weekend
    const count = Math.round(weekend ? between(14,24) : between(26,42));
    for(let i=0; i<count; i++){
      const created = new Date(dayStart.getTime() + rnd()*DAY);
      if(created.getTime() > now - 80*60000) continue;              // the live alert list covers the last ~80 min
      if(created.getTime() < now - HISTORY_DAYS*DAY) continue;
      const source = pick([['logrhythm',40],['trend',32],['vectra',28]]);
      const [name, tactic, technique] = CATALOG[source][Math.floor(rnd()*CATALOG[source].length)];
      const severity = pick([['Critical',7],['High',20],['Medium',38],['Low',25],['Informational',10]]);
      const owner = pick([['omar',38],['rami',33],['yusuf',29]]);
      const ageH = (now - created.getTime())/3600000;
      const [a0,a1] = ACK[severity];
      const ackMins = Math.round(between(a0,a1));
      let status = 'Closed';
      if(ageH < 6) status = pick([['Investigating',45],['Escalated',10],['Closed',45]]);
      else if(rnd() < 0.06) status = 'Escalated';
      const resolveMins = status === 'Closed' ? ackMins + Math.round(between(15, severity==='Critical'?240:480)) : null;
      let disposition = status === 'Closed' ? pick([['True Positive',33],['False Positive',24],['Benign',43]]) : null;
      // Escalated at some point (even if since closed). Likelier for severe alerts.
      const escRate = {Critical:.55, High:.25, Medium:.08, Low:.03, Informational:.01}[severity];
      const escalated = status === 'Escalated' || rnd() < escRate;
      const escalatedMins = escalated ? ackMins + Math.round(between(5, 90)) : null;
      // Some escalations become incidents. An incident means a confirmed true positive.
      let incident = null, incidentMins = null;
      if(escalated && (severity === 'Critical' || severity === 'High') && rnd() < (severity === 'Critical' ? .5 : .3)){
        incident = true; incidentMins = escalatedMins + Math.round(between(10, 120));
        if(status === 'Closed') disposition = 'True Positive';
      }
      out.push({id:'SOC-' + String(n++).padStart(5,'0'), name, source, severity, owner, status, createdAt:created,
                ackMins, resolveMins, disposition, tactic, technique, escalated, escalatedMins, incident, incidentMins, sample:true});
    }
  }
  // Incident IDs in time order (INC-0001 …). Live alerts use the case they belong to.
  out.sort((a,b)=>a.createdAt-b.createdAt);
  let inc = 1;
  out.forEach(a => { if(a.incident) a.incident = 'INC-' + String(inc++).padStart(4,'0'); });
  return out.sort((a,b)=>b.createdAt-a.createdAt);
})();
