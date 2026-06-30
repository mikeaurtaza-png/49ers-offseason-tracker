const DEFAULT_PROBLEMS = [
  {
    title: "Pass Rush",
    stat: "20 sacks",
    rank: "32nd NFL",
    status: "Pending",
    included: true,
    evidence: ["Osa Odighizuwa added", "Romelo Height drafted", "Grayson Halton drafted"]
  },
  {
    title: "Interceptions",
    stat: "6 INTs forced",
    rank: "32nd NFL",
    status: "Pending",
    included: true,
    evidence: ["Secondary turnover production must rebound", "Pressure-to-takeaway pipeline still unproven"]
  },
  {
    title: "Red Zone D",
    stat: "29 TDs allowed",
    rank: "Worst NFL",
    status: "Pending",
    included: true,
    evidence: ["Short-field defense remains the swing category", "Personnel changes need proof near the goal line"]
  },
  {
    title: "Run Game",
    stat: "3.78 yards/carry",
    rank: "30th NFL",
    status: "Pending",
    included: true,
    evidence: ["Efficiency must return on early downs", "Blocking cohesion is the first checkpoint"]
  },
  {
    title: "Turnovers",
    stat: "23 giveaways",
    rank: "27th NFL",
    status: "Not Fixed",
    included: true,
    evidence: ["Ball security is not fixed by roster additions alone", "Quarterback and skill-player execution must change"]
  },
  {
    title: "Penalties",
    stat: "106 penalties",
    rank: "3rd most",
    status: "Not Fixed",
    included: true,
    evidence: ["Discipline has to show up weekly", "Pre-snap and situational flags are the tell"]
  }
];

const STORAGE_KEY = "49ers-fix-tracker-episode-v1";

let state = {
  problems: structuredClone(DEFAULT_PROBLEMS),
  selectedIndex: 0,
  evidenceVisible: false,
  verdictPickerVisible: false,
  settings: {
    motion: "low",
    theme: "classic",
    layout: "standard",
    background: "clean"
  }
};

const problemList = document.querySelector("#problemList");
const studioCard = document.querySelector("#studioCard");
const studioTitle = document.querySelector("#studioTitle");
const studioStat = document.querySelector("#studioStat");
const studioRank = document.querySelector("#studioRank");
const studioVerdict = document.querySelector("#studioVerdict");
const studioEvidence = document.querySelector("#studioEvidence");
const evidencePanel = document.querySelector("#evidencePanel");
const verdictPicker = document.querySelector("#verdictPicker");
const fixedScore = document.querySelector("#fixedScore");
const boardGrid = document.querySelector("#boardGrid");
const saveStatus = document.querySelector("#saveStatus");
const episodeFileInput = document.querySelector("#episodeFileInput");
const settingInputs = {
  motion: document.querySelector("#motionSetting"),
  theme: document.querySelector("#themeSetting"),
  layout: document.querySelector("#layoutSetting"),
  background: document.querySelector("#backgroundSetting")
};

function episodePayload() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    problems: state.problems,
    selectedIndex: state.selectedIndex,
    settings: state.settings
  };
}

function captureEditorValues() {
  problemList.querySelectorAll("[data-field][data-index]").forEach((field) => {
    const index = Number(field.dataset.index);
    const key = field.dataset.field;
    const problem = state.problems[index];
    if (!problem) return;

    if (key === "included") {
      problem.included = field.checked;
    } else if (key === "evidence") {
      problem.evidence = field.value.split("\n").map((item) => item.trim()).filter(Boolean);
    } else {
      problem[key] = field.value;
    }
  });
}

function saveEpisode(message = "Autosaved locally") {
  try {
    captureEditorValues();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(episodePayload()));
    saveStatus.textContent = message;
  } catch {
    saveStatus.textContent = "Autosave unavailable";
  }
}

function loadSavedEpisode() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    applyEpisodePayload(JSON.parse(raw), "Loaded saved episode");
  } catch {
    saveStatus.textContent = "Saved episode could not load";
  }
}

function applyEpisodePayload(payload, message = "Episode loaded") {
  if (!payload || !Array.isArray(payload.problems)) {
    throw new Error("Invalid episode file");
  }

  state.problems = payload.problems.map((problem, index) => ({
    title: String(problem.title || DEFAULT_PROBLEMS[index]?.title || "Problem"),
    stat: String(problem.stat || DEFAULT_PROBLEMS[index]?.stat || ""),
    rank: String(problem.rank || DEFAULT_PROBLEMS[index]?.rank || ""),
    status: ["Fixed", "Pending", "Not Fixed"].includes(problem.status) ? problem.status : "Pending",
    included: Boolean(problem.included),
    evidence: Array.isArray(problem.evidence) ? problem.evidence.map(String) : []
  }));
  state.selectedIndex = Number.isInteger(payload.selectedIndex) ? payload.selectedIndex : 0;
  state.evidenceVisible = false;
  state.verdictPickerVisible = false;

  if (payload.settings && typeof payload.settings === "object") {
    state.settings = {
      motion: ["off", "low", "cinematic"].includes(payload.settings.motion) ? payload.settings.motion : "low",
      theme: ["classic", "espn", "films", "keynote"].includes(payload.settings.theme) ? payload.settings.theme : "classic",
      layout: ["standard", "hero-stat", "verdict-first"].includes(payload.settings.layout) ? payload.settings.layout : "standard",
      background: ["clean", "broadcast", "films"].includes(payload.settings.background) ? payload.settings.background : "clean"
    };
  }

  syncSettingsInputs();
  applySettings();
  renderProblemEditor();
  renderStage();
  saveEpisode(message);
}

function syncSettingsInputs() {
  Object.entries(settingInputs).forEach(([key, input]) => {
    input.value = state.settings[key];
  });
}

function exportEpisode() {
  const blob = new Blob([JSON.stringify(episodePayload(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `49ers-fix-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  saveStatus.textContent = "Episode exported";
}

function includedProblems() {
  return state.problems.filter((problem) => problem.included);
}

function selectedProblem() {
  const included = includedProblems();
  if (!included.length) return state.problems[0];
  return included[state.selectedIndex % included.length];
}

function setSelectedStatus(status) {
  const problem = selectedProblem();
  if (!problem) return;
  problem.status = status;
  state.verdictPickerVisible = false;
  renderProblemEditor();
  renderStage();
  saveEpisode();
}

function toggleVerdictPicker(forceVisible) {
  if (document.body.dataset.mode !== "studio") {
    setMode("studio");
  }
  state.verdictPickerVisible = typeof forceVisible === "boolean" ? forceVisible : !state.verdictPickerVisible;
  if (state.verdictPickerVisible) {
    state.evidenceVisible = false;
  }
  renderStage();
}

function statusClass(status) {
  if (status === "Fixed") return "status-fixed";
  if (status === "Not Fixed") return "status-not-fixed";
  return "status-pending";
}

function textSize(value, mediumAt, compactAt) {
  const length = String(value).replace(/\s+/g, "").length;
  if (length >= compactAt) return "compact";
  if (length >= mediumAt) return "medium";
  return "normal";
}

function formatStatParts(value) {
  const manualParts = String(value).split("|").map((part) => part.trim()).filter(Boolean);
  if (manualParts.length > 1) return manualParts.slice(0, 3);

  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3 && /^[\d.]+$/.test(parts[0])) {
    return [`${parts[0]} ${parts[1]}`, parts.slice(2).join(" ")];
  }
  if (parts.length === 2 && /^[\d.]+$/.test(parts[0])) {
    return parts;
  }
  return [String(value)];
}

function applySettings() {
  document.body.classList.remove(
    "motion-off",
    "motion-low",
    "motion-cinematic",
    "theme-classic",
    "theme-espn",
    "theme-films",
    "theme-keynote",
    "layout-standard",
    "layout-hero-stat",
    "layout-verdict-first",
    "bg-clean",
    "bg-broadcast",
    "bg-films"
  );

  document.body.classList.add(
    `motion-${state.settings.motion}`,
    `theme-${state.settings.theme}`,
    `layout-${state.settings.layout}`,
    `bg-${state.settings.background}`
  );
}

function setMode(mode) {
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
  document.body.dataset.mode = mode;
  if (mode === "studio") {
    state.evidenceVisible = false;
    state.verdictPickerVisible = false;
  }
  renderStage();
}

function renderProblemEditor() {
  problemList.innerHTML = "";

  state.problems.forEach((problem, index) => {
    const item = document.createElement("article");
    item.className = `problem-item${problem.included ? "" : " excluded"}`;
    item.innerHTML = `
      <div class="problem-controls">
        <button type="button" data-action="up" data-index="${index}" aria-label="Move ${problem.title} up">↑</button>
        <button type="button" data-action="down" data-index="${index}" aria-label="Move ${problem.title} down">↓</button>
      </div>
      <div class="problem-fields">
        <label class="field include">
          <input type="checkbox" data-field="included" data-index="${index}" ${problem.included ? "checked" : ""}>
          <span>Include</span>
        </label>
        <label class="field title">
          <span>Problem Title</span>
          <input value="${escapeAttribute(problem.title)}" data-field="title" data-index="${index}">
        </label>
        <label class="field stat">
          <span>Stat</span>
          <input value="${escapeAttribute(problem.stat)}" data-field="stat" data-index="${index}">
        </label>
        <label class="field rank">
          <span>Rank</span>
          <input value="${escapeAttribute(problem.rank)}" data-field="rank" data-index="${index}">
        </label>
        <label class="field status">
          <span>Status</span>
          <select data-field="status" data-index="${index}">
            ${["Fixed", "Pending", "Not Fixed"].map((status) => `<option value="${status}" ${problem.status === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        <label class="field evidence">
          <span>Evidence Bullets</span>
          <textarea data-field="evidence" data-index="${index}">${escapeText(problem.evidence.join("\n"))}</textarea>
        </label>
      </div>
    `;
    problemList.appendChild(item);
  });
}

function renderStage() {
  const problem = selectedProblem();
  if (!problem) return;
  const statParts = formatStatParts(problem.stat);

  studioTitle.textContent = problem.title;
  studioStat.innerHTML = statParts.map((part) => `<span class="stat-line">${escapeText(part)}</span>`).join("");
  studioRank.textContent = problem.rank;
  studioCard.dataset.titleSize = textSize(problem.title, 9, 12);
  studioCard.dataset.statSize = statSizeForParts(statParts);
  studioCard.dataset.statLines = String(statParts.length);
  studioCard.dataset.statManual = String(problem.stat.includes("|"));
  studioCard.dataset.verdict = statusClass(problem.status).replace("status-", "");
  studioVerdict.textContent = problem.status;
  studioVerdict.className = `verdict-chip ${statusClass(problem.status)}`;
  studioEvidence.innerHTML = "";
  problem.evidence.filter(Boolean).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    studioEvidence.appendChild(li);
  });

  evidencePanel.classList.toggle("visible", state.evidenceVisible);
  verdictPicker.classList.toggle("visible", state.verdictPickerVisible);
  verdictPicker.querySelectorAll("[data-status]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.status === problem.status);
  });
  studioCard.classList.remove("refresh");

  const fixedCount = state.problems.filter((item) => item.included && item.status === "Fixed").length;
  const totalCount = state.problems.filter((item) => item.included).length;
  fixedScore.textContent = `${fixedCount}/${totalCount} Problems Fixed`;

  boardGrid.innerHTML = "";
  state.problems.filter((item) => item.included).forEach((item) => {
    const card = document.createElement("article");
    card.className = "board-card";
    card.innerHTML = `
      <span class="board-status ${statusClass(item.status)}">${item.status}</span>
      <h3>${escapeText(item.title)}</h3>
      <p>${escapeText(item.stat)} · ${escapeText(item.rank)}</p>
    `;
    boardGrid.appendChild(card);
  });
}

function statSizeForParts(parts) {
  const longestLine = parts.reduce((longest, part) => part.length > longest.length ? part : longest, "");
  const totalLength = parts.join("").length;
  if (parts.length >= 3 || longestLine.length >= 14 || totalLength >= 24) return "dense";
  if (longestLine.length >= 11) return "tight";
  if (longestLine.length >= 10 || totalLength >= 14) return "compact";
  if (parts.length > 1) return "medium";
  return "normal";
}

function updateProblem(index, field, value, options = {}) {
  const problem = state.problems[index];
  if (!problem) return;
  if (field === "included") {
    problem.included = value;
  } else if (field === "evidence") {
    problem.evidence = value.split("\n").map((item) => item.trim()).filter(Boolean);
  } else {
    problem[field] = value;
  }
  state.selectedIndex = Math.min(state.selectedIndex, Math.max(includedProblems().length - 1, 0));
  if (!options.keepEditorFocus) {
    renderProblemEditor();
  }
  renderStage();
  saveEpisode();
}

function moveProblem(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= state.problems.length) return;
  const [item] = state.problems.splice(index, 1);
  state.problems.splice(nextIndex, 0, item);
  renderProblemEditor();
  renderStage();
  saveEpisode();
}

function handleSpacebar() {
  const mode = document.body.dataset.mode;
  if (mode !== "studio") return;
  if (!state.evidenceVisible) {
    state.evidenceVisible = true;
  } else {
    const total = includedProblems().length || 1;
    state.selectedIndex = (state.selectedIndex + 1) % total;
    state.evidenceVisible = false;
  }
  renderStage();
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

problemList.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const index = Number(event.target.dataset.index);
  if (!field) return;
  updateProblem(index, field, event.target.value, { keepEditorFocus: true });
});

problemList.addEventListener("change", (event) => {
  const field = event.target.dataset.field;
  const index = Number(event.target.dataset.index);
  if (!field) return;
  const value = field === "included" ? event.target.checked : event.target.value;
  updateProblem(index, field, value);
});

problemList.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const index = Number(event.target.dataset.index);
  if (action === "up") moveProblem(index, -1);
  if (action === "down") moveProblem(index, 1);
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.view));
});

document.querySelector("#resetDefaults").addEventListener("click", () => {
  state.problems = structuredClone(DEFAULT_PROBLEMS);
  state.selectedIndex = 0;
  state.evidenceVisible = false;
  state.verdictPickerVisible = false;
  renderProblemEditor();
  renderStage();
  saveEpisode("Defaults restored");
});

verdictPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;
  setSelectedStatus(button.dataset.status);
});

Object.entries(settingInputs).forEach(([key, input]) => {
  input.addEventListener("change", () => {
    state.settings[key] = input.value;
    applySettings();
    saveEpisode();
  });
});

document.querySelector("#exportEpisode").addEventListener("click", exportEpisode);

document.querySelector("#importEpisode").addEventListener("click", () => {
  episodeFileInput.click();
});

episodeFileInput.addEventListener("change", () => {
  const file = episodeFileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      applyEpisodePayload(JSON.parse(String(reader.result)), "Episode imported");
    } catch {
      saveStatus.textContent = "Import failed";
    } finally {
      episodeFileInput.value = "";
    }
  });
  reader.readAsText(file);
});

document.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const activeTag = activeElement?.tagName;
  const isEditorControl = ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag) || activeElement?.isContentEditable;
  if (isEditorControl) return;

  if (event.code === "Space") {
    event.preventDefault();
    if (state.verdictPickerVisible) {
      state.verdictPickerVisible = false;
      renderStage();
      return;
    }
    handleSpacebar();
  }
  if (event.key.toLowerCase() === "s") setMode("studio");
  if (event.key.toLowerCase() === "m") setMode("control");
  if (event.key.toLowerCase() === "b") setMode("board");
  if (event.key === "1") setSelectedStatus("Fixed");
  if (event.key === "2") setSelectedStatus("Pending");
  if (event.key === "3") setSelectedStatus("Not Fixed");
  if (event.key.toLowerCase() === "p") setSelectedStatus("Pending");
  if (event.key.toLowerCase() === "f") setSelectedStatus("Fixed");
  if (event.key.toLowerCase() === "n") setSelectedStatus("Not Fixed");
  if (event.key.toLowerCase() === "v") {
    event.preventDefault();
    toggleVerdictPicker();
  }
});

window.addEventListener("pagehide", () => saveEpisode("Saved on this browser"));
window.addEventListener("beforeunload", () => saveEpisode("Saved on this browser"));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveEpisode("Saved on this browser");
  }
});

syncSettingsInputs();
renderProblemEditor();
applySettings();
renderStage();
loadSavedEpisode();
saveEpisode();
