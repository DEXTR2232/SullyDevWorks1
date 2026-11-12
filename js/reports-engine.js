/* =========================================================
   REPORTS ENGINE
   Each builder returns one report object:
     { key, title, desc, periodText,
       kpis:     [[label, value], ...]          headline numbers
       spark:    [{label, value}, ...]          mini bar chart (optional)
       preview:  {columns, rows}                mini table in the card
       sections: [{name, columns, rows}, ...]   full data, exported }
   Data: live alerts (ALERTS) + the 30-day sample history.
   "Escalated" counts every alert escalated at some point, even if it
   has since been closed. An alert "changed to an incident" is one
   linked to an incident/case (INC-… in the sample, CASE-… live).
   Analysts only see their own row in analyst figures; team leads
   and admins see the whole team.
========================================================= */
const REPORT_SEVERITIES = ['Critical','High','Medium','Low','Informational'];

/* Live alerts + sample history, in one shape. */
function reportAlerts(){
  const now = Date.now();
  const live = ALERTS.map(a=>{
    const kase = (typeof CASES !== 'undefined') && CASES.find(c => c.alerts.includes(a.id));
    return {
      id:a.id, name:a.name, source:a.source, severity:a.severity,
      owner:a.owner, status:a.status, createdAt:new Date(now - a.created*60000),
      ackMins:null, resolveMins:null, disposition:null,
      tactic:a.mitreTacTag, technique:a.mitreTechnique,
      escalated: a.status === 'Escalated' || (a.timeline||[]).some(t => /escalated/i.test(t.text)),
      escalatedMins:null, incident: kase ? kase.id : null, incidentMins:null, sample:false
    };
  });
  return live.concat(HISTORY_ALERTS);
}
function inPeriod(list, from, to){ return list.filter(a => a.createdAt >= from && a.createdAt <= to); }
function avg(nums){ const v = nums.filter(n => n != null); return v.length ? v.reduce((s,n)=>s+n,0)/v.length : null; }
function fmtMins(m){
  if(m == null) return '—';
  m = Math.round(m);
  if(m < 60) return m + 'm';
  const h = Math.floor(m/60), r = m % 60;
  return h + 'h' + (r ? ' ' + r + 'm' : '');
}
function pct(n, d){ return d ? Math.round(n/d*1000)/10 : 0; }
function onlyOwnFigures(){ return typeof hasRole === 'function' && CURRENT_USER && !hasRole('team_lead','admin'); }
function analystName(id){ return (ANALYSTS[id] && ANALYSTS[id].name) || (id === 'unassigned' ? 'Unassigned' : id); }

function alertStats(list){
  const closed = list.filter(a => a.status === 'Closed');
  const withDisp = closed.filter(a => a.disposition);
  return {
    total: list.length,
    sev: Object.fromEntries(REPORT_SEVERITIES.map(s => [s, list.filter(a => a.severity === s).length])),
    closed: closed.length,
    open: list.filter(a => a.status !== 'Closed').length,
    escalated: list.filter(a => a.escalated).length,
    escalatedOpen: list.filter(a => a.status === 'Escalated').length,
    incidents: list.filter(a => a.incident).length,
    incidentIds: new Set(list.filter(a => a.incident).map(a => a.incident)).size,
    escRate: pct(list.filter(a => a.escalated).length, list.length),
    escToInc: pct(list.filter(a => a.incident).length, list.filter(a => a.escalated).length),
    mtte: avg(list.filter(a => a.escalated).map(a => a.escalatedMins)),
    mtta: avg(list.map(a => a.ackMins)),
    mttr: avg(closed.map(a => a.resolveMins)),
    fp: pct(withDisp.filter(a => a.disposition === 'False Positive').length, withDisp.length),
    tp: pct(withDisp.filter(a => a.disposition === 'True Positive').length, withDisp.length)
  };
}
function countBy(list, key){
  const m = new Map();
  list.forEach(a => m.set(a[key], (m.get(a[key])||0) + 1));
  return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}
function periodText(from, to){ return `${fmtDateTime(from)} → ${fmtDateTime(to)}`; }

/* Sections shared by several reports */
function sourceSection(list){
  return {name:'By source', columns:['Source','Alerts','Critical','High','Escalated','Incidents','Closed','MTTA','MTTR','False positive %'],
    rows: INTEGRATIONS.map(i=>{
      const l = list.filter(a => a.source === i.key), s = alertStats(l);
      return [i.name, s.total, s.sev.Critical, s.sev.High, s.escalated, s.incidents, s.closed, fmtMins(s.mtta), fmtMins(s.mttr), s.fp];
    })};
}
function severitySection(list){
  return {name:'By severity', columns:['Severity','Alerts','Escalated','Incidents','Closed','Open','MTTA','MTTR'],
    rows: REPORT_SEVERITIES.map(sev=>{
      const l = list.filter(a => a.severity === sev), s = alertStats(l);
      return [sev, s.total, s.escalated, s.incidents, s.closed, s.open, fmtMins(s.mtta), fmtMins(s.mttr)];
    })};
}
function tacticSection(list, limit){
  return {name:'Top MITRE tactics', columns:['Tactic','Alerts','Share %'],
    rows: countBy(list,'tactic').slice(0, limit||10).map(([t,c]) => [t, c, pct(c, list.length)])};
}
function techniqueSection(list, limit){
  const m = new Map();
  list.forEach(a=>{ const k = a.technique + '|' + a.tactic; m.set(k, (m.get(k)||0)+1); });
  return {name:'Top techniques', columns:['Technique','Tactic','Alerts'],
    rows: [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0, limit||10).map(([k,c]) => { const [t,tac] = k.split('|'); return [t, tac, c]; })};
}
function escalationSection(list){
  return {name:'Escalations', columns:['Alert ID','Created','Alert','Severity','Source','Escalated by','Time to escalate (min)','Current status','Incident'],
    rows: list.filter(a => a.escalated).sort((a,b)=>b.createdAt-a.createdAt).map(a => [
      a.id, a.createdAt, a.name, a.severity, SRC_LABEL[a.source]||a.source, analystName(a.owner), a.escalatedMins, a.status, a.incident||''])};
}
function incidentSection(list){
  return {name:'Incidents', columns:['Incident','Alert ID','Alert created','Alert','Severity','Source','Analyst','Time to incident (min)','Alert status','Tactic','Technique'],
    rows: list.filter(a => a.incident).sort((a,b)=>b.createdAt-a.createdAt).map(a => [
      a.incident, a.id, a.createdAt, a.name, a.severity, SRC_LABEL[a.source]||a.source, analystName(a.owner), a.incidentMins, a.status, a.tactic, a.technique])};
}
function alertListSection(list){
  return {name:'Alerts', columns:['Alert ID','Created','Alert','Severity','Source','Owner','Status','Disposition','Escalated','Incident','Time to ack (min)','Time to escalate (min)','Time to resolve (min)','Tactic','Technique','Data'],
    rows: list.slice().sort((a,b)=>b.createdAt-a.createdAt).map(a => [
      a.id, a.createdAt, a.name, a.severity, SRC_LABEL[a.source]||a.source, analystName(a.owner), a.status,
      a.disposition||'', a.escalated ? 'Yes' : 'No', a.incident||'', a.ackMins, a.escalatedMins, a.resolveMins, a.tactic, a.technique, a.sample ? 'Sample' : 'Live'])};
}
/* Trend table over buckets [{label, from, to}] */
function trendSection(name, firstCol, list, buckets){
  return {name, columns:[firstCol,'Alerts','Critical','High','Medium','Low','Informational','Escalated','Incidents','Closed','MTTA','MTTR'],
    rows: buckets.map(b => { const s = alertStats(list.filter(a => a.createdAt >= b.from && a.createdAt < b.to));
      return [b.label, s.total, s.sev.Critical, s.sev.High, s.sev.Medium, s.sev.Low, s.sev.Informational, s.escalated, s.incidents, s.closed, fmtMins(s.mtta), fmtMins(s.mttr)]; })};
}
function dayBuckets(from, to){
  const out = [], d = new Date(from); d.setHours(0,0,0,0);
  while(d <= to){ const n = new Date(d); n.setDate(d.getDate()+1);
    out.push({label: d.toLocaleDateString(undefined,{weekday:'short', day:'2-digit', month:'short'}), short: d.toLocaleDateString(undefined,{day:'2-digit', month:'short'}), from:new Date(d), to:n}); d.setDate(d.getDate()+1); }
  return out;
}
function baseKpis(s){
  return [['Alerts', s.total], ['Critical', s.sev.Critical], ['Escalated', s.escalated], ['Incidents', s.incidents],
          ['Closed', s.closed], ['MTTR', fmtMins(s.mttr)],
          ['High', s.sev.High], ['Open', s.open], ['Still escalated', s.escalatedOpen], ['Escalation rate %', s.escRate + '%'],
          ['Escalations → incidents %', s.escToInc + '%'], ['Avg time to escalate', fmtMins(s.mtte)],
          ['MTTA', fmtMins(s.mtta)], ['True positive %', s.tp + '%'], ['False positive %', s.fp + '%']];
}

/* ---------- 1. Last 24 hours ---------- */
function buildDailyReport(now){
  now = now || new Date();
  const from = new Date(now - 86400000);
  const list = inPeriod(reportAlerts(), from, now), s = alertStats(list);
  const spark = [];
  for(let h = 23; h >= 0; h--){
    const end = new Date(now - h*3600000), start = new Date(end - 3600000);
    spark.push({label: String(start.getHours()).padStart(2,'0') + ':00', value: list.filter(a => a.createdAt > start && a.createdAt <= end).length});
  }
  const sev = severitySection(list);
  return {key:'daily', title:'24-Hour SOC Summary', desc:'Everything that happened in the last 24 hours: volume, severity, response times and the full alert list.',
    periodText: periodText(from, now), kpis: baseKpis(s), spark,
    preview: {columns:['Severity','Alerts','Escalated','Incidents','Closed','MTTA'], rows: sev.rows.map(r => [r[0],r[1],r[2],r[3],r[4],r[6]])},
    sections:[sev, sourceSection(list), escalationSection(list), incidentSection(list), tacticSection(list), alertListSection(list)]};
}

/* ---------- 2. Last 7 days ---------- */
function buildWeeklyReport(now){
  now = now || new Date();
  const start = new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate()-6);
  const list = inPeriod(reportAlerts(), start, now), s = alertStats(list);
  const days = dayBuckets(start, now);
  const trend = trendSection('Daily trend', 'Date', list, days);
  return {key:'weekly', title:'Weekly SOC Report', desc:'Seven-day trend by day and severity, escalations and incidents, response times, busiest sources and the techniques seen most.',
    periodText: periodText(start, now), kpis: baseKpis(s),
    spark: trend.rows.map((r,i) => ({label: days[i].label, value: r[1]})),
    preview: {columns:['Date','Alerts','Critical','Escalated','Incidents','Closed'], rows: trend.rows.map(r => [r[0],r[1],r[2],r[7],r[8],r[9]])},
    sections:[trend, sourceSection(list), severitySection(list), escalationSection(list), incidentSection(list), techniqueSection(list), alertListSection(list)]};
}

/* ---------- 3. Last 30 days ---------- */
function buildMonthlyReport(now){
  now = now || new Date();
  const start = new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate()-29);
  const list = inPeriod(reportAlerts(), start, now), s = alertStats(list);
  const weeks = [];
  for(let w=0; w<5; w++){
    const w0 = new Date(start); w0.setDate(start.getDate() + w*7);
    if(w0 > now) break;
    const w1 = new Date(w0); w1.setDate(w0.getDate()+7);
    weeks.push({label: w0.toLocaleDateString(undefined,{day:'2-digit', month:'short'}), from:w0, to:w1});
  }
  const trend = trendSection('Weekly trend', 'Week starting', list, weeks);
  const days = dayBuckets(start, now);
  return {key:'monthly', title:'Monthly Executive Report', desc:'Thirty-day posture for leadership: weekly trend, escalations, incidents, true/false positive rates, sources, tactics and team totals.',
    periodText: periodText(start, now),
    kpis: baseKpis(s).slice(0,6).concat([['Escalations → incidents %', s.escToInc + '%'], ['True positive %', s.tp + '%'], ['False positive %', s.fp + '%'], ['MTTA', fmtMins(s.mtta)], ['Avg time to escalate', fmtMins(s.mtte)]]),
    spark: days.map(d => ({label: d.short, value: list.filter(a => a.createdAt >= d.from && a.createdAt < d.to).length})),
    preview: {columns:['Week starting','Alerts','Critical','Escalated','Incidents','MTTR'], rows: trend.rows.map(r => [r[0],r[1],r[2],r[7],r[8],r[11]])},
    sections:[trend, sourceSection(list), severitySection(list), escalationSection(list), incidentSection(list), tacticSection(list), analystSection(list).section, alertListSection(list)]};
}

/* ---------- 4. Integration health ---------- */
function buildIntegrationReport(now){
  now = now || new Date();
  const all = reportAlerts();
  const d1 = inPeriod(all, new Date(now - 86400000), now), d7 = inPeriod(all, new Date(now - 7*86400000), now);
  const rows = INTEGRATIONS.map(i => { const l7 = d7.filter(a => a.source === i.key);
    return [i.name, i.type, i.status, i.apiStatus, i.health, i.latency, i.lastSync, i.lastFail,
    d1.filter(a => a.source === i.key).length, l7.length, i.syncSuccess7d, i.failedSyncs7d, i.ingestDelay,
    l7.filter(a => a.escalated).length, l7.filter(a => a.incident).length]; });
  const healthy = INTEGRATIONS.filter(i => i.health === 'Healthy').length;
  const latencies = INTEGRATIONS.map(i => parseInt(i.latency,10)).filter(n => !isNaN(n));
  return {key:'integrations', title:'Integration Health Report', desc:'Connection status, API health, latency, sync reliability and alert volume for every connected security tool.',
    periodText: 'Current status · volumes for last 24 h / 7 days',
    kpis:[['Integrations', INTEGRATIONS.length], ['Healthy', healthy], ['Degraded', INTEGRATIONS.length - healthy], ['Alerts (24 h)', d1.length],
          ['Avg latency', Math.round(avg(latencies)) + ' ms'], ['Lowest sync success', Math.min(...INTEGRATIONS.map(i=>i.syncSuccess7d)) + '%']],
    spark: INTEGRATIONS.map(i => ({label: SRC_LABEL[i.key], value: d7.filter(a => a.source === i.key).length})),
    preview: {columns:['Integration','Health','Latency','Sync success 7 d','Alerts 24 h'], rows: rows.map(r => [r[0], r[4], r[5], r[10] + '%', r[8]])},
    sections:[{name:'Integrations', columns:['Integration','Type','Status','API status','Health','Latency','Last sync','Last failure','Alerts (24 h)','Alerts (7 d)','Sync success 7 d (%)','Failed syncs (7 d)','Avg ingest delay','Escalated (7 d)','Incidents (7 d)'], rows}]};
}

/* ---------- 5. Analyst performance ---------- */
function analystSection(list){
  let ids = Object.keys(ANALYSTS).filter(id => id !== 'unassigned' && list.some(a => a.owner === id));
  if(onlyOwnFigures()) ids = [CURRENT_USER.id];
  const rows = ids.map(id=>{
    const l = list.filter(a => a.owner === id), s = alertStats(l);
    return [analystName(id), (ANALYSTS[id]||{}).role || '', s.total, s.closed, s.escalated, s.incidents, s.sev.Critical,
            fmtMins(s.mtta), fmtMins(s.mtte), fmtMins(s.mttr), s.fp, pct(s.closed, s.total)];
  }).sort((a,b)=>b[2]-a[2]);
  return {ids, section:{name: onlyOwnFigures() ? 'My totals' : 'Analyst totals',
    columns:['Analyst','Role','Assigned','Closed','Escalated','Incidents raised','Critical handled','MTTA','Avg time to escalate','MTTR','False positive %','Closure rate %'], rows}};
}
function analystReport(key, title, from, to){
  const own = onlyOwnFigures();
  let list = inPeriod(reportAlerts(), from, to).filter(a => a.owner && a.owner !== 'unassigned');
  if(own) list = list.filter(a => a.owner === CURRENT_USER.id);
  const s = alertStats(list), {section} = analystSection(list);
  section.name = own ? 'My performance' : 'Analysts';
  return {key, title: own ? title.replace('Analyst Performance', 'My Performance') : title,
    desc: own ? 'Your own workload, closures, escalations, incidents and response times. Team figures are visible to team leads and admins.'
              : 'Workload, closures, escalations, incidents raised and response times per analyst.',
    periodText: periodText(from, to),
    kpis:[[own ? 'Alerts owned' : 'Analysts', own ? s.total : section.rows.length], ['Closed', s.closed], ['Escalated', s.escalated], ['Incidents raised', s.incidents],
          ['MTTA', fmtMins(s.mtta)], ['MTTR', fmtMins(s.mttr)], ['Alerts handled', s.total], ['Avg time to escalate', fmtMins(s.mtte)]],
    spark: own ? [] : section.rows.map(r => ({label: r[0].split(' ')[0], value: r[3]})),
    preview: {columns:['Analyst','Assigned','Closed','Escalated','Incidents','MTTR'], rows: section.rows.map(r => [r[0], r[2], r[3], r[4], r[5], r[9]])},
    sections: own ? [section, escalationSection(list), incidentSection(list), alertListSection(list)] : [section]};
}
function buildAnalystReport(now){
  now = now || new Date();
  return analystReport('analysts', 'Analyst Performance Report (30 days)', new Date(now - 30*86400000), now);
}

/* ---------- 6. Custom period ---------- */
function buildCustomReport(opts){
  const from = new Date(opts.from), to = new Date(opts.to);
  if(opts.kind === 'analysts') return Object.assign(analystReport('custom', 'Analyst Performance Report — custom period', from, to), {custom:true});
  const list = inPeriod(reportAlerts(), from, to), s = alertStats(list);
  const spanDays = (to - from) / 86400000;
  let trend;
  if(spanDays <= 2){
    const hours = [];
    for(let t = new Date(from); t < to; t = new Date(t.getTime() + 3600000))
      hours.push({label: fmtDateTime(t), from: t, to: new Date(t.getTime() + 3600000)});
    trend = trendSection('Hourly trend', 'Hour', list, hours);
  } else if(spanDays <= 62){
    trend = trendSection('Daily trend', 'Date', list, dayBuckets(from, to));
  } else {
    const weeks = [];
    for(let w = new Date(from); w <= to; w = new Date(w.getTime() + 7*86400000))
      weeks.push({label: w.toLocaleDateString(undefined,{day:'2-digit', month:'short', year:'numeric'}), from: w, to: new Date(w.getTime() + 7*86400000)});
    trend = trendSection('Weekly trend', 'Week starting', list, weeks);
  }
  return {key:'custom', custom:true, title:'SOC Activity Report — custom period',
    desc:'Volume, severity, escalations, incidents, sources, techniques and the full alert list for the dates you picked.',
    periodText: periodText(from, to), kpis: baseKpis(s),
    spark: trend.rows.map(r => ({label: String(r[0]), value: r[1]})),
    preview: {columns:[trend.columns[0],'Alerts','Critical','Escalated','Incidents','Closed'], rows: trend.rows.map(r => [r[0],r[1],r[2],r[7],r[8],r[9]])},
    sections:[trend, severitySection(list), sourceSection(list), escalationSection(list), incidentSection(list), techniqueSection(list), analystSection(list).section, alertListSection(list)]};
}
/* Earliest alert date we hold, for the custom period picker. */
function reportDataStart(){
  const all = reportAlerts();
  return all.reduce((m,a) => a.createdAt < m ? a.createdAt : m, new Date());
}

const REPORT_BUILDERS = {daily:buildDailyReport, weekly:buildWeeklyReport, monthly:buildMonthlyReport, integrations:buildIntegrationReport, analysts:buildAnalystReport};

/* Report → sheets: a Summary sheet, then one sheet per section. */
function reportToSheets(r){
  const by = CURRENT_USER ? CURRENT_USER.name : '';
  const summary = {name:'Summary', rows:[
    {cells:[r.title], style:'title'},
    {cells:['Generated', fmtDateTime(new Date())]},
    {cells:['Period', r.periodText]},
    {cells:['Generated by', by]},
    {cells:['Data', 'Sample data (proof of concept) plus live alerts']},
    {cells:[]},
    {cells:['Metric','Value'], style:'header'},
    ...r.kpis.map(k => ({cells:[k[0], k[1]]}))
  ]};
  return [summary, ...r.sections.map(sec => tableSheet(sec.name, sec.columns, sec.rows))];
}
function exportReport(key, format, opts){
  const r = key === 'custom' ? buildCustomReport(opts) : REPORT_BUILDERS[key]();
  let base = 'unified-soar_' + safeFileName(r.title.replace(/ — custom period/,''));
  if(key === 'custom') base += '_' + fmtDateTime(new Date(opts.from)).slice(0,10) + '_to_' + fmtDateTime(new Date(opts.to)).slice(0,10);
  const sheets = reportToSheets(r);
  if(format === 'xlsx') exportXLSX(base, sheets); else exportCSV(base, sheets);
}
