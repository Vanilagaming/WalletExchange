// Frontend SPA to interact with VanilaCoin API
// const API_BASE = (location.hostname === 'localhost') ? 'http://localhost:3000' : (location.origin);
const API_BASE = "http://localhost:3000"; 

// Simple helpers
const el = (s) => document.querySelector(s);
const show = (sel) => { document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); el(sel).classList.remove('hidden'); }
const setUserArea = (html) => el('#userArea').innerHTML = html;

// token utilities
const tokenKey = 'vc_token';
const saveToken = (t) => localStorage.setItem(tokenKey, t);
const readToken = () => localStorage.getItem(tokenKey);
const clearToken = () => { localStorage.removeItem(tokenKey); updateAuthUI(); }

// fetch wrapper with auth
async function api(path, opts={}){
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  const token = readToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, {...opts, headers});
  if (res.status === 401 || res.status === 403){
    // token invalid or expired - force logout
    clearToken();
    alert('Session expired or unauthorized - please login again.');
    show('#loginView');
    throw new Error('Unauthorized');
  }
  return res;
}

// UI flow
function updateAuthUI(){
  const token = readToken();
  if(token){
    setUserArea(`<button id="logoutBtn" class="btn">Logout</button>`);
    el('#logoutBtn').addEventListener('click', ()=>{ clearToken(); show('#loginView'); });
    show('#dashboardView');
  } else {
    setUserArea('');
    show('#loginView');
  }
}

// handle navigation links
el('#toRegister').addEventListener('click', (e)=>{ e.preventDefault(); show('#registerView'); });
el('#toLogin').addEventListener('click', (e)=>{ e.preventDefault(); show('#loginView'); });

// Register
el('#registerForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = JSON.stringify({ username: fd.get('username'), password: fd.get('password') });
  try {
    const res = await api('/auth/register', { method:'POST', body });
    if(!res.ok) throw await res.json();
    alert('Account created. Please login.');
    show('#loginView');
  } catch(err){ alert('Register failed: ' + (err.error || err.message || JSON.stringify(err))); }
});

// Login
el('#loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = JSON.stringify({ username: fd.get('username'), password: fd.get('password') });
  try {
    const res = await api('/auth/login', { method:'POST', body });
    const data = await res.json();
    if(!res.ok) throw data;
    saveToken(data.token);
    updateAuthUI();
    alert('Login successful');
  } catch(err){ alert('Login failed: ' + (err.error || err.message || JSON.stringify(err))); }
});

// Create wallet
el('#createForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = JSON.stringify({ owner_name: fd.get('owner_name'), USERID: fd.get('USERID') });
  try {
    const res = await api('/wallet/createWallet', { method:'POST', body });
    const data = await res.json();
    if(!res.ok) throw data;
    displayWallet(data);
  } catch(err){ alert('Create failed: ' + (err.error || err.message || JSON.stringify(err))); }
});

// Get wallet
el('#getForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  let id = fd.get('walletID');
  if(!id){
    // try to use stored last Wallet ID
    id = localStorage.getItem('vc_last_wallet');
    if(!id) return alert('Provide a wallet ID or create one first.');
  }
  try {
    const res = await api('/wallet/getWallet', { method:'POST', body: JSON.stringify({ walletID: id }) });
    const data = await res.json();
    if(!res.ok) throw data;
    displayWallet(data);
  } catch(err){ alert('Get failed: ' + (err.error || err.message || JSON.stringify(err))); }
});

// Update balance
el('#updateForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const newBalance = Number(fd.get('NEW_BALANCE'));
  const walletId = localStorage.getItem('vc_last_wallet');
  if(!walletId) return alert('No wallet selected');
  try {
    const res = await api('/wallet/updateWallet', { method:'POST', body: JSON.stringify({ WALLET_ID: walletId, NEW_BALANCE: newBalance }) });
    const data = await res.json();
    if(!res.ok) throw data;
    alert('Updated: ' + JSON.stringify(data));
    // refresh
    await fetchAndShow(walletId);
  } catch(err){ alert('Update failed: ' + (err.error || err.message || JSON.stringify(err))); }
});

// Delete wallet
el('#deleteBtn').addEventListener('click', async ()=>{
  const walletId = localStorage.getItem('vc_last_wallet');
  if(!walletId) return alert('No wallet selected');
  if(!confirm('Delete this wallet?')) return;
  try {
    const res = await api('/wallet/deleteWallet', { method:'POST', body: JSON.stringify({ WALLET_ID: walletId }) });
    const data = await res.json();
    if(!res.ok) throw data;
    alert('Deleted');
    localStorage.removeItem('vc_last_wallet');
    el('#walletInfo').innerText = 'No wallet selected';
    el('#updateBox').classList.add('hidden');
  } catch(err){ alert('Delete failed: ' + (err.error || err.message || JSON.stringify(err))); }
});

// Helpers
function displayWallet(data){
  // If response includes WALLET_ID as uppercase keys or _id
  const id = data.WALLET_ID || data.Wallet_ID || data._id || data.Wallet_ID;
  const created = data.WALLET_CREATION_DATE || data.wallet_creation_date || data.WALLET_CREATION_DATE;
  const balance = data.WALLET_BALANCE ?? data.wallet_balance ?? data.NEW_BALANCE ?? 0;
  const state = data.WALLET_STATE ?? data.wallet_state ?? true;
  const html = `<div><strong>ID:</strong> ${id}</div>
                <div><strong>Created:</strong> ${created}</div>
                <div><strong>Balance:</strong> ${balance}</div>
                <div><strong>State:</strong> ${state}</div>`;
  el('#walletInfo').innerHTML = html;
  localStorage.setItem('vc_last_wallet', id);
  el('#updateBox').classList.remove('hidden');
}

// fetch and show
async function fetchAndShow(id){
  const res = await api('/wallet/getWallet', { method: 'POST', body: JSON.stringify({ walletID: id }) });
  const data = await res.json();
  displayWallet(data);
}

// On load
updateAuthUI();
