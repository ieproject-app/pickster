// Pickster - Random Name Picker with Fisher-Yates Shuffle (lodash version)
// Author: ieproject-app

(() => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  // Header
  const themeBtn = $('#theme-toggle');
  const soundBtn = $('#sound-toggle');
  const presBtn = $('#presentation-toggle');

  // Tabs & Panels
  const tabNew = $('#tab-new-list');
  const tabSaved = $('#tab-saved-groups');
  const sectionNew = $('#new-list-section');
  const sectionSaved = $('#saved-groups-section');

  // Input & Settings
  const textarea = $('#names-input');
  const setListBtn = $('#set-list-btn');
  const savedGroupsList = $('#saved-groups-list');
  const settingsToggle = $('#settings-toggle');
  const settingsContent = $('#settings-content');
  const numWinners = $('#num-winners');
  const animDuration = $('#animation-duration');
  const countdownDuration = $('#countdown-duration');
  const removeAfterPick = $('#remove-after-pick');
  const moreActionsBtn = $('#more-actions-btn');
  const moreActionsMenu = $('#more-actions-menu');
  const importTxt = $('#import-txt');
  const exportTxt = $('#export-txt');
  const clearAllBtn = $('#clear-everything');

  // Results & Actions
  const resultArea = $('#result-area');
  const countdownDiv = $('#countdown');
  const animationDiv = $('#animation');
  const winnersDisplay = $('#winners-display');
  const pickBtn = $('#pick-btn');
  const aiSuggestBtn = $('#ai-suggest-btn');
  const statTotal = $('#stat-total');
  const statPicked = $('#stat-picked');
  const statAvailable = $('#stat-available');

  // Footer & Modal
  const viewHistoryBtn = $('#view-history');
  const modalOverlay = $('#modal-overlay');
  const modalBody = $('#modal-body');
  const modalClose = $('#modal-close');
  // Presentation
  const presView = $('#presentation-view');
  const presCountdown = $('#presentation-countdown');
  const presAnimation = $('#presentation-animation');
  const presWinners = $('#presentation-winners');

  // --- State ---
  let names = [];            
  let availableNames = [];   
  let pickedNames = [];      
  let history = [];          
  let groups = {};           
  let userSettings = {
    numWinners: 1,
    animDuration: 3,
    countdownDuration: 3,
    removeAfterPick: false,
    theme: 'light',
    sound: true,
  };

  const STORAGE_KEYS = {
    names: 'pickster-names',
    available: 'pickster-available',
    picked: 'pickster-picked',
    history: 'pickster-history',
    groups: 'pickster-groups',
    settings: 'pickster-settings'
  };

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.names, JSON.stringify(names));
    localStorage.setItem(STORAGE_KEYS.available, JSON.stringify(availableNames));
    localStorage.setItem(STORAGE_KEYS.picked, JSON.stringify(pickedNames));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEYS.groups, JSON.stringify(groups));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(userSettings));
  }
  function loadState() {
    names = JSON.parse(localStorage.getItem(STORAGE_KEYS.names) || '[]');
    availableNames = JSON.parse(localStorage.getItem(STORAGE_KEYS.available) || '[]');
    pickedNames = JSON.parse(localStorage.getItem(STORAGE_KEYS.picked) || '[]');
    history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]');
    groups = JSON.parse(localStorage.getItem(STORAGE_KEYS.groups) || '{}');
    userSettings = Object.assign(userSettings, JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}'));
  }
  function resetAll(confirmAlert=true) {
    if (!confirmAlert || confirm('Clear EVERYTHING? This will remove all names, history, and groups.')) {
      names = [];
      availableNames = [];
      pickedNames = [];
      history = [];
      groups = {};
      saveState();
      renderAll();
      textarea.value = '';
    }
  }

  // Tab Switch
  tabNew.onclick = () => {
    tabNew.classList.add('active');
    tabSaved.classList.remove('active');
    sectionNew.classList.add('active');
    sectionSaved.classList.remove('active');
  };
  tabSaved.onclick = () => {
    tabSaved.classList.add('active');
    tabNew.classList.remove('active');
    sectionSaved.classList.add('active');
    sectionNew.classList.remove('active');
    renderSavedGroups();
  };

  // Accordion
  settingsToggle.onclick = () => {
    settingsToggle.parentElement.classList.toggle('open');
  };

  // Dropdown More Actions
  moreActionsBtn.onclick = (e) => {
    e.stopPropagation();
    moreActionsBtn.parentElement.classList.toggle('open');
  };
  document.body.onclick = (e) => {
    if (!moreActionsBtn.contains(e.target)) moreActionsBtn.parentElement.classList.remove('open');
  };

  // Set List Button (use lodash uniq)
  setListBtn.onclick = () => {
    const raw = textarea.value.split('\n').map(x=>x.trim()).filter(Boolean);
    const uniq = _.uniq(raw);
    names = uniq;
    availableNames = [...uniq];
    pickedNames = [];
    saveState();
    renderStats();
    renderWinners([]);
    renderSavedGroups();
  };

  // Settings Inputs
  numWinners.onchange = () => {
    userSettings.numWinners = Math.max(1, parseInt(numWinners.value)||1);
    numWinners.value = userSettings.numWinners;
    saveState();
  };
  animDuration.onchange = () => {
    userSettings.animDuration = Math.max(1, Math.min(10, parseInt(animDuration.value)||3));
    animDuration.value = userSettings.animDuration;
    saveState();
  };
  countdownDuration.onchange = () => {
    userSettings.countdownDuration = Math.max(1, Math.min(10, parseInt(countdownDuration.value)||3));
    countdownDuration.value = userSettings.countdownDuration;
    saveState();
  };
  removeAfterPick.onchange = () => {
    userSettings.removeAfterPick = !!removeAfterPick.checked;
    saveState();
  };

  // More Actions
  exportTxt.onclick = () => {
    const blob = new Blob([names.join('\n')], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pickster-names.txt';
    a.click();
    moreActionsBtn.parentElement.classList.remove('open');
  };
  importTxt.parentElement.onclick = () => importTxt.click();
  importTxt.onchange = (e) => {
    const file = importTxt.files[0];
    if (file) {
      file.text().then(txt => {
        textarea.value = txt;
        moreActionsBtn.parentElement.classList.remove('open');
      });
    }
  };
  clearAllBtn.onclick = () => {
    moreActionsBtn.parentElement.classList.remove('open');
    resetAll(true);
  };

  // Saved Groups
  function renderSavedGroups() {
    savedGroupsList.innerHTML = '';
    const keys = Object.keys(groups);
    if (!keys.length) {
      savedGroupsList.innerHTML = '<em>No groups saved.</em>';
      return;
    }
    keys.forEach(groupName => {
      const row = document.createElement('div');
      row.className = 'saved-group-row';
      row.innerHTML = `
        <span class="group-name">${groupName}</span>
        <span class="group-actions">
          <button title="Use" data-action="use">&#9658;</button>
          <button title="Delete" data-action="delete">&times;</button>
        </span>
      `;
      row.querySelector('[data-action="use"]').onclick = () => {
        textarea.value = groups[groupName].join('\n');
        tabNew.click();
      };
      row.querySelector('[data-action="delete"]').onclick = () => {
        if (confirm(`Delete group "${groupName}"?`)) {
          delete groups[groupName];
          saveState();
          renderSavedGroups();
        }
      };
      savedGroupsList.appendChild(row);
    });
  }
  tabSaved.ondblclick = () => {
    const groupName = prompt('Group name? (for current list)');
    if (groupName && names.length) {
      groups[groupName] = [...names];
      saveState();
      renderSavedGroups();
      alert('Group saved!');
    }
  };

  // Stats Panel
  function renderStats() {
    statTotal.textContent = names.length;
    statPicked.textContent = pickedNames.length;
    statAvailable.textContent = availableNames.length;
  }

  // Winner Display
  function renderWinners(winners) {
    winnersDisplay.innerHTML = '';
    winners.forEach(name => {
      const span = document.createElement('span');
      span.className = 'winner';
      span.textContent = name;
      winnersDisplay.appendChild(span);
    });
  }

  // --- Fisher-Yates Shuffle with lodash
  function pickRandom(arr, n) {
    return _.shuffle(arr).slice(0, n); // shuffle dengan Fisher-Yates dari lodash
  }

  // Pick Winner(s)
  pickBtn.onclick = async () => {
    if (!names.length) return alert('Please set a list first!');
    if (!availableNames.length) return alert('No available names!');
    if (userSettings.numWinners > availableNames.length)
      return alert('Not enough names left!');
    await doPick('normal');
  };

  // AI Suggest
  aiSuggestBtn.onclick = async () => {
    if (!names.length) return alert('Set a list first!');
    if (!availableNames.length) return alert('No names left!');
    await doPick('ai');
  };

  // Core Pick Logic
  async function doPick(type='normal') {
    await showCountdown(userSettings.countdownDuration, countdownDiv, true);
    await showAnimation(userSettings.animDuration, animationDiv, availableNames);

    let winners = [];
    if (type==='normal') {
      winners = pickRandom(availableNames, userSettings.numWinners);
    } else {
      winners = aiSuggest(userSettings.numWinners);
    }

    renderWinners(winners);
    if (userSettings.sound) playWinSound();
    history.push({
      winners, date: new Date().toISOString()
    });

    pickedNames = pickedNames.concat(winners);
    if (userSettings.removeAfterPick) {
      availableNames = availableNames.filter(n => !winners.includes(n));
    }

    saveState();
    renderStats();
  }

  // Show Countdown
  async function showCountdown(sec, targetDiv, playSound) {
    targetDiv.innerHTML = '';
    for (let i = sec; i > 0; i--) {
      targetDiv.textContent = i;
      if (playSound && userSettings.sound) playTickSound();
      await sleep(900);
    }
    targetDiv.textContent = '';
  }

  // Show Animation (pakai shuffle lodash juga biar variasi)
  async function showAnimation(duration, targetDiv, pool) {
    let t0 = Date.now();
    targetDiv.innerHTML = '';
    let tick = 0;
    let shuffled = _.shuffle(pool);
    while (Date.now() - t0 < duration * 1000) {
      if (tick % pool.length === 0) shuffled = _.shuffle(pool);
      const name = shuffled[tick % pool.length];
      targetDiv.textContent = name;
      tick++;
      await sleep(Math.max(60, 120 - 10 * Math.min(tick, 10)));
    }
    targetDiv.textContent = '';
  }

  // AI Suggestion (Fairness)
  function aiSuggest(n=1) {
    const counts = {};
    names.forEach(name => { counts[name] = 0; });
    history.forEach(h => h.winners.forEach(w => counts[w] = (counts[w]||0)+1));
    let minWin = Math.min(...availableNames.map(name=>counts[name]));
    let fairPool = availableNames.filter(name=>counts[name] === minWin);
    let suggestion = _.shuffle(fairPool).slice(0, n);
    showModal(`<h2>AI Suggestion</h2>
      <p>The fairest candidates (fewest wins):</p>
      <div style="display:flex;gap:12px;margin:8px 0 17px 0;">
        ${fairPool.map(name=>`<span class="winner">${name}</span>`).join('')}
      </div>
      <p>Suggested pick:</p>
      <div style="display:flex;gap:10px">
        ${suggestion.map(name=>`<span class="winner">${name}</span>`).join('')}
      </div>
      <br><button class="primary-btn" id="accept-ai-pick">Accept</button>
      <button class="secondary-btn" id="cancel-ai-pick">Cancel</button>
    `);

    $('#accept-ai-pick').onclick = () => {
      closeModal();
      renderWinners(suggestion);
      if (userSettings.sound) playWinSound();
      history.push({winners:suggestion, date: new Date().toISOString()});
      pickedNames = pickedNames.concat(suggestion);
      if (userSettings.removeAfterPick)
        availableNames = availableNames.filter(n => !suggestion.includes(n));
      saveState();
      renderStats();
    };
    $('#cancel-ai-pick').onclick = closeModal;

    return suggestion;
  }

  // Modal Dialog
  function showModal(html) {
    modalBody.innerHTML = html;
    modalOverlay.classList.remove('hidden');
  }
  function closeModal() {
    modalOverlay.classList.add('hidden');
    modalBody.innerHTML = '';
  }
  modalClose.onclick = closeModal;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };

  // View History Modal
  viewHistoryBtn.onclick = () => {
    if (!history.length) return alert('No history yet!');
    let html = `<h2>History</h2><ol>`;
    history.slice().reverse().forEach((h,i) => {
      let date = new Date(h.date).toLocaleString();
      html += `<li><b>${date}:</b> ${h.winners.map(n=>`<span class="winner">${n}</span>`).join(' ')}</li>`;
    });
    html += '</ol>';
    showModal(html);
  };

  // Theme Toggle
  function setTheme(theme) {
    document.body.classList.toggle('dark', theme==='dark');
    userSettings.theme = theme;
    themeBtn.querySelector('span').className = theme==='dark' ? 'icon-sun' : 'icon-sun';
    saveState();
  }
  themeBtn.onclick = () => {
    const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Sound Toggle
  function setSound(on) {
    userSettings.sound = !!on;
    soundBtn.querySelector('span').className = on ? 'icon-sound-on' : 'icon-sound-off';
    saveState();
  }
  soundBtn.onclick = () => setSound(!userSettings.sound);

  // Presentation Mode
  presBtn.onclick = () => enterPresentationMode();
  function enterPresentationMode() {
    presView.classList.remove('hidden');
    presCountdown.textContent = '';
    presAnimation.textContent = '';
    presWinners.innerHTML = '';
    presView.requestFullscreen && presView.requestFullscreen();
    document.addEventListener('keydown', presKeyHandler);
  }
  function exitPresentationMode() {
    presView.classList.add('hidden');
    if (document.fullscreenElement) document.exitFullscreen();
    document.removeEventListener('keydown', presKeyHandler);
  }
  async function presKeyHandler(e) {
    if (e.key === 'Escape') {
      exitPresentationMode();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      await showCountdown(userSettings.countdownDuration, presCountdown, true);
      await showAnimation(userSettings.animDuration, presAnimation, availableNames);
      const winners = pickRandom(availableNames, userSettings.numWinners);
      presWinners.innerHTML = '';
      winners.forEach(name => {
        const span = document.createElement('span');
        span.className = 'winner';
        span.textContent = name;
        presWinners.appendChild(span);
      });
      if (userSettings.sound) playWinSound();
      history.push({winners, date: new Date().toISOString()});
      pickedNames = pickedNames.concat(winners);
      if (userSettings.removeAfterPick)
        availableNames = availableNames.filter(n => !winners.includes(n));
      saveState();
      renderStats();
    }
  }
  presView.onclick = exitPresentationMode;

  // Web Audio API: Sound
  function playTickSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 950;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.11);
      setTimeout(()=>ctx.close(), 200);
    } catch {}
  }
  function playWinSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [392, 440, 523, 659, 784, 523, 659, 784];
      let t = 0;
      notes.forEach((note,i)=>{
        setTimeout(()=>{
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = note;
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.13);
          setTimeout(()=>ctx.close(), 120);
        }, i*120);
      });
    } catch {}
  }

  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  // Initialize
  function applySettingsToInputs() {
    numWinners.value = userSettings.numWinners;
    animDuration.value = userSettings.animDuration;
    countdownDuration.value = userSettings.countdownDuration;
    removeAfterPick.checked = !!userSettings.removeAfterPick;
    setTheme(userSettings.theme);
    setSound(userSettings.sound);
  }

  function renderAll() {
    renderStats();
    renderWinners([]);
    renderSavedGroups();
  }

  function firstLoad() {
    loadState();
    applySettingsToInputs();
    textarea.value = names.join('\n');
    renderAll();
  }
  firstLoad();

  window.addEventListener('beforeunload', saveState);

})();
