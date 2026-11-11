/* =========================================================
   HELPERS
========================================================= */
function ageText(mins){
  if(mins<60) return mins+' min ago';
  const h=Math.floor(mins/60), m=mins%60;
  return h+'h '+m+'m ago';
}
function avatar(analyst, size){
  size = size||32;
  return `<div class="avatar" style="width:${size}px;height:${size}px;flex:0 0 ${size}px;font-size:${size*0.36}px;">${analyst.initials}</div>`;
}
function riskColor(score){
  if(score>=80) return 'var(--critical)';
  if(score>=55) return 'var(--high)';
  if(score>=30) return 'var(--medium)';
  return 'var(--success)';
}
function riskLevel(score){
  if(score>=80) return 'CRITICAL';
  if(score>=55) return 'HIGH';
  if(score>=30) return 'MODERATE';
  return 'LOW';
}
function getAlert(id){ return ALERTS.find(a=>a.id===id); }
function fmtSrcShort(key){ return SRC_LABEL[key] || key; }

function riskGauge(score){
  const r=62, c=2*Math.PI*r, pct=Math.min(score,100)/100, dash=c*pct;
  const col = riskColor(score);
  return `
  <div class="risk-widget">
    <svg viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--bg-3)" stroke-width="11"/>
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round"
        stroke-dasharray="${dash} ${c}" transform="rotate(-90 75 75)"/>
    </svg>
    <div class="risk-num" style="color:${col}">${score}</div>
    <div class="risk-max">/ 100</div>
    <div class="risk-label" style="color:${col};background:${col}22;">${riskLevel(score)}</div>
  </div>`;
}
