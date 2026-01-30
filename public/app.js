const state = {
  groups: [],
  conflicts: [],
  expanded: new Set(),
  lastSync: null,
};

const elements = {
  groupsContainer: document.getElementById("groupsContainer"),
  totalGroups: document.getElementById("totalGroups"),
  totalScenarios: document.getElementById("totalScenarios"),
  lastSync: document.getElementById("lastSync"),
  addForm: document.getElementById("addForm"),
  inputField: document.getElementById("inputField"),
  refreshButton: document.getElementById("refreshButton"),
  conflictButton: document.getElementById("conflictButton"),
  conflictSummary: document.getElementById("conflictSummary"),
  toastContainer: document.getElementById("toastContainer"),
  testModal: document.getElementById("testModal"),
  closeModal: document.getElementById("closeModal"),
  testFileName: document.getElementById("testFileName"),
  testContent: document.getElementById("testContent"),
};

const PRIORITY_MAP = [
  { match: ["P1", "높음", "critical", "치명"], label: "높음", color: "bg-red-500/80" },
  { match: ["P2", "중간", "medium"], label: "중간", color: "bg-amber-400/80" },
  { match: ["P3", "낮음", "low"], label: "낮음", color: "bg-emerald-400/80" },
];

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  const colors = {
    info: "bg-slate-800 border-slate-600",
    success: "bg-emerald-500/90 border-emerald-300/40 text-slate-900",
    error: "bg-red-500/90 border-red-300/40 text-slate-900",
    warn: "bg-amber-400/90 border-amber-200/40 text-slate-900",
  };
  toast.className = `toast-enter border ${colors[type]} text-sm px-4 py-3 rounded-2xl shadow-lg`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

function getPriority(tags = []) {
  if (!tags || tags.length === 0) {
    return { label: "미지정", color: "bg-slate-600/70" };
  }
  const joined = tags.join(" ");
  const found = PRIORITY_MAP.find((item) =>
    item.match.some((keyword) => joined.toLowerCase().includes(keyword.toLowerCase()))
  );
  return found ? found : { label: "미지정", color: "bg-slate-600/70" };
}

function getConflictMap(conflicts) {
  const map = new Map();
  conflicts.forEach((conflict) => {
    [conflict.scenarioA, conflict.scenarioB].forEach((scenario) => {
      if (!scenario || !scenario.id) return;
      const list = map.get(scenario.id) || [];
      list.push(conflict);
      map.set(scenario.id, list);
    });
  });
  return map;
}

function renderSummary() {
  const totalGroups = state.groups.length;
  const totalScenarios = state.groups.reduce((sum, group) => sum + group.scenarios.length, 0);
  elements.totalGroups.textContent = totalGroups;
  elements.totalScenarios.textContent = totalScenarios;
  elements.lastSync.textContent = state.lastSync ? formatDate(state.lastSync) : "-";

  if (state.conflicts.length === 0) {
    elements.conflictSummary.innerHTML = `
      <div class="rounded-2xl bg-slate-900/60 border border-slate-700/40 p-4 text-slate-300">
        현재 감지된 충돌이 없습니다.
      </div>
    `;
    return;
  }

  const stats = state.conflicts.reduce(
    (acc, conflict) => {
      acc[conflict.type] = (acc[conflict.type] || 0) + 1;
      return acc;
    },
    { overlap: 0, contradiction: 0, redundant: 0 }
  );

  elements.conflictSummary.innerHTML = `
    <div class="rounded-2xl bg-slate-900/60 border border-slate-700/40 p-4">
      <p class="text-sm text-slate-400">총 충돌 후보</p>
      <p class="text-2xl font-display font-semibold mt-2">${state.conflicts.length}건</p>
    </div>
    <div class="grid gap-3 md:grid-cols-3">
      <div class="rounded-2xl bg-slate-900/60 border border-slate-700/40 p-4">
        <p class="text-sm text-slate-400">중복</p>
        <p class="text-xl font-display font-semibold mt-2">${stats.redundant}</p>
      </div>
      <div class="rounded-2xl bg-slate-900/60 border border-slate-700/40 p-4">
        <p class="text-sm text-slate-400">상충</p>
        <p class="text-xl font-display font-semibold mt-2">${stats.contradiction}</p>
      </div>
      <div class="rounded-2xl bg-slate-900/60 border border-slate-700/40 p-4">
        <p class="text-sm text-slate-400">중복 가능성</p>
        <p class="text-xl font-display font-semibold mt-2">${stats.overlap}</p>
      </div>
    </div>
  `;
}

function renderGroups() {
  const conflictMap = getConflictMap(state.conflicts);
  elements.groupsContainer.innerHTML = "";

  if (state.groups.length === 0) {
    elements.groupsContainer.innerHTML = `
      <div class="col-span-full glass rounded-3xl p-10 text-center text-slate-300">
        아직 저장된 시나리오 그룹이 없습니다. 새 요청을 입력해 보세요.
      </div>
    `;
    return;
  }

  state.groups.forEach((group) => {
    const isExpanded = state.expanded.has(group.id);
    const groupConflictCount = group.scenarios.reduce((sum, scenario) => {
      return sum + (conflictMap.get(scenario.id)?.length || 0);
    }, 0);
    const history = group.generationHistory || [];
    const latestHistory = history[history.length - 1];

    const card = document.createElement("div");
    card.className = "glass rounded-3xl p-6 card-hover fade-in";
    card.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-500">그룹 ${group.id.slice(0, 8)}</p>
          <h3 class="text-lg font-display font-semibold mt-2">${group.input}</h3>
          <p class="text-sm text-slate-400 mt-2">${formatDate(group.createdAt)}</p>
        </div>
        <div class="text-right space-y-2">
          <span class="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/50">
            시나리오 ${group.scenarios.length}개
          </span>
          <span class="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full ${
            groupConflictCount > 0 ? "bg-ember/90 text-slate-900" : "bg-emerald-400/80 text-slate-900"
          }">
            ${groupConflictCount > 0 ? `충돌 ${groupConflictCount}건` : "충돌 없음"}
          </span>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap gap-3">
        <button data-action="toggle" class="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-sm">
          ${isExpanded ? "접기" : "시나리오 보기"}
        </button>
        <button data-action="generate" class="px-4 py-2 rounded-full bg-neon text-slate-900 font-semibold text-sm">
          테스트 생성
        </button>
        ${
          latestHistory
            ? `<button data-action="view-test" class="px-4 py-2 rounded-full bg-slate-700 text-sm">테스트 보기</button>`
            : ""
        }
      </div>
      <div class="mt-6 space-y-4 ${isExpanded ? "" : "hidden"}" data-section="details">
        ${group.scenarios
          .map((scenario, index) => {
            const conflicts = conflictMap.get(scenario.id) || [];
            const priority = getPriority(scenario.tags);
            return `
              <div class="rounded-2xl bg-slate-900/70 border border-slate-700/40 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-xs text-slate-500">시나리오 ${index + 1}</p>
                    <h4 class="text-base font-semibold mt-1">${scenario.title}</h4>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span class="text-xs px-3 py-1 rounded-full ${priority.color} text-slate-900">${priority.label}</span>
                    ${
                      conflicts.length > 0
                        ? `<span class="text-xs px-3 py-1 rounded-full bg-ember/90 text-slate-900">충돌 ${conflicts.length}건</span>`
                        : `<span class="text-xs px-3 py-1 rounded-full bg-emerald-400/80 text-slate-900">정상</span>`
                    }
                  </div>
                </div>
                <div class="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p class="text-sm text-slate-400">단계</p>
                    <ol class="mt-2 text-sm text-slate-200 space-y-2 list-decimal list-inside">
                      ${scenario.steps.map((step) => `<li>${step}</li>`).join("")}
                    </ol>
                  </div>
                  <div>
                    <p class="text-sm text-slate-400">기대 결과</p>
                    <ul class="mt-2 text-sm text-slate-200 space-y-2 list-disc list-inside">
                      ${scenario.expected.map((exp) => `<li>${exp}</li>`).join("")}
                    </ul>
                  </div>
                </div>
                ${
                  scenario.tags && scenario.tags.length > 0
                    ? `<div class="mt-4 flex flex-wrap gap-2">
                        ${scenario.tags
                          .map((tag) => `<span class="tag text-xs px-3 py-1 rounded-full">${tag}</span>`)
                          .join("")}
                      </div>`
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    card.querySelector('[data-action="toggle"]').addEventListener("click", () => {
      if (state.expanded.has(group.id)) {
        state.expanded.delete(group.id);
      } else {
        state.expanded.add(group.id);
      }
      renderGroups();
    });

    card.querySelector('[data-action="generate"]').addEventListener("click", async () => {
      await generateTest(group.id);
    });

    const viewButton = card.querySelector('[data-action="view-test"]');
    if (viewButton) {
      viewButton.addEventListener("click", async () => {
        await openTestModal(group.id);
      });
    }

    elements.groupsContainer.appendChild(card);
  });
}

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "요청 실패");
  }
  return data;
}

async function syncAll(showToastMessage = false) {
  try {
    const [groupsData, conflictData] = await Promise.all([
      fetchJSON("/api/scenarios"),
      fetchJSON("/api/check", { method: "POST" }),
    ]);
    state.groups = groupsData.groups || [];
    state.conflicts = conflictData.conflicts || [];
    state.lastSync = new Date().toISOString();
    renderSummary();
    renderGroups();
    if (showToastMessage) showToast("데이터를 최신 상태로 동기화했습니다.", "success");
  } catch (error) {
    showToast(error.message || "동기화 실패", "error");
  }
}

async function generateTest(groupId) {
  try {
    showToast("테스트 파일을 생성 중입니다...", "info");
    const data = await fetchJSON(`/api/scenarios/${groupId}/generate`, { method: "POST" });
    showToast("테스트 파일이 생성되었습니다.", "success");
    await openTestModal(groupId, data.content, data.fileName);
    await syncAll();
  } catch (error) {
    showToast(error.message || "테스트 생성 실패", "error");
  }
}

async function openTestModal(groupId, content, fileName) {
  try {
    let resolvedContent = content;
    let resolvedName = fileName;
    if (!resolvedContent) {
      const data = await fetchJSON(`/api/tests/${groupId}`);
      resolvedContent = data.content;
      resolvedName = data.fileName;
    }
    elements.testFileName.textContent = resolvedName || "-";
    elements.testContent.textContent = resolvedContent || "내용이 없습니다.";
    elements.testModal.classList.remove("hidden");
    elements.testModal.classList.add("flex");
  } catch (error) {
    showToast(error.message || "테스트 파일을 불러오지 못했습니다.", "error");
  }
}

elements.closeModal.addEventListener("click", () => {
  elements.testModal.classList.add("hidden");
  elements.testModal.classList.remove("flex");
});

elements.testModal.addEventListener("click", (event) => {
  if (event.target === elements.testModal) {
    elements.testModal.classList.add("hidden");
    elements.testModal.classList.remove("flex");
  }
});

elements.addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = elements.inputField.value.trim();
  if (!input) {
    showToast("입력 문장을 작성해 주세요.", "warn");
    return;
  }

  try {
    elements.inputField.value = "";
    showToast("시나리오를 생성 중입니다...", "info");
    const data = await fetchJSON("/api/scenarios/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const conflictCount = data.conflicts?.length || 0;
    showToast(
      conflictCount > 0
        ? `시나리오 저장 완료. 충돌 ${conflictCount}건이 감지되었습니다.`
        : "시나리오가 저장되었습니다.",
      conflictCount > 0 ? "warn" : "success"
    );
    await syncAll();
  } catch (error) {
    showToast(error.message || "시나리오 생성 실패", "error");
  }
});

elements.refreshButton.addEventListener("click", () => {
  syncAll(true);
});

elements.conflictButton.addEventListener("click", async () => {
  try {
    showToast("충돌 분석을 실행 중입니다...", "info");
    const data = await fetchJSON("/api/check", { method: "POST" });
    state.conflicts = data.conflicts || [];
    renderSummary();
    renderGroups();
    showToast("충돌 분석이 완료되었습니다.", "success");
  } catch (error) {
    showToast(error.message || "충돌 분석 실패", "error");
  }
});

syncAll();
setInterval(() => syncAll(), 12000);
