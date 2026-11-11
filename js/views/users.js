/* =========================================================
   VIEW: USERS (admins only)
   Reads/updates go through row-level security; creating users,
   resetting passwords/MFA and disabling logins go through the
   admin-users Edge Function, which holds the secret key.
========================================================= */
let USERS_CACHE = [];

function viewUsers(){
  if(!hasRole('admin')) return `<div class="card"><div class="empty-tab">${ICON.shield}<div>Administrators only.</div></div></div>`;
  return `
  <div class="section-head"><h2>Users &amp; Roles</h2><span class="hint">Accounts that can sign in to this console</span></div>

  <div class="notice" id="users-msg" style="display:none;"></div>

  <div class="card" style="margin-bottom:16px;">
    <div style="font-size:12.5px;font-weight:600;margin-bottom:12px;">Add user</div>
    <form id="user-create" class="user-form">
      <input id="nu-name" placeholder="Full name" maxlength="120" required>
      <input id="nu-email" type="email" placeholder="Email" required>
      <select id="nu-role">${Object.entries(ROLE_LABELS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>
      <button class="btn primary" type="submit">${ICON.assign}Create user</button>
    </form>
    <div id="temp-pw" class="temp-pw" style="display:none;"></div>
  </div>

  <div class="tbl-wrap" style="margin-bottom:22px;">
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>First login</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody id="users-body"><tr><td colspan="7" style="text-align:center;padding:26px;color:var(--text-muted);">Loading users…</td></tr></tbody>
    </table>
  </div>

  <div class="section-head"><h2>User administration log</h2><span class="hint">Last 50 changes · append-only</span></div>
  <div class="tbl-wrap">
    <table>
      <thead><tr><th>Time</th><th>By</th><th>Action</th><th>User</th><th>Change</th></tr></thead>
      <tbody id="users-audit"><tr><td colspan="5" style="text-align:center;padding:26px;color:var(--text-muted);">Loading…</td></tr></tbody>
    </table>
  </div>`;
}

function usersMsg(text, kind){
  const el = document.getElementById('users-msg');
  if(!el) return;
  el.style.display = text ? 'flex' : 'none';
  el.className = 'notice ' + (kind==='error' ? 'notice-error' : 'notice-ok');
  el.textContent = text || '';
}

async function adminCall(payload){
  const {data, error} = await SB.functions.invoke('admin-users', {body:payload});
  if(error){
    let msg = error.message;
    try{ const b = await error.context.json(); if(b && b.error) msg = b.error; }catch(_){}
    throw new Error(msg);
  }
  return data;
}

function showTempPassword(email, pw, why){
  const box = document.getElementById('temp-pw');
  box.style.display = 'block';
  box.innerHTML = `
    <div><b>${esc(why)}</b> for <span class="mono">${esc(email)}</span>. Temporary password (shown once — give it to them privately):</div>
    <div class="temp-pw-row"><code id="temp-pw-val">${esc(pw)}</code><button class="btn" id="temp-pw-copy" type="button">Copy</button><button class="btn ghost" id="temp-pw-hide" type="button">Done</button></div>
    <div class="note-hint">They'll be asked to set up MFA and choose their own password at first sign-in.</div>`;
  document.getElementById('temp-pw-copy').onclick = ()=>{ navigator.clipboard && navigator.clipboard.writeText(pw); document.getElementById('temp-pw-copy').textContent='Copied'; };
  document.getElementById('temp-pw-hide').onclick = ()=>{ box.style.display='none'; box.innerHTML=''; };
}

async function initUsersView(){
  if(!hasRole('admin')) return;
  document.getElementById('user-create').addEventListener('submit', async e=>{
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const email = document.getElementById('nu-email').value.trim();
    btn.disabled = true; usersMsg('');
    try{
      const r = await adminCall({
        action:'create_user', email,
        full_name: document.getElementById('nu-name').value.trim(),
        role: document.getElementById('nu-role').value
      });
      e.target.reset();
      showTempPassword(email, r.temp_password, 'User created');
      await loadUsers();
    }catch(err){ usersMsg('Could not create user: '+err.message, 'error'); }
    btn.disabled = false;
  });
  await loadUsers();
}

async function loadUsers(){
  const body = document.getElementById('users-body');
  if(!body) return;
  const {data, error} = await SB.from('profiles').select('*').order('created_at');
  if(error){ body.innerHTML = `<tr><td colspan="7" style="color:var(--critical);padding:20px;">${esc(error.message)}</td></tr>`; return; }
  USERS_CACHE = data;
  body.innerHTML = data.map(userRow).join('');
  body.querySelectorAll('[data-role-for]').forEach(sel=>sel.addEventListener('change', ()=>changeRole(sel.dataset.roleFor, sel.value, sel)));
  body.querySelectorAll('[data-uact]').forEach(b=>b.addEventListener('click', ()=>userAction(b.dataset.uact, b.dataset.id)));
  loadUserAudit();
}

function userRow(u){
  const self = u.id === CURRENT_USER.id;
  const roleCell = self
    ? `${esc(ROLE_LABELS[u.role]||u.role)} <span class="note-hint">(you)</span>`
    : `<select class="role-select" data-role-for="${u.id}">${Object.entries(ROLE_LABELS).map(([v,l])=>`<option value="${v}" ${u.role===v?'selected':''}>${l}</option>`).join('')}</select>`;
  return `
  <tr style="cursor:default;">
    <td><span class="owner-cell"><span class="mini-av">${esc(profileToAnalyst(u).initials)}</span>${esc(u.full_name||'—')}</span></td>
    <td class="mono" style="font-family:var(--font-mono);font-size:12px;">${esc(u.email)}</td>
    <td>${roleCell}</td>
    <td><span class="status-pill ${u.is_active?'Closed':'Escalated'}">${u.is_active?'Active':'Disabled'}</span></td>
    <td>${u.must_change_password?'<span class="status-pill Investigating">Pending</span>':'<span class="note-hint">Done</span>'}</td>
    <td class="age-cell">${new Date(u.created_at).toLocaleDateString()}</td>
    <td><div class="action-cell">
      <button class="btn ghost btn-xs" data-uact="reset_password" data-id="${u.id}">Reset password</button>
      ${self?'':`<button class="btn ghost btn-xs" data-uact="reset_mfa" data-id="${u.id}">Reset MFA</button>
      <button class="btn ${u.is_active?'danger':'success'} btn-xs" data-uact="${u.is_active?'disable':'enable'}" data-id="${u.id}">${u.is_active?'Disable':'Enable'}</button>`}
    </div></td>
  </tr>`;
}

async function changeRole(id, role, sel){
  const u = USERS_CACHE.find(x=>x.id===id);
  if(!confirm(`Change ${u.email} to ${ROLE_LABELS[role]}?`)){ sel.value = u.role; return; }
  const {data, error} = await SB.from('profiles').update({role}).eq('id', id).select();
  if(error || !data || !data.length){ usersMsg('Role change failed: '+(error?error.message:'not permitted'), 'error'); sel.value = u.role; return; }
  usersMsg(`${u.email} is now ${ROLE_LABELS[role]}.`);
  loadUsers();
}

async function userAction(act, id){
  const u = USERS_CACHE.find(x=>x.id===id);
  const prompts = {
    reset_password:`Reset the password for ${u.email}? Their current password stops working immediately.`,
    reset_mfa:`Remove MFA for ${u.email}? They'll set it up again at next sign-in. Only do this if they lost their phone.`,
    disable:`Disable ${u.email}? They won't be able to sign in.`,
    enable:`Enable ${u.email} again?`
  };
  if(!confirm(prompts[act])) return;
  usersMsg('');
  try{
    if(act==='reset_password'){
      const r = await adminCall({action:'reset_password', user_id:id});
      showTempPassword(u.email, r.temp_password, 'Password reset');
    }else if(act==='reset_mfa'){
      await adminCall({action:'reset_mfa', user_id:id});
      usersMsg(`MFA removed for ${u.email}.`);
    }else{
      await adminCall({action:'set_active', user_id:id, active: act==='enable'});
      usersMsg(`${u.email} ${act==='enable'?'enabled':'disabled'}.`);
    }
    loadUsers();
  }catch(err){ usersMsg(err.message, 'error'); }
}

async function loadUserAudit(){
  const body = document.getElementById('users-audit');
  if(!body) return;
  const {data, error} = await SB.from('audit_log').select('*').eq('target_type','user').order('created_at',{ascending:false}).limit(50);
  if(error){ body.innerHTML = `<tr><td colspan="5" style="color:var(--critical);padding:20px;">${esc(error.message)}</td></tr>`; return; }
  const emailOf = id => (USERS_CACHE.find(x=>x.id===id)||{}).email || id;
  const fmt = v => v && Object.keys(v).length ? Object.entries(v).map(([k,x])=>`${k}: ${x}`).join(', ') : '';
  body.innerHTML = data.length ? data.map(e=>`
    <tr style="cursor:default;">
      <td style="font-family:var(--font-mono);font-size:11.5px;">${esc(new Date(e.created_at).toLocaleString())}</td>
      <td>${esc(e.actor_email||'system')}</td>
      <td>${esc(e.action)}</td>
      <td class="mono" style="font-family:var(--font-mono);font-size:12px;">${esc(emailOf(e.target_id))}</td>
      <td style="color:var(--text-secondary);white-space:normal;">${esc([fmt(e.old_value), fmt(e.new_value)].filter(Boolean).join(' → '))}</td>
    </tr>`).join('') : `<tr><td colspan="5" style="text-align:center;padding:26px;color:var(--text-muted);">No changes yet.</td></tr>`;
}
