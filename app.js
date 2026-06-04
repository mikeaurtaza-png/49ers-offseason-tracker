const defaults = [
  { title:'Pass Rush', stat:'20', label:'Sacks', rank:'32nd NFL', severity:'Worst in the NFL', status:'pending', include:true, evidence:['Osa Odighizuwa added','Romelo Height drafted','Grayson Halton drafted','More interior rush depth'] },
  { title:'Interceptions', stat:'6', label:'INTs Forced', rank:'32nd NFL', severity:'Dead last takeaway production', status:'pending', include:true, evidence:['Still needs proven ball production','Secondary must create more plays'] },
  { title:'Red Zone D', stat:'29', label:'TDs Allowed', rank:'Worst NFL', severity:'Could not finish drives defensively', status:'pending', include:true, evidence:['Front seven rebuilt','Must prove it inside the 20'] },
  { title:'Run Game', stat:'3.78', label:'Yards/Carry', rank:'30th NFL', severity:'Inefficient rushing attack', status:'pending', include:true, evidence:['Kaelon Black added','More OL competition','Needs explosive-run rebound'] },
  { title:'Turnovers', stat:'23', label:'Giveaways', rank:'27th NFL', severity:'Too many empty possessions', status:'notfixed', include:true, evidence:['Decision-making must improve','Ball security is not solved on paper'] },
  { title:'Penalties', stat:'106', label:'Penalties', rank:'3rd Most', severity:'Self-inflicted damage', status:'notfixed', include:true, evidence:['Discipline must improve','Cannot be fully fixed by roster moves'] }
];

const defaultSettings = {
  motion:'cinematic',
  theme:'49ers',
  layout:'standard',
  background:'broadcast'
};

let problems = JSON.parse(localStorage.getItem('fixTrackerProblemsV5') || localStorage.getItem('fixTrackerProblemsV2') || localStorage.getItem('fixTrackerProblems') || 'null') || defaults;
problems = problems.map(p => ({ include:true, severity:'Critical issue', evidence:[], ...p }));
let settings = { ...defaultSettings, ...(JSON.parse(localStorage.getItem('fixTrackerSettingsV5') || 'null') || {}) };
let mode = 'setup';
let current = 0;
let editing = 0;
let drawer = false;
let clean = false;
let studio = false;
let reveal = false;
let verdictShown = false;
let flash = '';
const app = document.getElementById('app');

const activeProblems = () => problems.filter(p => p.include !== false);
const save = () => localStorage.setItem('fixTrackerProblemsV5', JSON.stringify(problems));
const saveSettings = () => localStorage.setItem('fixTrackerSettingsV5', JSON.stringify(settings));
const cls = s => s === 'fixed' ? 'fixed' : s === 'pending' ? 'pending' : 'notfixed';
const label = s => s === 'fixed' ? 'Fixed' : s === 'pending' ? 'Pending' : 'Not Fixed';
const fixedCount = () => activeProblems().filter(p => p.status === 'fixed').length;
const motionClass = () => `motion-${settings.motion}`;
const themeClass = () => `theme-${settings.theme} bg-${settings.background}`;
const vector = s => {
  if (s === 'fixed') return `<span class="token fixed-token" aria-hidden="true"><svg viewBox="0 0 64 64"><path class="shield" d="M32 4l22 8v17c0 15-9 25-22 31C19 54 10 44 10 29V12l22-8z"/><path class="check" d="M20 32l8 8 17-19"/></svg></span>`;
  if (s === 'pending') return `<span class="token pending-token" aria-hidden="true"><span></span></span>`;
  return `<span class="token notfixed-token" aria-hidden="true"><svg viewBox="0 0 64 64"><path class="slash" d="M13 45L45 13l6 6-32 32z"/><path class="slash2" d="M19 13l32 32-6 6-32-32z"/></svg></span>`;
};

function render(){
  document.body.className = `${motionClass()} ${themeClass()} ${studio ? 'studio-on' : ''} ${flash}`;
  if(mode === 'setup') renderSetup();
  if(mode === 'board') renderBoard();
  if(mode === 'problem') renderProblem();
  if(flash){ setTimeout(()=>{ flash=''; document.body.className = `${motionClass()} ${themeClass()} ${studio ? 'studio-on' : ''}`; }, 520); }
}

function esc(v){ return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function field(l,k,v){ return `<div class="stack"><div class="label">${l}</div><input value="${esc(v)}" onchange="updateField('${k}',this.value)"></div>`; }

function renderSetup(){
  const p = problems[editing] || problems[0];
  app.innerHTML = `
    <section class="control-room">
      <div class="control-top">
        <div class="brand"><div class="mark">SF</div><div><b>49ers Fix Tracker</b><span>Broadcast Production Tool</span></div></div>
        <div class="top-actions"><button class="ghost-btn" onclick="resetData()">Reset Defaults</button><button class="primary-btn" onclick="launch()">Launch Presentation</button></div>
      </div>
      <div class="control-hero">
        <div><div class="eyebrow">Producer setup</div><h1>Control Room</h1><p>Build the episode. The audience only sees the clean fullscreen graphics.</p></div>
        <div class="score-chip"><b>${fixedCount()} / ${activeProblems().length}</b><span>Problems Fixed</span></div>
      </div>
      <div class="control-grid">
        <div class="panel editor-panel">
          <div class="issue-editor">
            <label class="include-row"><input type="checkbox" ${p.include!==false?'checked':''} onchange="toggleInclude(this.checked)"> Include in this episode</label>
            ${field('Problem Title','title',p.title)}${field('Main Stat','stat',p.stat)}${field('Stat Label','label',p.label)}${field('NFL Rank','rank',p.rank)}
            <div class="stack"><div class="label">Status</div><select onchange="updateField('status',this.value)"><option value="fixed" ${p.status==='fixed'?'selected':''}>Fixed</option><option value="pending" ${p.status==='pending'?'selected':''}>Pending</option><option value="notfixed" ${p.status==='notfixed'?'selected':''}>Not Fixed</option></select></div>
            ${field('Severity Line','severity',p.severity)}
            <div class="stack evidence-edit"><div class="label">Evidence Bullets — one per line</div><textarea onchange="updateEvidence(this.value)">${p.evidence.map(esc).join('\n')}</textarea></div>
            <div class="editor-actions"><button class="ghost-btn" onclick="addProblem()">Add Problem</button><button class="danger-btn" onclick="deleteProblem()">Delete</button><button class="ghost-btn" onclick="move(-1)">Move Up</button><button class="ghost-btn" onclick="move(1)">Move Down</button></div>
          </div>
          <div class="issue-list">${problems.map((x,i)=>`<div class="mini-card ${i===editing?'active':''} ${x.include===false?'off':''} ${cls(x.status)}" onclick="editing=${i};render()"><div class="handle">${i+1}</div><div><div class="mini-title">${esc(x.title)}</div><div class="mini-sub">${esc(x.stat)} ${esc(x.label)} · ${esc(x.rank)}</div></div><span class="badge ${cls(x.status)}">${label(x.status)}</span></div>`).join('')}</div>
        </div>
        <div class="side-stack">
          <div class="panel production-note">
            <div class="eyebrow">Production controls</div>
            <h2>Studio Settings</h2>
            ${settingGroup('Motion Profile','motion',['off','low','cinematic'],['Off','Low','Cinematic'])}
            ${settingGroup('Theme Preset','theme',['49ers','espn','films','keynote'],['49ers Classic','ESPN Broadcast','NFL Films','Apple Keynote'])}
            ${settingGroup('Card Layout','layout',['standard','hero','verdict'],['Standard','Hero Stat','Verdict First'])}
            ${settingGroup('Background','background',['clean','broadcast','films'],['Clean Studio','Broadcast Studio','NFL Films'])}
          </div>
          <div class="panel production-note compact">
            <div class="eyebrow">Recording shortcuts</div>
            <p><span class="kbd">S</span> studio &nbsp; <span class="kbd">Space</span> evidence / next</p>
            <p><span class="kbd">Enter</span> verdict &nbsp; <span class="kbd">←</span>/<span class="kbd">→</span> move</p>
            <p><span class="kbd">B</span> board &nbsp; <span class="kbd">M</span> controls &nbsp; <span class="kbd">Esc</span> exit</p>
          </div>
        </div>
      </div>
    </section>`;
}

function settingGroup(title,key,values,labels){
  return `<div class="setting-group"><div class="label">${title}</div><div class="segmented">${values.map((v,i)=>`<button class="${settings[key]===v?'selected':''}" onclick="settings.${key}='${v}';saveSettings();render()">${labels[i]}</button>`).join('')}</div></div>`;
}

function updateField(k,v){ problems[editing][k] = v; save(); render(); }
function updateEvidence(v){ problems[editing].evidence = v.split('\n').map(x=>x.trim()).filter(Boolean); save(); render(); }
function toggleInclude(v){ problems[editing].include = v; save(); render(); }
function addProblem(){ problems.push({title:'New Problem',stat:'0',label:'Stat',rank:'Rank',severity:'Why it mattered',status:'pending',include:true,evidence:['Evidence item']}); editing=problems.length-1; save(); render(); }
function deleteProblem(){ if(problems.length < 2) return; problems.splice(editing,1); editing=Math.max(0,editing-1); save(); render(); }
function move(d){ const ni=editing+d; if(ni<0||ni>=problems.length)return; [problems[editing],problems[ni]]=[problems[ni],problems[editing]]; editing=ni; save(); render(); }
function resetData(){ problems=structuredClone(defaults); editing=0; current=0; save(); render(); }
function launch(){ mode='board'; current=0; reveal=false; verdictShown=false; render(); }

function controls(){
  if(studio) return `<div class="studio-corner">STUDIO MODE</div>`;
  return `<div class="edge-hotspot" onmouseenter="drawer=true;render()"></div><div class="drawer ${drawer?'show':''}" onmouseleave="drawer=false;render()"><button class="ghost-btn" onclick="mode='setup';render()">Setup</button><button class="ghost-btn" onclick="mode='board';render()">Board</button><button class="ghost-btn" onclick="prev()">Prev</button><button class="primary-btn" onclick="next()">Next</button><button class="ghost-btn" onclick="studio=!studio;render()">Studio</button><button class="ghost-btn" onclick="clean=!clean;render()">Clean</button></div>`;
}

function renderBoard(){
  const list = activeProblems();
  app.innerHTML = `${controls()}<section class="stage board-stage ${studio?'studio-stage':''}">
    <div class="broadcast-bg"></div>
    <div class="board-wrap">
      <div class="board-title"><div class="eyebrow">2025 Problem Fix Tracker</div><div class="mega-score"><span class="count-pop">${fixedCount()}</span><i>/</i><span>${list.length}</span></div><h1>Problems Fixed</h1></div>
      <div class="tile-grid">${list.map((p,i)=>`<button class="tile floating-card ${cls(p.status)}" onclick="current=${i};mode='problem';reveal=false;verdictShown=false;render()"><div class="tile-num">${String(i+1).padStart(2,'0')}</div><div><h2>${esc(p.title)}</h2><div class="tile-stat">${esc(p.stat)} ${esc(p.label)} · ${esc(p.rank)}</div></div><div class="tile-status">${vector(p.status)}<b>${label(p.status)}</b></div></button>`).join('')}</div>
    </div>
  </section>`;
}

function renderProblem(){
  const list = activeProblems();
  if(!list.length){ mode='setup'; render(); return; }
  current = Math.max(0, Math.min(current, list.length-1));
  const p = list[current];
  const evidenceClass = reveal ? 'show' : '';
  const verdictClass = verdictShown ? 'show' : '';
  app.innerHTML = `${controls()}<section class="stage problem-stage ${clean?'clean':''} ${studio?'studio-stage':''} layout-${settings.layout} status-${cls(p.status)}">
    <div class="broadcast-bg"></div>
    <div class="progress-meter"><b>${current+1}</b><span>of</span><b>${list.length}</b></div>
    <div class="presentation-card floating-card ${cls(p.status)} ${verdictShown?'verdict-active':''}">
      <div class="card-left">
        <div class="issue-tag">2025 Critical Issue</div>
        <h1>${esc(p.title)}</h1>
        <div class="stat-row"><div class="main-stat counter" data-final="${esc(p.stat)}">${esc(p.stat)}</div><div><div class="stat-label">${esc(p.label)}</div><div class="rank">${esc(p.rank)}</div></div></div>
        <div class="severity">${esc(p.severity)}</div>
      </div>
      <div class="card-right">
        <div class="question">Current Verdict</div>
        <div class="status-lock ${cls(p.status)} ${verdictClass}">${vector(p.status)}<b>${label(p.status)}</b></div>
        <div class="verdict-buttons">
          <button onclick="setStatus('fixed')">Fixed</button>
          <button onclick="setStatus('pending')">Pending</button>
          <button onclick="setStatus('notfixed')">Not Fixed</button>
        </div>
        <button class="reveal-btn" onclick="toggleEvidence()">${reveal?'Hide':'Reveal'} Evidence</button>
        <div class="evidence ${evidenceClass}"><div class="evidence-title">Evidence</div><ul>${p.evidence.map((e)=>`<li>✓ ${esc(e)}</li>`).join('')}</ul></div>
      </div>
      <div class="verdict-stamp ${cls(p.status)} ${verdictClass}">${vector(p.status)}<strong>${label(p.status)}</strong></div>
    </div>
  </section>`;
  requestAnimationFrame(()=>animateCounters());
}

function toggleEvidence(){ reveal=!reveal; renderProblem(); }
function showVerdict(){ verdictShown = true; reveal = true; const s = activeProblems()[current]?.status; flash = s === 'fixed' ? 'flash-fixed' : s === 'notfixed' ? 'flash-bad' : 'flash-pending'; renderProblem(); }
function setStatus(s){ activeProblems()[current].status = s; save(); verdictShown=true; reveal=true; flash = s === 'fixed' ? 'flash-fixed' : s === 'notfixed' ? 'flash-bad' : 'flash-pending'; renderProblem(); }
function next(){
  const list=activeProblems();
  if(mode==='setup'){ launch(); return; }
  if(mode==='board'){ mode='problem'; current=0; reveal=false; verdictShown=false; render(); return; }
  if(mode==='problem' && current < list.length-1){ current++; reveal=false; verdictShown=false; render(); return; }
  mode='board'; reveal=false; verdictShown=false; render();
}
function smartSpace(){
  if(mode==='problem' && !reveal){ reveal=true; renderProblem(); return; }
  next();
}
function prev(){ if(mode==='problem' && current>0){ current--; reveal=false; verdictShown=false; render(); } else { mode='board'; reveal=false; verdictShown=false; render(); } }

function animateCounters(){
  if(settings.motion === 'off') return;
  document.querySelectorAll('.counter').forEach(el=>{
    const raw = el.dataset.final || el.textContent;
    const value = parseFloat(String(raw).replace(/[^0-9.]/g,''));
    if(Number.isNaN(value)) return;
    const decimals = String(raw).includes('.') ? 2 : 0;
    const start = performance.now();
    const duration = settings.motion === 'low' ? 280 : 520;
    function frame(t){
      const p = Math.min(1,(t-start)/duration);
      const eased = 1 - Math.pow(1-p, 3);
      el.textContent = (value*eased).toFixed(decimals).replace(/\.00$/,'');
      if(p<1) requestAnimationFrame(frame); else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  });
}

document.addEventListener('keydown', e => {
  if(e.key === ' '){ e.preventDefault(); smartSpace(); }
  if(e.key === 'Enter'){ e.preventDefault(); if(mode==='problem') showVerdict(); }
  if(e.key === 'ArrowRight'){ e.preventDefault(); next(); }
  if(e.key === 'ArrowLeft') prev();
  if(e.key.toLowerCase() === 'b'){ mode='board'; reveal=false; verdictShown=false; render(); }
  if(e.key.toLowerCase() === 'v'){ mode='board'; reveal=false; verdictShown=false; render(); }
  if(e.key.toLowerCase() === 'm'){ drawer=!drawer; render(); }
  if(e.key.toLowerCase() === 'h'){ drawer=false; render(); }
  if(e.key.toLowerCase() === 'c'){ clean=!clean; render(); }
  if(e.key.toLowerCase() === 's'){ studio=!studio; drawer=false; render(); }
  if(e.key === 'Escape'){ if(studio){studio=false; render();} else if(mode!=='setup'){mode='setup'; render();} }
  if(/[1-9]/.test(e.key)){ const n=Number(e.key)-1; if(n < activeProblems().length){ current=n; mode='problem'; reveal=false; verdictShown=false; render(); } }
});

render();
