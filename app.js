const defaults = [
  { title:'Pass Rush', stat:'20', label:'Sacks', rank:'32nd NFL', severity:'Worst in the NFL', status:'pending', include:true, evidence:['Osa Odighizuwa added','Romelo Height drafted','Grayson Halton drafted','More interior rush depth'] },
  { title:'Interceptions', stat:'6', label:'INTs Forced', rank:'32nd NFL', severity:'Dead last takeaway production', status:'notfixed', include:true, evidence:['Still needs proven ball production','Secondary must create more plays'] },
  { title:'Red Zone D', stat:'29', label:'TDs Allowed', rank:'Worst NFL', severity:'Could not finish drives defensively', status:'pending', include:true, evidence:['Front seven rebuilt','Must prove it inside the 20'] },
  { title:'Run Game', stat:'3.78', label:'Yards/Carry', rank:'30th NFL', severity:'Inefficient rushing attack', status:'pending', include:true, evidence:['Kaelon Black added','More OL competition','Needs explosive-run rebound'] },
  { title:'Turnovers', stat:'23', label:'Giveaways', rank:'27th NFL', severity:'Too many empty possessions', status:'notfixed', include:true, evidence:['Decision-making must improve','Ball security is not solved on paper'] },
  { title:'Penalties', stat:'106', label:'Penalties', rank:'3rd Most', severity:'Self-inflicted damage', status:'notfixed', include:true, evidence:['Discipline must improve','Cannot be fully fixed by roster moves'] }
];

let problems = JSON.parse(localStorage.getItem('fixTrackerProblemsV4') || localStorage.getItem('fixTrackerProblemsV2') || localStorage.getItem('fixTrackerProblems') || 'null') || defaults;
problems = problems.map(p => ({ include:true, severity:'Critical issue', evidence:[], ...p }));
let mode = 'setup';
let current = 0;
let editing = 0;
let drawer = false;
let clean = false;
let studio = false;
let revealCount = 0;
let verdictBurst = '';
const app = document.getElementById('app');

const activeProblems = () => problems.filter(p => p.include !== false);
const save = () => localStorage.setItem('fixTrackerProblemsV4', JSON.stringify(problems));
const cls = s => s === 'fixed' ? 'fixed' : s === 'pending' ? 'pending' : 'notfixed';
const label = s => s === 'fixed' ? 'Fixed' : s === 'pending' ? 'Pending' : 'Not Fixed';
const fixedCount = () => activeProblems().filter(p => p.status === 'fixed').length;
const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function statusToken(s, large=false){
  const c = cls(s);
  if(c === 'fixed') return `<span class="motion-token token-fixed ${large?'large':''}" aria-label="Fixed"><i></i></span>`;
  if(c === 'pending') return `<span class="motion-token token-pending ${large?'large':''}" aria-label="Pending"><i></i></span>`;
  return `<span class="motion-token token-notfixed ${large?'large':''}" aria-label="Not Fixed"><i></i></span>`;
}

function render(){
  document.body.classList.toggle('studio-on', studio);
  if(mode === 'setup') renderSetup();
  if(mode === 'board') renderBoard();
  if(mode === 'problem') renderProblem();
}

function field(l,k,v){
  return `<div class="stack"><div class="label">${l}</div><input value="${esc(v)}" onchange="updateField('${k}',this.value)"></div>`;
}

function renderSetup(){
  studio = false;
  const p = problems[editing] || problems[0];
  app.innerHTML = `
    <section class="control-room">
      <div class="studio-atmos control-atmos"><span></span><span></span><span></span></div>
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
            <div class="stack evidence-edit"><div class="label">Evidence Bullets — one per line</div><textarea onchange="updateEvidence(this.value)">${esc(p.evidence.join('\n'))}</textarea></div>
            <div class="editor-actions"><button class="ghost-btn" onclick="addProblem()">Add Problem</button><button class="danger-btn" onclick="deleteProblem()">Delete</button><button class="ghost-btn" onclick="move(-1)">Move Up</button><button class="ghost-btn" onclick="move(1)">Move Down</button></div>
          </div>
          <div class="issue-list">${problems.map((x,i)=>`<div class="mini-card ${i===editing?'active':''} ${x.include===false?'off':''}" onclick="editing=${i};render()"><div class="handle">${i+1}</div><div><div class="mini-title">${esc(x.title)}</div><div class="mini-sub">${esc(x.stat)} ${esc(x.label)} · ${esc(x.rank)}</div></div><span class="badge ${cls(x.status)}">${label(x.status)}</span></div>`).join('')}</div>
        </div>
        <div class="panel production-note">
          <div class="eyebrow">Recording shortcuts</div>
          <h2>Presentation Controls</h2>
          <p><span class="kbd">Space</span> reveal / next &nbsp; <span class="kbd">←</span>/<span class="kbd">→</span> move</p>
          <p><span class="kbd">B</span> board &nbsp; <span class="kbd">F</span> fixed &nbsp; <span class="kbd">N</span> not fixed</p>
          <p><span class="kbd">S</span> studio mode &nbsp; <span class="kbd">M</span> controls &nbsp; <span class="kbd">C</span> clean</p>
          <div class="tip">Studio Mode hides all interface chrome and adds 3D tilt, lens glow, verdict slams, and staged evidence reveals.</div>
        </div>
      </div>
    </section>`;
}

function updateField(k,v){ problems[editing][k] = v; save(); render(); }
function updateEvidence(v){ problems[editing].evidence = v.split('\n').map(x=>x.trim()).filter(Boolean); save(); render(); }
function toggleInclude(v){ problems[editing].include = v; save(); render(); }
function addProblem(){ problems.push({title:'New Problem',stat:'0',label:'Stat',rank:'Rank',severity:'Why it mattered',status:'pending',include:true,evidence:['Evidence item']}); editing=problems.length-1; save(); render(); }
function deleteProblem(){ if(problems.length < 2) return; problems.splice(editing,1); editing=Math.max(0,editing-1); save(); render(); }
function move(d){ const ni=editing+d; if(ni<0||ni>=problems.length)return; [problems[editing],problems[ni]]=[problems[ni],problems[editing]]; editing=ni; save(); render(); }
function resetData(){ problems=structuredClone(defaults); editing=0; current=0; save(); render(); }
function launch(){ mode='board'; current=0; revealCount=0; render(); }

function controls(){
  if(studio) return `<div class="edge-hotspot" onmouseenter="drawer=true;render()"></div><div class="drawer ${drawer?'show':''}" onmouseleave="drawer=false;render()"><button class="ghost-btn" onclick="studio=false;render()">Exit Studio</button><button class="ghost-btn" onclick="mode='setup';render()">Setup</button><button class="ghost-btn" onclick="mode='board';render()">Board</button><button class="primary-btn" onclick="nextStep()">Next</button></div>`;
  return `<div class="edge-hotspot" onmouseenter="drawer=true;render()"></div><div class="drawer ${drawer?'show':''}" onmouseleave="drawer=false;render()"><button class="ghost-btn" onclick="mode='setup';render()">Setup</button><button class="ghost-btn" onclick="mode='board';render()">Board</button><button class="ghost-btn" onclick="prev()">Prev</button><button class="primary-btn" onclick="nextStep()">Next</button><button class="ghost-btn" onclick="studio=!studio;render()">Studio</button><button class="ghost-btn" onclick="clean=!clean;render()">Clean</button></div>`;
}

function renderBoard(){
  const list = activeProblems();
  app.innerHTML = `${controls()}<section class="stage board-stage ${studio?'studio-stage':''}">
    <div class="studio-atmos"><span></span><span></span><span></span></div><div class="broadcast-bg"></div><div class="lens-glow ${verdictBurst}"></div>
    <div class="board-wrap broadcast-board">
      <div class="board-title"><div class="eyebrow">2025 Problem Fix Tracker</div><div class="mega-score"><span class="countup" data-value="${fixedCount()}">0</span><i>/</i><span>${list.length}</span></div><h1>Problems Fixed</h1><p>Roster moves were made. Production will tell the story.</p></div>
      <div class="tile-grid">${list.map((p,i)=>`<button class="tile ${cls(p.status)}" onclick="current=${i};mode='problem';revealCount=0;verdictBurst='';render()"><div class="tile-num">${String(i+1).padStart(2,'0')}</div><div><h2>${esc(p.title)}</h2><div class="tile-stat">${esc(p.stat)} ${esc(p.label)} · ${esc(p.rank)}</div></div><div class="tile-status">${statusToken(p.status)}<b>${label(p.status)}</b></div></button>`).join('')}</div>
      <div class="bottom-verdict">Click any problem to open the full-screen broadcast card</div>
    </div>
  </section>`;
  animateCounters();
}

function renderProblem(){
  const list = activeProblems();
  if(!list.length){ mode='setup'; render(); return; }
  current = Math.max(0, Math.min(current, list.length-1));
  const p = list[current];
  const visibleEvidence = p.evidence.slice(0, revealCount);
  const showVerdict = revealCount >= p.evidence.length && revealCount > 0;
  app.innerHTML = `${controls()}<section class="stage problem-stage ${clean?'clean':''} ${studio?'studio-stage':''} ${verdictBurst}">
    <div class="studio-atmos"><span></span><span></span><span></span></div><div class="broadcast-bg"></div><div class="lens-glow ${cls(p.status)}"></div>
    <div class="progress-meter"><b>${current+1}</b><span>of</span><b>${list.length}</b></div>
    <div class="presentation-card broadcast-board ${cls(p.status)} ${showVerdict?'verdict-visible':''} ${verdictBurst}">
      <div class="card-left">
        <div class="issue-tag">2025 Critical Issue</div>
        <h1>${esc(p.title)}</h1>
        <div class="stat-row"><div class="main-stat countup stat-spin" data-value="${esc(p.stat)}">0</div><div><div class="stat-label">${esc(p.label)}</div><div class="rank rank-in">${esc(p.rank)}</div></div></div>
        <div class="severity">${esc(p.severity)}</div>
      </div>
      <div class="card-right">
        <div class="question">Was it fixed?</div>
        <div class="status-lock ${cls(p.status)} ${showVerdict?'stamp-in':''}">${statusToken(p.status,true)}<b>${label(p.status)}</b></div>
        <div class="verdict-buttons">
          <button onclick="setStatus('fixed')"><span class="button-token fixed-mini"></span> Yes / Fixed</button>
          <button onclick="setStatus('pending')"><span class="button-token pending-mini"></span> Pending</button>
          <button onclick="setStatus('notfixed')"><span class="button-token notfixed-mini"></span> No / Not Fixed</button>
        </div>
        <button class="reveal-btn" onclick="nextStep()">${revealCount < p.evidence.length ? 'Reveal Evidence' : 'Next'}</button>
        <div class="evidence ${visibleEvidence.length?'show':''}"><div class="evidence-title">${label(p.status)} — Why</div><ul>${visibleEvidence.map((e,i)=>`<li style="--i:${i}"><span class="checkmark"></span>${esc(e)}</li>`).join('')}</ul></div>
      </div>
    </div>
  </section>`;
  animateCounters();
}

function setStatus(s){
  const p = activeProblems()[current];
  const realIndex = problems.indexOf(p);
  problems[realIndex].status = s;
  save();
  verdictBurst = s === 'fixed' ? 'burst-fixed' : s === 'notfixed' ? 'burst-notfixed' : 'burst-pending';
  revealCount = Math.max(revealCount, 1);
  renderProblem();
  setTimeout(() => { verdictBurst=''; }, 700);
}

function nextStep(){
  const list=activeProblems();
  if(mode==='setup'){ launch(); return; }
  if(mode==='board'){ mode='problem'; current=0; revealCount=0; verdictBurst=''; render(); return; }
  if(mode==='problem'){
    const p = list[current];
    if(revealCount < p.evidence.length){ revealCount++; renderProblem(); return; }
    if(current < list.length-1){ current++; revealCount=0; verdictBurst=''; render(); return; }
    mode='board'; revealCount=0; verdictBurst=''; render(); return;
  }
}
function next(){ nextStep(); }
function prev(){ if(mode==='problem' && current>0){ current--; revealCount=0; verdictBurst=''; render(); } else { mode='board'; revealCount=0; verdictBurst=''; render(); } }

function animateCounters(){
  document.querySelectorAll('.countup').forEach(el => {
    const raw = String(el.dataset.value || '0');
    const target = parseFloat(raw.replace(/[^0-9.]/g,''));
    if(Number.isNaN(target)) { el.textContent = raw; return; }
    const decimals = raw.includes('.') ? Math.min(2, raw.split('.')[1].length) : 0;
    const suffix = raw.replace(/[0-9.]/g,'');
    const start = performance.now();
    const dur = 520;
    const tick = now => {
      const t = Math.min(1, (now-start)/dur);
      const eased = 1 - Math.pow(1-t, 3);
      const val = target * eased;
      el.textContent = `${decimals ? val.toFixed(decimals) : Math.round(val)}${suffix}`;
      if(t < 1) requestAnimationFrame(tick); else el.textContent = raw;
    };
    requestAnimationFrame(tick);
  });
}

document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if(e.key === ' ' || e.key === 'ArrowRight'){ e.preventDefault(); nextStep(); }
  if(e.key === 'ArrowLeft') prev();
  if(key === 'b'){ mode='board'; revealCount=0; verdictBurst=''; render(); }
  if(key === 'v'){ mode='board'; revealCount=0; verdictBurst=''; render(); }
  if(key === 'm'){ drawer=!drawer; render(); }
  if(key === 'h'){ drawer=false; render(); }
  if(key === 'c'){ clean=!clean; render(); }
  if(key === 's'){ studio=!studio; drawer=false; if(mode==='setup') mode='board'; render(); }
  if(key === 'f' && mode==='problem') setStatus('fixed');
  if(key === 'p' && mode==='problem') setStatus('pending');
  if(key === 'n' && mode==='problem') setStatus('notfixed');
  if(/[1-9]/.test(e.key)){ const n=Number(e.key)-1; if(n < activeProblems().length){ current=n; mode='problem'; revealCount=0; verdictBurst=''; render(); } }
});

render();
