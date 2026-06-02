const defaults = [
  { title:'Pass Rush', stat:'20', label:'Sacks', rank:'32nd NFL', severity:'Worst in the NFL', status:'pending', include:true, evidence:['Osa Odighizuwa added','Romelo Height drafted','Grayson Halton drafted','More interior rush depth'] },
  { title:'Interceptions', stat:'6', label:'INTs Forced', rank:'32nd NFL', severity:'Dead last takeaway production', status:'notfixed', include:true, evidence:['Still needs proven ball production','Secondary must create more plays'] },
  { title:'Red Zone D', stat:'29', label:'TDs Allowed', rank:'Worst NFL', severity:'Could not finish drives defensively', status:'pending', include:true, evidence:['Front seven rebuilt','Must prove it inside the 20'] },
  { title:'Run Game', stat:'3.78', label:'Yards/Carry', rank:'30th NFL', severity:'Inefficient rushing attack', status:'pending', include:true, evidence:['Kaelon Black added','More OL competition','Needs explosive-run rebound'] },
  { title:'Turnovers', stat:'23', label:'Giveaways', rank:'27th NFL', severity:'Too many empty possessions', status:'notfixed', include:true, evidence:['Decision-making must improve','Ball security is not solved on paper'] },
  { title:'Penalties', stat:'106', label:'Penalties', rank:'3rd Most', severity:'Self-inflicted damage', status:'notfixed', include:true, evidence:['Discipline must improve','Cannot be fully fixed by roster moves'] }
];

let problems = JSON.parse(localStorage.getItem('fixTrackerProblemsV2') || localStorage.getItem('fixTrackerProblems') || 'null') || defaults;
problems = problems.map(p => ({ include:true, severity:'Critical issue', evidence:[], ...p }));
let mode = 'setup';
let current = 0;
let editing = 0;
let drawer = false;
let clean = false;
let reveal = false;
const app = document.getElementById('app');

const activeProblems = () => problems.filter(p => p.include !== false);
const save = () => localStorage.setItem('fixTrackerProblemsV2', JSON.stringify(problems));
const cls = s => s === 'fixed' ? 'fixed' : s === 'pending' ? 'pending' : 'notfixed';
const sym = s => s === 'fixed' ? '👍' : s === 'pending' ? '●' : '👎';
const label = s => s === 'fixed' ? 'Fixed' : s === 'pending' ? 'Pending' : 'Not Fixed';
const fixedCount = () => activeProblems().filter(p => p.status === 'fixed').length;

function render(){
  if(mode === 'setup') renderSetup();
  if(mode === 'board') renderBoard();
  if(mode === 'problem') renderProblem();
}

function field(l,k,v){
  return `<div class="stack"><div class="label">${l}</div><input value="${String(v ?? '').replaceAll('"','&quot;')}" onchange="updateField('${k}',this.value)"></div>`;
}

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
            <div class="stack evidence-edit"><div class="label">Evidence Bullets — one per line</div><textarea onchange="updateEvidence(this.value)">${p.evidence.join('\n')}</textarea></div>
            <div class="editor-actions"><button class="ghost-btn" onclick="addProblem()">Add Problem</button><button class="danger-btn" onclick="deleteProblem()">Delete</button><button class="ghost-btn" onclick="move(-1)">Move Up</button><button class="ghost-btn" onclick="move(1)">Move Down</button></div>
          </div>
          <div class="issue-list">${problems.map((x,i)=>`<div class="mini-card ${i===editing?'active':''} ${x.include===false?'off':''}" onclick="editing=${i};render()"><div class="handle">${i+1}</div><div><div class="mini-title">${x.title}</div><div class="mini-sub">${x.stat} ${x.label} · ${x.rank}</div></div><span class="badge ${cls(x.status)}">${label(x.status)}</span></div>`).join('')}</div>
        </div>
        <div class="panel production-note">
          <div class="eyebrow">Recording shortcuts</div>
          <h2>Presentation Controls</h2>
          <p><span class="kbd">Space</span> next &nbsp; <span class="kbd">←</span>/<span class="kbd">→</span> move</p>
          <p><span class="kbd">B</span> board &nbsp; <span class="kbd">V</span> verdict &nbsp; <span class="kbd">M</span> controls</p>
          <p><span class="kbd">C</span> clean mode &nbsp; <span class="kbd">H</span> hide controls</p>
          <div class="tip">Use Chrome fullscreen before recording. Hover the far-left edge to bring back hidden controls.</div>
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
function launch(){ mode='board'; current=0; reveal=false; render(); }

function controls(){
  return `<div class="edge-hotspot" onmouseenter="drawer=true;render()"></div><div class="drawer ${drawer?'show':''}" onmouseleave="drawer=false;render()"><button class="ghost-btn" onclick="mode='setup';render()">Setup</button><button class="ghost-btn" onclick="mode='board';render()">Board</button><button class="ghost-btn" onclick="prev()">Prev</button><button class="primary-btn" onclick="next()">Next</button><button class="ghost-btn" onclick="clean=!clean;render()">Clean</button></div>`;
}

function renderBoard(){
  const list = activeProblems();
  app.innerHTML = `${controls()}<section class="stage board-stage">
    <div class="broadcast-bg"></div>
    <div class="board-wrap">
      <div class="board-title"><div class="eyebrow">2025 Problem Fix Tracker</div><div class="mega-score"><span>${fixedCount()}</span><i>/</i><span>${list.length}</span></div><h1>Problems Fixed</h1><p>Roster moves were made. Production will tell the story.</p></div>
      <div class="tile-grid">${list.map((p,i)=>`<button class="tile ${cls(p.status)}" onclick="current=${i};mode='problem';reveal=false;render()"><div class="tile-num">${String(i+1).padStart(2,'0')}</div><div><h2>${p.title}</h2><div class="tile-stat">${p.stat} ${p.label} · ${p.rank}</div></div><div class="tile-status"><span>${sym(p.status)}</span><b>${label(p.status)}</b></div></button>`).join('')}</div>
      <div class="bottom-verdict">Click any problem to open the full-screen broadcast card</div>
    </div>
  </section>`;
}

function renderProblem(){
  const list = activeProblems();
  if(!list.length){ mode='setup'; render(); return; }
  current = Math.max(0, Math.min(current, list.length-1));
  const p = list[current];
  const evidenceClass = reveal ? 'show' : '';
  app.innerHTML = `${controls()}<section class="stage problem-stage ${clean?'clean':''}">
    <div class="broadcast-bg"></div>
    <div class="progress-meter"><b>${current+1}</b><span>of</span><b>${list.length}</b></div>
    <div class="presentation-card ${cls(p.status)}">
      <div class="card-left">
        <div class="issue-tag">2025 Critical Issue</div>
        <h1>${p.title}</h1>
        <div class="stat-row"><div class="main-stat">${p.stat}</div><div><div class="stat-label">${p.label}</div><div class="rank">${p.rank}</div></div></div>
        <div class="severity">${p.severity}</div>
      </div>
      <div class="card-right">
        <div class="question">Was it fixed?</div>
        <div class="status-lock ${cls(p.status)}"><span>${sym(p.status)}</span><b>${label(p.status)}</b></div>
        <div class="verdict-buttons">
          <button onclick="setStatus('fixed')">👍 Yes / Fixed</button>
          <button onclick="setStatus('pending')">● Pending</button>
          <button onclick="setStatus('notfixed')">👎 No / Not Fixed</button>
        </div>
        <button class="reveal-btn" onclick="reveal=!reveal;renderProblem()">${reveal?'Hide':'Reveal'} Evidence</button>
        <div class="evidence ${evidenceClass}"><div class="evidence-title">${label(p.status)} — Why</div><ul>${p.evidence.map((e,i)=>`<li style="--i:${i}">✓ ${e}</li>`).join('')}</ul></div>
      </div>
    </div>
  </section>`;
}

function setStatus(s){ activeProblems()[current].status = s; save(); reveal=true; renderProblem(); }
function next(){
  const list=activeProblems();
  if(mode==='setup'){ launch(); return; }
  if(mode==='board'){ mode='problem'; current=0; reveal=false; render(); return; }
  if(mode==='problem' && current < list.length-1){ current++; reveal=false; render(); return; }
  mode='board'; reveal=false; render();
}
function prev(){ if(mode==='problem' && current>0){ current--; reveal=false; render(); } else { mode='board'; reveal=false; render(); } }

document.addEventListener('keydown', e => {
  if(e.key === ' ' || e.key === 'ArrowRight'){ e.preventDefault(); next(); }
  if(e.key === 'ArrowLeft') prev();
  if(e.key.toLowerCase() === 'b'){ mode='board'; reveal=false; render(); }
  if(e.key.toLowerCase() === 'v'){ mode='board'; reveal=false; render(); }
  if(e.key.toLowerCase() === 'm'){ drawer=!drawer; render(); }
  if(e.key.toLowerCase() === 'h'){ drawer=false; render(); }
  if(e.key.toLowerCase() === 'c'){ clean=!clean; render(); }
  if(/[1-9]/.test(e.key)){ const n=Number(e.key)-1; if(n < activeProblems().length){ current=n; mode='problem'; reveal=false; render(); } }
});

render();
