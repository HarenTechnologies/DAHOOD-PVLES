/* main.js - single-file app logic for index.html */
/* Put this file as main.js and ensure index.html loads it at end of body */

(() => {
  // ---------- helpers ----------
  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);

  // storage helpers
  function getUsers(){ return JSON.parse(localStorage.getItem('users')||'[]'); }
  function setUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }
  function getGroups(){ return JSON.parse(localStorage.getItem('groups')||'[]'); }
  function setGroups(g){ localStorage.setItem('groups', JSON.stringify(g)); }
  function getMarketplace(){ return JSON.parse(localStorage.getItem('marketplace')||'[]'); }
  function setMarketplace(m){ localStorage.setItem('marketplace', JSON.stringify(m)); }
  function getSlides(){ return JSON.parse(localStorage.getItem('slides')||'[]'); }
  function setSlides(s){ localStorage.setItem('slides', JSON.stringify(s)); }
  function getCurrentUser(){ return JSON.parse(localStorage.getItem('currentUser')||'null'); }
  function setCurrentUser(u){ localStorage.setItem('currentUser', JSON.stringify(u)); }

  // ---------- DOM nodes ----------
  const loginForm = $('loginForm');
  const signupForm = $('signupForm');
  const showSignup = $('showSignup');
  const showLogin = $('showLogin');
  const toggleLoginPassword = $('toggleLoginPassword');
  const toggleSignupPassword = $('toggleSignupPassword');
  const authCard = $('authCard');
  const marketplace = $('marketplace');
  const menuBtn = $('menuBtn');
  const menu = $('menu');
  const bannerContainer = $('bannerContainer');
  const listingsDiv = $('listings');
  const welcomeEl = $('welcome');
  const tradeCountEl = $('tradeCount');
  const addFriendBtn = $('addFriendBtn');
  const friendsListBtn = $('friendsListBtn');
  const currentGroupsBtn = $('currentGroupsBtn');
  const createGroupBtn = $('createGroupBtn');
  const joinGroupBtn = $('joinGroupBtn');
  const notificationsBtn = $('notificationsBtn');
  const notifDot = $('notifDot');
  const adminPanel = $('adminPanel');
  const sendAdminMsgBtn = $('sendAdminMsgBtn');
  const uploadBannerBtn = $('uploadBannerBtn');
  const openAddFormBtn = $('openAddFormBtn');
  const addFormModal = $('addFormModal');
  const addForm = $('addForm');
  const closeAddModal = $('closeAddModal');
  const listingModal = $('listingModal');
  const closeListingModal = $('closeListingModal');
  const modalTitle = $('modalTitle');
  const modalImage = $('modalImage');
  const modalDescription = $('modalDescription');
  const modalContact = $('modalContact');
  const searchInput = $('search');
  const logoutBtn = $('logoutBtn');
  const notificationsPanel = $('notificationsPanel');
  const chatPanel = $('groupChat');
  const chatGroupName = $('chatGroupName');
  const chatBox = $('chatBox');
  const chatInput = $('chatInput');
  const sendChat = $('sendChat');

  // small safety: if nodes missing, create minimal no-op behavior
  function safeClick(el, fn){ if(el) el.addEventListener('click', fn); }

  // ---------- UI utilities ----------
  function show(el){ el && el.classList.remove('hidden'); }
  function hide(el){ el && el.classList.add('hidden'); }

  // ---------- password toggle ----------
  function setupToggle(inputId, btn){
    const inp = $(inputId);
    if(!inp || !btn) return;
    btn.addEventListener('click', ()=> {
      if(inp.type === 'password'){ inp.type = 'text'; btn.textContent = '👁️'; }
      else { inp.type = 'password'; btn.textContent = '🙈'; }
    });
  }
  setupToggle('loginPassword', toggleLoginPassword);
  setupToggle('password', toggleSignupPassword);

  // ---------- show/hide auth forms ----------
  safeClick(showSignup, ()=>{ hide(loginForm); show(signupForm); });
  safeClick(showLogin, ()=>{ hide(signupForm); show(loginForm); });

  // ---------- render banners ----------
  function renderSlides(){
    bannerContainer.innerHTML = '';
    const slides = getSlides();
    slides.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'slide';
      img.loading = 'lazy';
      bannerContainer.appendChild(img);
    });
  }

  // ---------- render listings ----------
  function renderListings(){
    listingsDiv.innerHTML = '';
    const market = getMarketplace();
    if(!market.length){ listingsDiv.innerHTML = '<p style="color:var(--muted)">No listings yet.</p>'; return; }
    market.forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'listing';
      card.innerHTML = `<h3>${escapeHtml(it.title)}</h3>
        ${it.image?`<img class="listing-img" src="${it.image}" alt="">`:''}
        <p>${escapeHtml(it.description)}</p>
        <p style="color:var(--muted)"><b>Contact:</b> ${escapeHtml(it.contact)}</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn small viewBtn" data-idx="${idx}">View</button>
          <button class="btn small alt markCompleteBtn" data-idx="${idx}">✅ Mark Successful</button>
        </div>`;
      listingsDiv.appendChild(card);
    });

    // attach actions
    listingsDiv.querySelectorAll('.viewBtn').forEach(b => b.addEventListener('click', e=>{
      const i = +e.currentTarget.dataset.idx;
      const item = getMarketplace()[i];
      if(!item) return;
      modalTitle.textContent = item.title;
      modalImage.src = item.image||'';
      modalImage.style.display = item.image ? 'block' : 'none';
      modalDescription.textContent = item.description;
      modalContact.textContent = item.contact;
      show(listingModal);
    }));
    listingsDiv.querySelectorAll('.markCompleteBtn').forEach(b => b.addEventListener('click', e=>{
      const i = +e.currentTarget.dataset.idx;
      if(!confirm('Mark this listing as a successful trade (removes listing)?')) return;
      const market = getMarketplace();
      const removed = market.splice(i,1);
      setMarketplace(market);
      // increment tradeCount of the user who posted (if exists)
      const users = getUsers();
      const owner = users.find(u=>u.username === removed[0].user);
      if(owner){ owner.tradeCount = (owner.tradeCount||0)+1; setUsers(users); }
      // if current user did it, update currentUser also
      const cur = getCurrentUser(); if(cur && cur.username === owner?.username){ setCurrentUser(owner); }
      updateTradeCountDisplay();
      renderListings();
    }));
  }

  // ---------- escape helper ----------
  function escapeHtml(str=''){ return String(str).replace(/[&<>"'`]/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',"`":'&#96;' })[s]); }

  // ---------- show marketplace after login ----------
  function showMarketplace(){
    hide(authCard);
    show(marketplace);
    const user = getCurrentUser();
    welcomeEl.textContent = `Welcome, ${user.username}!`;
    updateTradeCountDisplay();
    renderSlides();
    renderListings();
    renderNotificationsUI();
    // admin panel show
    if(user.username === 'hare1111') show(adminPanel); else hide(adminPanel);
  }

  // ---------- trade count ----------
  function updateTradeCountDisplay(){
    const cur = getCurrentUser();
    tradeCountEl.textContent = `Trades Completed: ${cur?.tradeCount||0}`;
  }

  // ---------- login/signup handling ----------
  safeClick(loginForm, ()=>{}); // ensures node exists
  loginForm?.addEventListener('submit', e=>{
    e.preventDefault();
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value.trim();
    let users = getUsers();
    // admin shortcut
    if(username === 'hare1111' && password === 'himgjo@123'){
      if(!users.find(u=>u.username==='hare1111')){
        users.push({username:'hare1111', email:'admin@dahood', password:'himgjo@123', friends:[], groups:[], tradeCount:0, notifications:[]});
        setUsers(users);
      }
      setCurrentUser(users.find(u=>u.username==='hare1111'));
      alert('Admin logged in');
      showMarketplace();
      return;
    }
    const user = users.find(u=>u.username===username);
    if(!user){ return alert('Username does not exist'); }
    if(user.password !== password) return alert('Wrong password');
    setCurrentUser(user);
    alert(`Welcome back, ${user.username}`);
    showMarketplace();
  });

  signupForm?.addEventListener('submit', e=>{
    e.preventDefault();
    const username = $('username').value.trim();
    const email = $('email').value.trim();
    const password = $('password').value.trim();
    if(!username || !email || !password) return alert('Fill all fields');
    let users = getUsers();
    if(users.find(u=>u.username===username)) return alert('Username already taken');
    const u = { username, email, password, friends:[], groups:[], tradeCount:0, notifications:[] };
    users.push(u); setUsers(users); setCurrentUser(u);
    alert('Account created');
    showMarketplace();
  });

  // ---------- menu toggle ----------
  safeClick(menuBtn, ()=>{ menu.classList.toggle('hidden'); });

  // ---------- logout ----------
  safeClick(logoutBtn, ()=>{
    if(confirm('Logout?')) {
      localStorage.removeItem('currentUser');
      hide(marketplace);
      show(authCard);
    }
  });

  // ---------- friends ----------
  safeClick(addFriendBtn, ()=>{
    const name = prompt("Enter friend's username:");
    if(!name) return;
    const users = getUsers();
    const friend = users.find(u=>u.username===name);
    if(!friend) return alert('User not found');
    const cur = getCurrentUser();
    if(!cur.friends) cur.friends=[];
    if(cur.friends.includes(name)) return alert('Already friends');
    // push friend request as notification on friend
    friend.notifications = friend.notifications || [];
    friend.notifications.push({type:'friend_request', from: cur.username});
    setUsers(users);
    alert('Friend request sent');
  });

  safeClick(friendsListBtn, ()=>{
    const cur = getCurrentUser();
    alert(cur.friends?.length ? `Friends:\n${cur.friends.join('\n')}` : 'No friends yet');
  });

  // ---------- groups ----------
  safeClick(currentGroupsBtn, ()=>{
    const cur = getCurrentUser();
    alert(cur.groups?.length ? `Your groups:\n${cur.groups.join('\n')}` : 'No groups yet');
  });

  safeClick(createGroupBtn, ()=>{
    const cur = getCurrentUser();
    if(cur.username !== 'hare1111' && (cur.tradeCount||0) < 15) return alert('Need 15 trades to create group');
    const name = prompt('Group name:');
    if(!name) return;
    const pw = confirm('Password protect?') ? prompt('Set password:') : null;
    const addFriends = confirm('Invite friends now?');
    const groups = getGroups();
    if(groups.find(g=>g.name===name)) return alert('Group exists');
    const members = [cur.username];
    if(addFriends){
      const list = prompt('Comma-separated friend usernames:');
      if(list) list.split(',').map(s=>s.trim()).forEach(fn=>{
        if(fn && !members.includes(fn)) members.push(fn);
        // notify friend
        const users = getUsers();
        const f = users.find(u=>u.username===fn);
        if(f){ f.notifications = f.notifications||[]; f.notifications.push({type:'group_invite', group:name, from:cur.username}); setUsers(users); }
      });
    }
    groups.push({name, admin:cur.username, password:pw, members, listings:[], chat:[]});
    setGroups(groups);
    alert('Group created');
  });

  safeClick(joinGroupBtn, ()=>{
    const name = prompt('Group name to join:');
    if(!name) return;
    const groups = getGroups();
    const group = groups.find(g=>g.name===name);
    if(!group) return alert('Group not found');
    if(group.password){
      const pw = prompt('Enter password:');
      if(pw !== group.password) return alert('Wrong password');
    }
    const cur = getCurrentUser();
    if(!group.members.includes(cur.username)) group.members.push(cur.username);
    if(!cur.groups) cur.groups=[];
    if(!cur.groups.includes(group.name)) cur.groups.push(group.name);
    setGroups(groups);
    setCurrentUser(cur);
    alert('Joined group');
  });

  // ---------- admin messages & slides ----------
  safeClick(sendAdminMsgBtn, ()=>{
    const cur = getCurrentUser();
    if(cur.username !== 'hare1111') return alert('Admin only');
    const msg = prompt('Enter message to broadcast:');
    if(!msg) return;
    const users = getUsers();
    users.forEach(u=>{ u.notifications = u.notifications || []; u.notifications.push({type:'admin', message:msg}); });
    setUsers(users);
    alert('Broadcast sent');
    renderNotifications(); renderSlides();
  });

  safeClick(uploadBannerBtn, ()=>{
    // input type=file handled via change event below
  });
  uploadBannerBtn?.addEventListener('change', e=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=> {
      const slides = getSlides(); slides.push(reader.result); setSlides(slides); renderSlides();
      alert('Slide uploaded');
    };
    reader.readAsDataURL(file);
  });

  // ---------- add listing flow ----------
  safeClick(openAddFormBtn, ()=> show(addFormModal));
  safeClick(closeAddModal, ()=> hide(addFormModal));
  addForm?.addEventListener('submit', e=>{
    e.preventDefault();
    const title = $('title').value.trim();
    const desc = $('description').value.trim();
    const contact = $('contact').value.trim();
    const imgInput = $('image');

    const reader = new FileReader();
    reader.onload = ()=> {
      const newItem = { title, description: desc, contact, image: reader.result||null, user: getCurrentUser().username };
      const market = getMarketplace(); market.push(newItem); setMarketplace(market);
      renderListings(); hide(addFormModal);
      // clear form
      addForm.reset();
    };
    if(imgInput.files && imgInput.files[0]) reader.readAsDataURL(imgInput.files[0]);
    else reader.onload();
  });

  // ---------- listing modal controls ----------
  safeClick(closeListingModal, ()=> hide(listingModal));
  window.addEventListener('click', e => { if(e.target === listingModal) hide(listingModal); });

  // ---------- search ----------
  searchInput?.addEventListener('input', ()=>{
    const term = searchInput.value.toLowerCase();
    const market = getMarketplace();
    const filtered = market.filter(m => (m.title||'').toLowerCase().includes(term) || (m.description||'').toLowerCase().includes(term));
    listingsDiv.innerHTML = '';
    if(!filtered.length){ listingsDiv.innerHTML = '<p style="color:var(--muted)">No results</p>'; return; }
    filtered.forEach((it, idx) => {
      const card = document.createElement('div'); card.className='listing';
      card.innerHTML = `<h3>${escapeHtml(it.title)}</h3>${it.image?`<img class="listing-img" src="${it.image}">`:''}<p>${escapeHtml(it.description)}</p><p style="color:var(--muted)"><b>Contact:</b> ${escapeHtml(it.contact)}</p>`;
      listingsDiv.appendChild(card);
    });
  });

  // ---------- notifications UI ----------
  function renderNotifications(){
    const cur = getCurrentUser(); if(!cur) return;
    return cur.notifications || [];
  }
  function renderNotificationsUI(){
    const cur = getCurrentUser();
    if(!cur) return;
    const nots = cur.notifications || [];
    if(nots.length) show(notifDot); else hide(notifDot);
  }
  safeClick(notificationsBtn, ()=>{
    const cur = getCurrentUser();
    if(!cur) return alert('No user');
    const nots = cur.notifications || [];
    if(!nots.length) return alert('No notifications');
    // simple handler: show list and allow accept friend / accept group invites
    let out = '';
    nots.forEach((n,i)=> out += `${i+1}. ${n.type==='friend_request' ? `Friend request from ${n.from}` : n.type==='group_invite' ? `Group invite to ${n.group} (from ${n.from})` : n.type==='admin' ? `Admin: ${n.message}` : JSON.stringify(n)}\n`);
    alert(out);
    // clear notifications after reading
    cur.notifications = []; setCurrentUser(cur);
    renderNotificationsUI();
  });

  // ---------- chat (group chat simplified: uses first group if user has one) ----------
  safeClick(sendChat, ()=>{
    const text = (chatInput.value||'').trim();
    if(!text) return;
    const cur = getCurrentUser();
    const groups = getGroups();
    const gname = cur.groups && cur.groups[0];
    if(!gname) return alert('Join or create a group to chat');
    const group = groups.find(g=>g.name===gname);
    if(!group) return alert('Group missing');
    group.chat = group.chat || [];
    group.chat.push({ user: cur.username, message: text, time: new Date().toISOString() });
    setGroups(groups);
    chatInput.value = '';
    loadGroupChat(group);
  });

  function loadGroupChat(group){
    if(!group) return;
    show(chatPanel);
    chatGroupName.textContent = group.name;
    chatBox.innerHTML = '';
    (group.chat||[]).forEach(m=>{
      const p = document.createElement('p');
      p.textContent = `${m.user}: ${m.message}`;
      chatBox.appendChild(p);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ---------- helper functions ----------
  function escapeHtml(s=''){ return String(s).replace(/[&<>"'`]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',"`":'&#96;'}[ch])); }

  // ---------- initial boot: if user logged in show marketplace ----------
  (function boot(){
    // ensure some storage keys exist
    if(!localStorage.getItem('users')) setUsers([]);
    if(!localStorage.getItem('groups')) setGroups([]);
    if(!localStorage.getItem('marketplace')) setMarketplace([]);
    if(!localStorage.getItem('slides')) setSlides([]);
    // handle currentUser
    const current = getCurrentUser();
    if(current){ showMarketplace(); } else { hide(marketplace); show(authCard); }
    renderSlides();
    renderListings();
    renderNotificationsUI();
  })();

  // expose renderSlides & renderListings (for upload events)
  function renderSlides(){ bannerContainer.innerHTML=''; getSlides().forEach(s=>{
    const img = document.createElement('img'); img.src = s; img.alt='slide'; bannerContainer.appendChild(img);
  }); }
  // re-attach renderListings function reference above
  // update trade count (display) when page visible
  function updateTradeCount(){ updateTradeCountDisplay(); }

  // small debug (console)
  console.log('DA HOOD main.js loaded');
})();
