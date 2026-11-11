/* =========================================================
   EVENT HANDLERS (attached per-render)
========================================================= */
function attachViewHandlers(){
  const root = document.getElementById('view-root');

  root.querySelectorAll('[data-open-alert]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.stopPropagation();
      setView('alert-detail', el.getAttribute('data-open-alert'));
    });
  });

  root.querySelectorAll('[data-back-to-alerts]').forEach(el=>{
    el.addEventListener('click', ()=> setView('alerts'));
  });

  root.querySelectorAll('[data-tab]').forEach(el=>{
    el.addEventListener('click', ()=>{
      STATE.tab = el.getAttribute('data-tab');
      document.getElementById('view-root').innerHTML = viewAlertDetail();
      attachViewHandlers();
    });
  });

  root.querySelectorAll('[data-filter]').forEach(el=>{
    el.addEventListener('change', ()=>{
      STATE.filters[el.getAttribute('data-filter')] = el.value;
      renderView();
    });
  });
  const tblSearch = document.getElementById('tbl-search-input');
  if(tblSearch){
    tblSearch.addEventListener('input', e=>{
      STATE.filters.search = e.target.value;
      renderView();
      const el = document.getElementById('tbl-search-input');
      if(el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  }

  root.querySelectorAll('[data-quick]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.stopPropagation();
      quickAction(el.getAttribute('data-quick'), el.getAttribute('data-id'));
    });
  });

  root.querySelectorAll('[data-act]').forEach(el=>{
    el.addEventListener('click', ()=> detailAction(el.getAttribute('data-act')) );
  });

  root.querySelectorAll('[data-toggle-pb]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const idx = +el.getAttribute('data-toggle-pb');
      PLAYBOOKS[idx].enabled = !PLAYBOOKS[idx].enabled;
      renderView();
    });
  });
}

function quickAction(action, id){
  const a = getAlert(id);
  if(!a) return;
  const now = nowLabel();
  if(action==='claim'){
    a.owner = CURRENT_USER.id;
    if(a.status==='New') a.status='Investigating';
    a.timeline.push({time:now, text:CURRENT_USER.name.split(' ')[0]+' took ownership', actor:CURRENT_USER.name});
  } else if(action==='investigate'){
    a.status = 'Investigating';
    if(a.owner==='unassigned') a.owner = CURRENT_USER.id;
    a.timeline.push({time:now, text:'Investigation started', actor:CURRENT_USER.name});
  } else if(action==='escalate'){
    a.status = 'Escalated';
    a.timeline.push({time:now, text:'Escalated to Team Leader', actor:CURRENT_USER.name});
  } else if(action==='close'){
    a.status = 'Closed';
    a.timeline.push({time:now, text:'Alert closed by '+CURRENT_USER.name, actor:CURRENT_USER.name});
  }
  renderShellNavOnly();
  renderView();
}

function nowLabel(){
  const d = new Date();
  return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
}

function detailAction(act){
  const a = getAlert(STATE.selectedAlertId);
  if(!a) return;
  const now = nowLabel();
  if(act==='claim'){
    a.owner = CURRENT_USER.id;
    if(a.status==='New') a.status='Investigating';
    a.timeline.push({time:now, text:CURRENT_USER.name.split(' ')[0]+' took ownership', actor:CURRENT_USER.name});
  } else if(act==='reassign'){
    const others = Object.values(ANALYSTS).filter(x=>x.id!==a.owner && x.id!=='unassigned');
    a.owner = others[0].id;
    a.timeline.push({time:now, text:'Reassigned to '+others[0].name, actor:CURRENT_USER.name});
  } else if(act==='escalate'){
    a.status = 'Escalated';
    a.timeline.push({time:now, text:'Escalated to Team Leader', actor:CURRENT_USER.name});
  } else if(act==='closealert'){
    a.status = 'Closed';
    a.syncStatus = 'Synchronized';
    a.timeline.push({time:now, text:'Alert closed by '+CURRENT_USER.name, actor:CURRENT_USER.name});
    a.timeline.push({time:now, text:fmtSrcShort(a.source)+' detection successfully closed', actor:'System'});
  } else if(act==='gotonote'){
    STATE.tab='investigation';
  } else if(act==='addnote'){
    const ta = document.getElementById('note-input');
    if(ta && ta.value.trim()){
      a.notes.push({author:CURRENT_USER.name, time:now, text:ta.value.trim()});
      a.timeline.push({time:now, text:'Note added', actor:CURRENT_USER.name, quote: ta.value.trim().length>80?ta.value.trim().slice(0,80)+'…':ta.value.trim()});
    }
  }
  renderShellNavOnly();
  document.getElementById('view-root').innerHTML = viewAlertDetail();
  attachViewHandlers();
}
