/* =========================================================
   REPORTS ENGINE
   Each builder returns one report object:
     { key, title, desc, periodText,
       kpis:     [[label, value], ...]          headline numbers
       spark:    [{label, value}, ...]          mini bar chart (optional)
       preview:  {columns, rows}                mini table in the card
       sections: [{name, columns, rows}, ...]   full data, exported }
   Data: live alerts (ALERTS) + the 30-day sample history.
========================================================= */
const REPORT_SEVERITIES = ['Critical','High','Medium','Low','Informational'];

/* Live alerts + sample history, in one shape. */
function reportAlerts(){
  const now = Date.now();
  const live = ALERTS.map(a=>({
    id:a.id, name:a.name, source:a.source, severity:a.severity,
    owner:a.owner, status:a.status, createdAt:new Date(now - a.created*60000),
    ackMins:null, resolveMins:null, disposition:null,
    tactic:a.mitreTacTag, technique:a.mitreTechnique, sample:false
  }));
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
function analystName(id){ return (ANALYSTS[id] && ANALYSTS[id].name) || (id === 'unassigned' ? 'Unassigned' : id); }

function alertStats(list){
  const closed = list.filter(a => a.status === 'Closed');
  const withDisp = closed.filter(a => a.disposition);
  return {
    total: list.length,
    sev: Object.fromEntries(REPORT_SEVERITIES.map(s => [s, list.filter(a => a.severity === s).length])),
    closed: closed.length,
    open: list.filter(a => a.status !== 'Closed').length,
    escalated: list.filter(a => a.status === 'Escalated').length,
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
  return {name:'By source', columns:['Source','Alerts','Critical','High','Closed','MTTA','MTTR','False positive %'],
    rows: INTEGRATIONS.map(i=>{
      const l = list.filter(a => a.source === i.key), s = alertStats(l);
      return [i.name, s.total, s.sev.Critical, s.sev.High, s.closed, fmtMins(s.mtta), fmtMins(s.mttr), s.fp];
    })};
}
function severitySection(list){
  return {name:'By severity', columns:['Severity','Alerts','Closed','Open','MTTA','MTTR'],
    rows: REPORT_SEVERITIES.map(sev=>{
      const l = list.filter(a => a.severity === sev), s = alertStats(l);
      return [sev, s.total, s.closed, s.open, fmtMins(s.mtta), fmtMins(s.mttr)];
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
function alertListSection(list){
  return {name:'Alerts', columns:['Alert ID','Created','Alert','Severity','Source','Owner','Status','Disposition','Time to ack (min)','Time to resolve (min)','Tactic','Technique','Data'],
    rows: list.slice().sort((a,b)=>b.createdAt-a.createdAt).map(a => [
      a.id, a.createdAt, a.name, a.severity, SRC_LABEL[a.source]||a.source, analystName(a.owner), a.status,
      a.disposition||'', a.ackMins, a.resolveMins, a.tactic, a.technique, a.sample ? 'Sample' : 'Live'])};
}
function baseKpis(s){
  return [['Alerts', s.total], ['Critical', s.sev.Critical], ['High', s.sev.High], ['Closed', s.closed],
          ['Open', s.open], ['MTTA', fmtMins(s.mtta)], ['MTTR', fmtMins(s.mttr)], ['False positive %', s.fp + '%']];
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
    preview: {columns:['Severity','Alerts','Closed','Open','MTTA'], rows: sev.rows.map(r => r.slice(0,5))},
    sections:[sev, sourceSection(list), tacticSection(list), alertListSection(list)]};
}

/* ---------- 2. Last 7 days ---------- */
function buildWeeklyReport(now){
  now = now || new Date();
  const start = new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate()-6);
  const list = inPeriod(reportAlerts(), start, now), s = alertStats(list);
  const days = [];
  for(let i=0; i<7; i++){
    const d0 = new Date(start); d0.setDate(start.getDate()+i);
    const d1 = new Date(d0); d1.setDate(d0.getDate()+1);
    const l = list.filter(a => a.createdAt >= d0 && a.createdAt < d1), ds = alertStats(l);
    days.push({d0, l, ds});
  }
  const dayLabel = d => d.toLocaleDateString(undefined, {weekday:'short', day:'2-digit', month:'short'});
  const trend = {name:'Daily trend', columns:['Date','Alerts','Critical','High','Medium','Low','Informational','Closed','MTTA','MTTR'],
    rows: days.map(({d0,ds}) => [dayLabel(d0), ds.total, ds.sev.Critical, ds.sev.High, ds.sev.Medium, ds.sev.Low, ds.sev.Informational, ds.closed, fmtMins(ds.mtta), fmtMins(ds.mttr)])};
  return {key:'weekly', title:'Weekly SOC Report', desc:'Seven-day trend by day and severity, response times, busiest sources and the techniques seen most.',
    periodText: periodText(start, now), kpis: baseKpis(s),
    spark: days.map(({d0,ds}) => ({label: d0.toLocaleDateString(undefined,{weekday:'short'}), value: ds.total})),
    preview: {columns:['Date','Alerts','Critical','High','Closed','MTTA'], rows: trend.rows.map(r => [r[0],r[1],r[2],r[3],r[7],r[8]])},
    sections:[trend, sourceSection(list), severitySection(list), techniqueSection(list), alertListSection(list)]};
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
    const ws = alertStats(list.filter(a => a.createdAt >= w0 && a.createdAt < w1));
    weeks.push([w0.toLocaleDateString(undefined,{day:'2-digit', month:'short'}), ws.total, ws.sev.Critical, ws.sev.High, ws.closed, fmtMins(ws.mtta), fmtMins(ws.mttr), ws.fp]);
  }
  const trend = {name:'Weekly trend', columns:['Week starting','Alerts','Critical','High','Closed','MTTA','MTTR','False positive %'], rows: weeks};
  const spark = [];
  for(let i=0; i<30; i++){
    const d0 = new Date(start); d0.setDate(start.getDate()+i);
    const d1 = new Date(d0); d1.setDate(d0.getDate()+1);
    spark.push({label: d0.toLocaleDateString(undefined,{day:'2-digit', month:'short'}), value: list.filter(a => a.createdAt >= d0 && a.createdAt < d1).length});
  }
  return {key:'monthly', title:'Monthly Executive Report', desc:'Thirty-day posture for leadership: weekly trend, true/false positive rates, sources, tactics and team totals.',
    periodText: periodText(start, now),
    kpis: baseKpis(s).slice(0,4).concat([['True positive %', s.tp + '%'], ['False positive %', s.fp + '%'], ['MTTA', fmtMins(s.mtta)], ['MTTR', fmtMins(s.mttr)]]),
    spark, preview: {columns:['Week starting','Alerts','Critical','Closed','MTTR'], rows: weeks.map(r => [r[0],r[1],r[2],r[4],r[6]])},
    sections:[trend, sourceSection(list), severitySection(list), tacticSection(list), analystSection(list).section, alertListSection(list)]};
}

/* ---------- 4. Integration health ---------- */
function buildIntegrationReport(now){
  now = now || new Date();
  const all = reportAlerts();
  const d1 = inPeriod(all, new Date(now - 86400000), now), d7 = inPeriod(all, new Date(now - 7*86400000), now);
  const rows = INTEGRATIONS.map(i => [i.name, i.type, i.status, i.apiStatus, i.health, i.latency, i.lastSync, i.lastFail,
    d1.filter(a => a.source === i.key).length, d7.filter(a => a.source === i.key).length, i.syncSuccess7d, i.failedSyncs7d, i.ingestDelay]);
  const healthy = INTEGRATIONS.filter(i => i.health === 'Healthy').length;
  const latencies = INTEGRATIONS.map(i => parseInt(i.latency,10)).filter(n => !isNaN(n));
  return {key:'integrations', title:'Integration Health Report', desc:'Connection status, API health, latency, sync reliability and alert volume for every connected security tool.',
    periodText: 'Current status · volumes for last 24 h / 7 days',
    kpis:[['Integrations', INTEGRATIONS.length], ['Healthy', healthy], ['Degraded', INTEGRATIONS.length - healthy], ['Alerts (24 h)', d1.length],
          ['Avg latency', Math.round(avg(latencies)) + ' ms'], ['Lowest sync success', Math.min(...INTEGRATIONS.map(i=>i.syncSuccess7d)) + '%']],
    spark: INTEGRATIONS.map(i => ({label: SRC_LABEL[i.key], value: d7.filter(a => a.source === i.key).length})),
    preview: {columns:['Integration','Health','Latency','Sync success 7 d','Alerts 24 h'], rows: rows.map(r => [r[0], r[4], r[5], r[10] + '%', r[8]])},
    sections:[{name:'Integrations', columns:['Integration','Type','Status','API status','Health','Latency','Last sync','Last failure','Alerts (24 h)','Alerts (7 d)','Sync success 7 d (%)','Failed syncs (7 d)','Avg ingest delay'], rows}]};
}

/* ---------- 5. Analyst performance ---------- */
function analystSection(list){
  const ids = Object.keys(ANALYSTS).filter(id => id !== 'unassigned' && list.some(a => a.owner === id));
  const rows = ids.map(id=>{
    const l = list.filter(a => a.owner === id), s = alertStats(l);
    return [analystName(id), (ANALYSTS[id]||{}).role || '', s.total, s.closed, s.escalated, s.sev.Critical, fmtMins(s.mtta), fmtMins(s.mttr), s.fp, pct(s.closed, s.total)];
  }).sort((a,b)=>b[2]-a[2]);
  return {ids, section:{name:'Analyst totals', columns:['Analyst','Role','Assigned','Closed','Escalated','Critical handled','MTTA','MTTR','False positive %','Closure rate %'], rows}};
}
function buildAnalystReport(now){
  now = now || new Date();
  const start = new Date(now - 30*86400000);
  const list = inPeriod(reportAlerts(), start, now).filter(a => a.owner && a.owner !== 'unassigned');
  const s = alertStats(list), {section} = analystSection(list);
  section.name = 'Analysts';
  return {key:'analysts', title:'Analyst Performance Report', desc:'Workload, closures, escalations and response times per analyst over the last 30 days.',
    periodText: periodText(start, now),
    kpis:[['Analysts', section.rows.length], ['Alerts handled', s.total], ['Closed', s.closed], ['Team MTTA', fmtMins(s.mtta)], ['Team MTTR', fmtMins(s.mttr)], ['Escalated', s.escalated]],
    spark: section.rows.map(r => ({label: r[0].split(' ')[0], value: r[3]})),
    preview: {columns:['Analyst','Assigned','Closed','MTTA','MTTR'], rows: section.rows.map(r => [r[0], r[2], r[3], r[6], r[7]])},
    sections:[section]};
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
function exportReport(key, format){
  const r = REPORT_BUILDERS[key]();
  const base = 'unified-soar_' + safeFileName(r.title);
  const sheets = reportToSheets(r);
  if(format === 'xlsx') exportXLSX(base, sheets); else exportCSV(base, sheets);
}
