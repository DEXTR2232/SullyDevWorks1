/* =========================================================
   AUTH: login → MFA (TOTP) → first-login password change → app
   Security is enforced by Supabase (row-level security requires an
   MFA-verified session). These screens only guide the user through it.
========================================================= */
let SB = null;          // Supabase client
let PROFILE = null;     // signed-in user's row from public.profiles
let APP_STARTED = false;

const MIN_PASSWORD = 12;

function initSupabase(){
  if(!window.supabase || !window.supabase.createClient){
    throw new Error('Supabase library failed to load (check your internet connection).');
  }
  SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth:{persistSession:true, autoRefreshToken:true}
  });
  SB.auth.onAuthStateChange(event=>{
    if(event==='SIGNED_OUT' && APP_STARTED){ APP_STARTED=false; PROFILE=null; showLogin('You have been signed out.'); }
  });
}

/* ---------- screen helpers ---------- */
function authScreen(title, sub, body){
  document.getElementById('app').innerHTML = `
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-brand"><div class="brand-mark">${ICON.shield}</div><div><div class="name">Unified SOAR</div><div class="sub">Security Operations Center</div></div></div>
      <h1 class="auth-title">${title}</h1>
      ${sub?`<p class="auth-sub">${sub}</p>`:''}
      <div class="auth-msg" id="auth-msg" role="alert"></div>
      ${body}
    </div>
  </div>`;
}
function authMsg(text, kind){
  const el = document.getElementById('auth-msg');
  if(!el) return;
  el.textContent = text || '';
  el.className = 'auth-msg' + (text ? ' show '+(kind||'error') : '');
}
function busy(btn, on, label){
  if(!btn) return;
  btn.disabled = on;
  if(on){ btn.dataset.label = btn.textContent; btn.textContent = label||'Please wait…'; }
  else if(btn.dataset.label){ btn.textContent = btn.dataset.label; }
}
function showLoading(text){
  document.getElementById('app').innerHTML = `<div class="auth-wrap"><div class="auth-loading">${esc(text||'Loading…')}</div></div>`;
}

/* ---------- boot ---------- */
async function bootAuth(){
  showLoading('Connecting…');
  try{ initSupabase(); }
  catch(e){ return authScreen('Cannot start', esc(e.message), ''); }
  const {data:{session}} = await SB.auth.getSession();
  if(!session) return showLogin();
  return continueAuth();
}

async function continueAuth(){
  const {data:aal, error} = await SB.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error) return showLogin(error.message);
  if(aal.currentLevel==='aal2') return afterMfa();

  const {data:f, error:fErr} = await SB.auth.mfa.listFactors();
  if(fErr) return showLogin(fErr.message);
  const verified = (f.totp||[]).filter(x=>x.status==='verified');
  if(verified.length) return showMfaVerify(verified[0]);
  return showMfaEnroll();
}

async function afterMfa(){
  const {data:{user}} = await SB.auth.getUser();
  if(!user) return showLogin();
  const {data:p, error} = await SB.from('profiles').select('*').eq('id', user.id).single();
  if(error || !p){
    await SB.auth.signOut();
    return showLogin('Your account has no profile. Ask an administrator.');
  }
  if(!p.is_active){
    await SB.auth.signOut();
    return showLogin('Your account is disabled. Ask an administrator.');
  }
  if(p.must_change_password) return showChangePassword(p);
  startApp(p);
}

/* ---------- 1. email + password ---------- */
function showLogin(message){
  authScreen('Sign in', 'Use the account your administrator created for you.', `
    <form id="login-form" class="auth-form" autocomplete="on">
      <label>Email<input type="email" id="login-email" autocomplete="username" required></label>
      <label>Password<input type="password" id="login-password" autocomplete="current-password" required></label>
      <button class="btn primary auth-btn" type="submit">Sign in</button>
    </form>`);
  if(message) authMsg(message, message.startsWith('You have been') ? 'info' : 'error');
  document.getElementById('login-email').focus();
  document.getElementById('login-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const btn = e.target.querySelector('button');
    busy(btn, true, 'Signing in…'); authMsg('');
    const {error} = await SB.auth.signInWithPassword({
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    });
    if(error){
      busy(btn, false);
      return authMsg(/banned/i.test(error.message) ? 'Your account is disabled. Ask an administrator.' : 'Invalid email or password.');
    }
    continueAuth();
  });
}

/* ---------- 2a. first time: set up authenticator app ---------- */
async function showMfaEnroll(){
  showLoading('Preparing MFA setup…');
  // Remove any half-finished setup from an earlier attempt.
  const {data:f} = await SB.auth.mfa.listFactors();
  for(const x of (f && f.all) || []){
    if(x.factor_type==='totp' && x.status!=='verified') await SB.auth.mfa.unenroll({factorId:x.id});
  }
  const {data, error} = await SB.auth.mfa.enroll({factorType:'totp', friendlyName:'Unified SOAR '+new Date().toISOString().slice(0,16)});
  if(error) return showLogin('Could not start MFA setup: '+error.message);

  authScreen('Set up two-factor authentication', 'MFA is required for every account. Scan this code with Microsoft Authenticator, Google Authenticator or any TOTP app.', `
    <div class="mfa-qr"><img src="${esc(data.totp.qr_code)}" alt="MFA QR code" width="180" height="180"></div>
    <details class="mfa-secret"><summary>Can't scan? Enter this key manually</summary><code>${esc(data.totp.secret)}</code></details>
    <form id="mfa-form" class="auth-form">
      <label>6-digit code from the app<input id="mfa-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
      <button class="btn primary auth-btn" type="submit">Verify and continue</button>
    </form>
    <button class="auth-link" id="auth-cancel">Cancel and sign out</button>`);
  wireMfaForm(data.id);
}

/* ---------- 2b. returning user: enter code ---------- */
function showMfaVerify(factor){
  authScreen('Two-factor authentication', 'Enter the 6-digit code from your authenticator app.', `
    <form id="mfa-form" class="auth-form">
      <label>Code<input id="mfa-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
      <button class="btn primary auth-btn" type="submit">Verify</button>
    </form>
    <p class="auth-foot">Lost your phone? Ask an administrator to reset your MFA.</p>
    <button class="auth-link" id="auth-cancel">Cancel and sign out</button>`);
  wireMfaForm(factor.id);
}

function wireMfaForm(factorId){
  const input = document.getElementById('mfa-code');
  input.focus();
  document.getElementById('auth-cancel').addEventListener('click', signOut);
  document.getElementById('mfa-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const btn = e.target.querySelector('button');
    busy(btn, true, 'Verifying…'); authMsg('');
    const {error} = await SB.auth.mfa.challengeAndVerify({factorId, code: input.value.trim()});
    if(error){ busy(btn, false); input.value=''; input.focus(); return authMsg('That code did not work. Wait for a new code and try again.'); }
    afterMfa();
  });
}

/* ---------- 3. first login: replace the temporary password ---------- */
function showChangePassword(p){
  authScreen('Choose your password', `Welcome${p.full_name?', '+esc(p.full_name.split(' ')[0]):''}. Replace the temporary password you were given.`, `
    <form id="pw-form" class="auth-form">
      <label>New password<input type="password" id="pw-1" autocomplete="new-password" minlength="${MIN_PASSWORD}" required></label>
      <label>Confirm new password<input type="password" id="pw-2" autocomplete="new-password" minlength="${MIN_PASSWORD}" required></label>
      <p class="auth-hint">At least ${MIN_PASSWORD} characters. A passphrase works well.</p>
      <button class="btn primary auth-btn" type="submit">Save password</button>
    </form>
    <button class="auth-link" id="auth-cancel">Cancel and sign out</button>`);
  document.getElementById('pw-1').focus();
  document.getElementById('auth-cancel').addEventListener('click', signOut);
  document.getElementById('pw-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const a = document.getElementById('pw-1').value, b = document.getElementById('pw-2').value;
    if(a.length < MIN_PASSWORD) return authMsg(`Use at least ${MIN_PASSWORD} characters.`);
    if(a !== b) return authMsg('The two passwords do not match.');
    const btn = e.target.querySelector('button');
    busy(btn, true, 'Saving…'); authMsg('');
    const {error} = await SB.auth.updateUser({password:a});
    if(error){ busy(btn, false); return authMsg(error.message); }
    const {error:rpcErr} = await SB.rpc('mark_password_changed');
    if(rpcErr){ busy(btn, false); return authMsg(rpcErr.message); }
    afterMfa();
  });
}

/* ---------- app ---------- */
function profileToAnalyst(p){
  const name = p.full_name || p.email;
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('') || '??';
  return {id:p.id, name, initials, role:ROLE_LABELS[p.role]||p.role, appRole:p.role, email:p.email};
}

function hasRole(...roles){ return !!CURRENT_USER && roles.includes(CURRENT_USER.appRole); }

function startApp(p){
  PROFILE = p;
  CURRENT_USER = profileToAnalyst(p);
  ANALYSTS[p.id] = CURRENT_USER;   // so the user can own alerts in the (still mock) alert data
  APP_STARTED = true;
  STATE.view = 'dashboard';
  renderShell();
  renderView();
}

async function signOut(){
  APP_STARTED = false;
  PROFILE = null;
  await SB.auth.signOut();
  showLogin();
}
