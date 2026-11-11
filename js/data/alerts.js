/* Mock alerts. All hosts, users, IPs and IDs are fictional. */
let ALERTS = [
  {id:'SOC-00451',name:'C2 Communication Detected',severity:'Critical',source:'vectra',sourceAlertId:'VEC-293811',host:'PC-FINANCE-22',user:'m.saleh',sourceIp:'10.14.22.108',destIp:'185.220.101.47',domain:'update-cdn-sync.net',mitreTechnique:'T1071',mitreTacTag:'Command and Control',mitreDesc:'Application Layer Protocol',owner:'sulaiman',status:'Investigating',created:3,confidence:'High',riskScore:92,
    description:'Vectra AI detected recurring beacon-like outbound connections from PC-FINANCE-22 to an external IP with characteristics consistent with command-and-control communication. Traffic intervals and payload sizes matched known C2 jitter patterns.',
    sourceStatus:'Open→Closed', soarStatusSrc:'Investigating', syncStatus:'Synchronized', lastSync:'5 seconds ago',
    timeline:[
      {time:'23:40',text:'Alert received from Vectra AI',actor:'System'},
      {time:'23:41',text:'Severity normalized to Critical',actor:'System'},
      {time:'23:42',text:'Sulaiman took ownership',actor:'Sulaiman'},
      {time:'23:44',text:'Sulaiman started investigation',actor:'Sulaiman'},
      {time:'23:47',text:'Note added',actor:'Sulaiman',quote:'Destination IP confirmed as suspicious.'},
      {time:'23:52',text:'Threat Intelligence lookup completed',actor:'System'},
      {time:'00:02',text:'Alert closed by Sulaiman',actor:'Sulaiman'},
      {time:'00:02',text:'Vectra detection successfully closed',actor:'System'}
    ],
    notes:[{author:'Sulaiman Al-Alawi',time:'23:47',text:'Endpoint communicated with a known malicious infrastructure. Recommend isolating the endpoint and checking related authentication activity.'}]
  },
  {id:'SOC-00450',name:'Suspicious PowerShell Execution',severity:'High',source:'trend',sourceAlertId:'TM1-88213',host:'LAPTOP-HR-17',user:'r.said',sourceIp:'10.14.8.44',destIp:'—',domain:'—',mitreTechnique:'T1059.001',mitreTacTag:'Execution',mitreDesc:'PowerShell',owner:'unassigned',status:'New',created:7,confidence:'Medium',riskScore:64,
    description:'Trend Micro Vision One flagged an obfuscated PowerShell command line launched from a Word document macro, exhibiting encoded-command and download-cradle behavior consistent with initial-access tooling.',
    sourceStatus:'Open', soarStatusSrc:'New', syncStatus:'Synchronized', lastSync:'22 seconds ago',
    timeline:[
      {time:'23:34',text:'Alert received from Trend Micro Vision One',actor:'System'},
      {time:'23:34',text:'Severity normalized to High',actor:'System'}
    ], notes:[]
  },
  {id:'SOC-00449',name:'Multiple Failed Authentication Attempts',severity:'Medium',source:'logrhythm',sourceAlertId:'LR-70021',host:'AD-USER-1042',user:'svc-backup',sourceIp:'10.20.4.12',destIp:'10.20.1.5',domain:'corp.local',mitreTechnique:'T1110',mitreTacTag:'Credential Access',mitreDesc:'Brute Force',owner:'ahmed',status:'Investigating',created:11,confidence:'Medium',riskScore:57,
    description:'LogRhythm correlated 14 failed Kerberos pre-authentication attempts against a service account within a 3-minute window from a single workstation, followed by one successful logon.',
    sourceStatus:'Open', soarStatusSrc:'Investigating', syncStatus:'Synchronized', lastSync:'40 seconds ago',
    timeline:[
      {time:'23:30',text:'Alert received from LogRhythm',actor:'System'},
      {time:'23:31',text:'Ahmed took ownership',actor:'Ahmed'},
      {time:'23:33',text:'Ahmed started investigation',actor:'Ahmed'}
    ], notes:[{author:'Ahmed Al-Harthy',time:'23:33',text:'Checking whether svc-backup password rotation job is misconfigured before treating as malicious.'}]
  },
  {id:'SOC-00448',name:'Lateral Movement Detected',severity:'Critical',source:'vectra',sourceAlertId:'VEC-293790',host:'SERVER-DC02',user:'a.khalfan',sourceIp:'10.10.2.15',destIp:'10.10.2.31',domain:'corp.local',mitreTechnique:'T1021',mitreTacTag:'Lateral Movement',mitreDesc:'Remote Services',owner:'mohammed',status:'Escalated',created:18,confidence:'High',riskScore:88,
    description:'Vectra AI observed anomalous SMB and RDP session chaining originating from SERVER-DC02 toward multiple internal hosts outside normal administrative behavior baselines.',
    sourceStatus:'Open', soarStatusSrc:'Escalated', syncStatus:'Synchronized', lastSync:'11 seconds ago',
    timeline:[
      {time:'23:23',text:'Alert received from Vectra AI',actor:'System'},
      {time:'23:24',text:'Mohammed took ownership',actor:'Mohammed'},
      {time:'23:30',text:'Escalated to Team Leader',actor:'Mohammed',quote:'Pattern matches domain controller pivot — needs a second set of eyes.'}
    ], notes:[]
  },
  {id:'SOC-00447',name:'Malware Detected: Trojan.Win32.Emotet',severity:'High',source:'trend',sourceAlertId:'TM1-88190',host:'WKS-SALES-09',user:'h.amri',sourceIp:'10.14.30.19',destIp:'—',domain:'—',mitreTechnique:'T1204.002',mitreTacTag:'Execution',mitreDesc:'Malicious File',owner:'ahmed',status:'Investigating',created:22,confidence:'High',riskScore:71,
    description:'Trend Micro Vision One quarantined a dropper identified as Trojan.Win32.Emotet after execution from an email attachment; endpoint isolation was auto-triggered by the source product.',
    sourceStatus:'Quarantined', soarStatusSrc:'Investigating', syncStatus:'Synchronized', lastSync:'1 minute ago',
    timeline:[{time:'23:18',text:'Alert received from Trend Micro Vision One',actor:'System'},{time:'23:20',text:'Ahmed took ownership',actor:'Ahmed'}], notes:[]
  },
  {id:'SOC-00446',name:'Port Scan Detected',severity:'Low',source:'vectra',sourceAlertId:'VEC-293701',host:'DMZ-GATEWAY-01',user:'—',sourceIp:'193.29.13.4',destIp:'10.5.0.0/24',domain:'—',mitreTechnique:'T1046',mitreTacTag:'Discovery',mitreDesc:'Network Service Discovery',owner:'unassigned',status:'New',created:29,confidence:'Low',riskScore:31,
    description:'Vectra AI detected sequential TCP SYN probes against the DMZ subnet from an external address, consistent with automated reconnaissance scanning.',
    sourceStatus:'Open', soarStatusSrc:'New', syncStatus:'Synchronized', lastSync:'2 minutes ago', timeline:[{time:'23:11',text:'Alert received from Vectra AI',actor:'System'}], notes:[]
  },
  {id:'SOC-00445',name:'Unusual Outbound Data Transfer',severity:'Medium',source:'vectra',sourceAlertId:'VEC-293688',host:'SERVER-FILE03',user:'svc-fileshare',sourceIp:'10.10.5.9',destIp:'104.21.44.12',domain:'file-drop-share.io',mitreTechnique:'T1048',mitreTacTag:'Exfiltration',mitreDesc:'Exfiltration Over Alternative Protocol',owner:'mohammed',status:'Investigating',created:34,confidence:'Medium',riskScore:66,
    description:'Vectra AI flagged an unusually large outbound transfer from the primary file server to an external cloud-storage domain outside of the scheduled backup window.',
    sourceStatus:'Open', soarStatusSrc:'Investigating', syncStatus:'Synchronized', lastSync:'3 minutes ago', timeline:[{time:'23:06',text:'Alert received from Vectra AI',actor:'System'},{time:'23:09',text:'Mohammed took ownership',actor:'Mohammed'}], notes:[]
  },
  {id:'SOC-00444',name:'Scheduled Task Created',severity:'Informational',source:'logrhythm',sourceAlertId:'LR-69980',host:'SRV-APP-11',user:'a.said',sourceIp:'10.10.1.44',destIp:'—',domain:'corp.local',mitreTechnique:'T1053.005',mitreTacTag:'Persistence',mitreDesc:'Scheduled Task',owner:'sulaiman',status:'Closed',created:41,confidence:'Low',riskScore:18,
    description:'LogRhythm logged creation of a new scheduled task by an administrative account during an approved maintenance window; verified as legitimate patch automation.',
    sourceStatus:'Closed', soarStatusSrc:'Closed', syncStatus:'Synchronized', lastSync:'6 minutes ago',
    timeline:[{time:'22:59',text:'Alert received from LogRhythm',actor:'System'},{time:'23:02',text:'Sulaiman took ownership',actor:'Sulaiman'},{time:'23:04',text:'Verified as approved change — closed as benign',actor:'Sulaiman'}], notes:[]
  },
  {id:'SOC-00443',name:'Ransomware Behavior Detected',severity:'Critical',source:'trend',sourceAlertId:'TM1-88155',host:'SERVER-BACKUP01',user:'svc-backupadm',sourceIp:'10.10.1.7',destIp:'—',domain:'—',mitreTechnique:'T1486',mitreTacTag:'Impact',mitreDesc:'Data Encrypted for Impact',owner:'unassigned',status:'New',created:47,confidence:'High',riskScore:96,
    description:'Trend Micro Vision One detected mass file-rename and rapid encryption-pattern behavior on the backup server, matching known ransomware pre-encryption indicators.',
    sourceStatus:'Open', soarStatusSrc:'New', syncStatus:'Synchronized', lastSync:'8 minutes ago', timeline:[{time:'22:53',text:'Alert received from Trend Micro Vision One',actor:'System'},{time:'22:53',text:'Auto-escalated: Critical severity + Impact tactic',actor:'System'}], notes:[]
  },
  {id:'SOC-00442',name:'Credential Dumping Attempt',severity:'High',source:'logrhythm',sourceAlertId:'LR-69944',host:'DC-PRIMARY-01',user:'administrator',sourceIp:'10.10.0.2',destIp:'—',domain:'corp.local',mitreTechnique:'T1003',mitreTacTag:'Credential Access',mitreDesc:'OS Credential Dumping',owner:'mohammed',status:'Escalated',created:52,confidence:'High',riskScore:83,
    description:'LogRhythm detected LSASS memory-access patterns consistent with credential dumping tooling executed on the primary domain controller.',
    sourceStatus:'Open', soarStatusSrc:'Escalated', syncStatus:'Synchronized', lastSync:'9 minutes ago', timeline:[{time:'22:48',text:'Alert received from LogRhythm',actor:'System'},{time:'22:50',text:'Mohammed took ownership',actor:'Mohammed'},{time:'22:58',text:'Escalated to Team Leader',actor:'Mohammed'}], notes:[]
  },
  {id:'SOC-00441',name:'DNS Tunneling Suspected',severity:'Medium',source:'vectra',sourceAlertId:'VEC-293612',host:'PC-ENG-14',user:'y.busaidi',sourceIp:'10.14.40.6',destIp:'—',domain:'nsq1.data-relay.co',mitreTechnique:'T1071.004',mitreTacTag:'Command and Control',mitreDesc:'DNS',owner:'ahmed',status:'Investigating',created:58,confidence:'Medium',riskScore:61,
    description:'Vectra AI identified abnormally high-entropy DNS query volume to a single domain, a pattern consistent with DNS tunneling for covert data channels.',
    sourceStatus:'Open', soarStatusSrc:'Investigating', syncStatus:'Synchronized', lastSync:'12 minutes ago', timeline:[{time:'22:42',text:'Alert received from Vectra AI',actor:'System'},{time:'22:45',text:'Ahmed took ownership',actor:'Ahmed'}], notes:[]
  },
  {id:'SOC-00440',name:'Anomalous Login Location',severity:'Low',source:'logrhythm',sourceAlertId:'LR-69902',host:'VPN-GATEWAY',user:'k.zadjali',sourceIp:'41.202.66.9',destIp:'—',domain:'—',mitreTechnique:'T1078',mitreTacTag:'Defense Evasion',mitreDesc:'Valid Accounts',owner:'unassigned',status:'New',created:64,confidence:'Low',riskScore:38,
    description:'LogRhythm flagged a VPN login from a geographic location inconsistent with the user\'s typical access pattern over the trailing 30 days.',
    sourceStatus:'Open', soarStatusSrc:'New', syncStatus:'Synchronized', lastSync:'15 minutes ago', timeline:[{time:'22:36',text:'Alert received from LogRhythm',actor:'System'}], notes:[]
  },
  {id:'SOC-00439',name:'Privilege Escalation Attempt',severity:'High',source:'trend',sourceAlertId:'TM1-88102',host:'SERVER-DC01',user:'j.mahroqi',sourceIp:'10.10.0.3',destIp:'—',domain:'corp.local',mitreTechnique:'T1068',mitreTacTag:'Privilege Escalation',mitreDesc:'Exploitation for Privilege Escalation',owner:'sulaiman',status:'Investigating',created:72,confidence:'High',riskScore:76,
    description:'Trend Micro Vision One detected exploitation of a local privilege-escalation vulnerability shortly after an interactive logon on a domain controller.',
    sourceStatus:'Open', soarStatusSrc:'Investigating', syncStatus:'Synchronized', lastSync:'18 minutes ago', timeline:[{time:'22:28',text:'Alert received from Trend Micro Vision One',actor:'System'},{time:'22:31',text:'Sulaiman took ownership',actor:'Sulaiman'}], notes:[]
  },
  {id:'SOC-00438',name:'C2 Beacon Detected',severity:'Critical',source:'vectra',sourceAlertId:'VEC-293544',host:'PC-FINANCE-09',user:'s.riyami',sourceIp:'10.14.22.31',destIp:'185.220.101.47',domain:'update-cdn-sync.net',mitreTechnique:'T1071.001',mitreTacTag:'Command and Control',mitreDesc:'Web Protocols',owner:'unassigned',status:'New',created:78,confidence:'High',riskScore:90,
    description:'Vectra AI observed a second endpoint beaconing to the same known-malicious infrastructure as SOC-00451, suggesting a broader compromise within the finance segment.',
    sourceStatus:'Open', soarStatusSrc:'New', syncStatus:'Synchronized', lastSync:'20 minutes ago', timeline:[{time:'22:22',text:'Alert received from Vectra AI',actor:'System'}], notes:[]
  }
];
