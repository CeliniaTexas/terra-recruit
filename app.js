(function () {
  "use strict";

  const {
    DRAW_SIZE,
    PROFESSIONS,
    OPERATORS_BY_PROFESSION,
    ALL_OPERATORS,
    MAXIMUM_LIMITS,
    drawOperators,
    validateConstraints
  } = window.RecruitEngine;

  const CLASS_META = {
    "先锋": { code: "PIO", glyph: "锋", color: "#d8654d" },
    "近卫": { code: "GUA", glyph: "卫", color: "#5877c8" },
    "重装": { code: "DEF", glyph: "重", color: "#c7a55e" },
    "狙击": { code: "SNI", glyph: "狙", color: "#8a9bc7" },
    "术师": { code: "CAS", glyph: "术", color: "#ad77c6" },
    "医疗": { code: "MED", glyph: "医", color: "#5aaf91" },
    "辅助": { code: "SUP", glyph: "辅", color: "#5da6ae" },
    "特种": { code: "SPE", glyph: "特", color: "#c58955" }
  };

  const state = {
    minimums: Object.fromEntries(PROFESSIONS.map((profession) => [profession, 0])),
    maximums: Object.fromEntries(
      PROFESSIONS.map((profession) => [profession, profession === "医疗" ? 2 : DRAW_SIZE])
    ),
    unique: true,
    lastResults: [],
    drawToken: 0,
    presets: {
      balanced: true,
      "double-medic": false
    }
  };

  const elements = {
    count: document.querySelector("#pool-count"),
    controls: document.querySelector("#profession-controls"),
    conditionTotal: document.querySelector("#condition-total"),
    uniqueToggle: document.querySelector("#unique-toggle"),
    reset: document.querySelector("#reset-conditions"),
    draw: document.querySelector("#draw-button"),
    reroll: document.querySelector("#reroll-button"),
    keepReroll: document.querySelector("#keep-reroll-button"),
    copy: document.querySelector("#copy-button"),
    grid: document.querySelector("#card-grid"),
    summary: document.querySelector("#result-summary"),
    composition: document.querySelector("#composition-items"),
    error: document.querySelector("#error-banner"),
    toast: document.querySelector("#toast"),
    syncDate: document.querySelector("#sync-date"),
    presets: Array.from(document.querySelectorAll("[data-preset]")),
    template: document.querySelector("#operator-card-template")
  };

  function createControl(profession) {
    const meta = CLASS_META[profession];
    const row = document.createElement("div");
    row.className = "profession-control";
    row.style.setProperty("--class-color", meta.color);
    row.dataset.profession = profession;
    row.innerHTML = `
      <span class="profession-label">
        <span class="profession-mark" aria-hidden="true"><span>${meta.glyph}</span></span>
        <span>${profession}</span>
        <span class="profession-available">${OPERATORS_BY_PROFESSION[profession].length}</span>
      </span>
      <span class="stepper">
        <span class="range-field">
          <small>最少</small>
          <span class="stepper-shell">
            <button type="button" data-kind="min" data-action="decrease" aria-label="${profession}下限减一">−</button>
            <output data-output="min" aria-label="${profession}数量下限">0</output>
            <button type="button" data-kind="min" data-action="increase" aria-label="${profession}下限加一">+</button>
          </span>
        </span>
        <span class="range-field">
          <small>最多</small>
          <span class="stepper-shell">
            <button type="button" data-kind="max" data-action="decrease" aria-label="${profession}上限减一">−</button>
            <output data-output="max" aria-label="${profession}数量上限">${state.maximums[profession]}</output>
            <button type="button" data-kind="max" data-action="increase" aria-label="${profession}上限加一">+</button>
          </span>
        </span>
      </span>
    `;
    return row;
  }

  function renderControls() {
    elements.controls.replaceChildren(...PROFESSIONS.map(createControl));
    updateControlState();
  }

  function updateControlState() {
    const total = Object.values(state.minimums).reduce((sum, value) => sum + value, 0);
    const medicalMax = state.maximums["医疗"];
    elements.conditionTotal.textContent =
      `下限 ${total} / ${DRAW_SIZE} · 医疗≤${medicalMax}`;
    elements.conditionTotal.classList.toggle("is-invalid", total > DRAW_SIZE);

    for (const row of elements.controls.querySelectorAll(".profession-control")) {
      const profession = row.dataset.profession;
      const minValue = state.minimums[profession];
      const maxValue = state.maximums[profession];
      const minOutput = row.querySelector('[data-output="min"]');
      const maxOutput = row.querySelector('[data-output="max"]');
      const minDecrease = row.querySelector('[data-kind="min"][data-action="decrease"]');
      const minIncrease = row.querySelector('[data-kind="min"][data-action="increase"]');
      const maxDecrease = row.querySelector('[data-kind="max"][data-action="decrease"]');
      const maxIncrease = row.querySelector('[data-kind="max"][data-action="increase"]');
      const available = state.unique ? OPERATORS_BY_PROFESSION[profession].length : DRAW_SIZE;
      const maxLimit = MAXIMUM_LIMITS[profession] ?? DRAW_SIZE;
      minOutput.value = minValue;
      minOutput.textContent = minValue;
      minOutput.classList.toggle("has-value", minValue > 0);
      maxOutput.value = maxValue;
      maxOutput.textContent = maxValue;
      maxOutput.classList.toggle("is-limited", maxValue < DRAW_SIZE);
      minDecrease.disabled = minValue <= 0;
      minIncrease.disabled =
        minValue >= Math.min(DRAW_SIZE, available, maxLimit) || total >= DRAW_SIZE;
      maxDecrease.disabled = maxValue <= 0;
      maxIncrease.disabled = maxValue >= maxLimit;
    }

    const error = validateConstraints(state.minimums, state.maximums, state.unique);
    showError(error);
    elements.draw.disabled = Boolean(error);
    updatePresetState();
  }

  function updatePresetState() {
    const allOne = PROFESSIONS.every((profession) => state.minimums[profession] === 1);
    const isBalanced = allOne && state.maximums["医疗"] === 2;
    const isDoubleMedic =
      allOne &&
      state.minimums["医疗"] === 2 &&
      state.maximums["医疗"] === 2;

    for (const button of elements.presets) {
      const preset = button.dataset.preset;
      button.classList.toggle(
        "is-active",
        preset === "balanced" ? isBalanced : preset === "double-medic" && isDoubleMedic
      );
    }
  }

  function showError(message) {
    elements.error.textContent = message;
    elements.error.hidden = !message;
  }

  function setConstraint(profession, kind, value) {
    const maxLimit = MAXIMUM_LIMITS[profession] ?? DRAW_SIZE;
    const next = Math.max(0, Math.min(maxLimit, value));
    if (kind === "min") {
      state.minimums[profession] = next;
      state.maximums[profession] = Math.max(state.maximums[profession], next);
    } else {
      state.maximums[profession] = next;
      state.minimums[profession] = Math.min(state.minimums[profession], next);
    }
    updateControlState();
  }

  function applyPreset(preset) {
    state.minimums = Object.fromEntries(PROFESSIONS.map((profession) => [profession, 1]));
    state.maximums = Object.fromEntries(
      PROFESSIONS.map((profession) => [profession, profession === "医疗" ? 2 : DRAW_SIZE])
    );
    if (preset === "double-medic") {
      state.minimums["医疗"] = 2;
    }
    updateControlState();
    showToast(preset === "balanced" ? "已设置：每个职业至少 1 名" : "已设置：全职业齐全，医疗至少 2 名");
  }

  function resetConditions() {
    state.minimums = Object.fromEntries(PROFESSIONS.map((profession) => [profession, 0]));
    state.maximums = Object.fromEntries(
      PROFESSIONS.map((profession) => [profession, profession === "医疗" ? 2 : DRAW_SIZE])
    );
    state.unique = true;
    elements.uniqueToggle.checked = true;
    updateControlState();
    showToast("征募条件已重置");
  }

  function renderIdleCards() {
    elements.grid.classList.add("is-idle");
    elements.grid.replaceChildren();
    for (let index = 0; index < DRAW_SIZE; index += 1) {
      const card = createCard(
        {
          name: "待接入",
          profession: PROFESSIONS[index % PROFESSIONS.length],
          rarity: index % 6
        },
        index,
        false
      );
      card.setAttribute("aria-hidden", "true");
      elements.grid.append(card);
    }
  }

  function createCard(operator, index, reveal) {
    const fragment = elements.template.content.cloneNode(true);
    const card = fragment.querySelector(".operator-card");
    const meta = CLASS_META[operator.profession];
    const starCount = operator.rarity + 1;
    card.style.setProperty("--class-color", meta.color);
    card.style.setProperty("--order", index);
    card.dataset.cardIndex = index;
    card.classList.add(`is-rarity-${operator.rarity}`);
    card.classList.toggle("is-revealed", reveal);

    const lockButton = card.querySelector(".card-lock");
    const isLocked = Boolean(operator.isLocked);
    lockButton.hidden = !reveal;
    lockButton.dataset.index = index;
    lockButton.setAttribute("aria-pressed", String(isLocked));
    lockButton.setAttribute(
      "aria-label",
      `${isLocked ? "取消保留" : "保留"}${operator.name}`
    );
    lockButton.querySelector("span").textContent = isLocked ? "已保留" : "保留";
    card.classList.toggle("is-locked", isLocked);
    card.querySelector(".card-index").textContent = `SLOT ${String(index + 1).padStart(2, "0")}`;
    card.querySelector(".card-rarity").textContent = "◆".repeat(starCount);
    card.querySelector(".card-profession-glyph").textContent = meta.glyph;
    card.querySelector(".card-profession").textContent = `${meta.code} / ${operator.profession}`;
    card.querySelector(".card-name").textContent = operator.name;
    card.querySelector(".card-code").textContent =
      `RI-${String(index + 1).padStart(2, "0")} · ${starCount} STAR`;
    return card;
  }

  function renderResults(results, token) {
    state.lastResults = results;
    elements.grid.classList.remove("is-idle");
    elements.grid.replaceChildren(...results.map((operator, index) => createCard(operator, index, true)));

    const composition = Object.fromEntries(PROFESSIONS.map((profession) => [profession, 0]));
    for (const operator of results) {
      composition[operator.profession] += 1;
    }
    elements.composition.replaceChildren(
      ...PROFESSIONS.filter((profession) => composition[profession] > 0).map((profession) => {
        const chip = document.createElement("span");
        chip.className = "composition-chip";
        chip.style.setProperty("--class-color", CLASS_META[profession].color);
        chip.innerHTML = `<strong>${composition[profession]}</strong>${profession}`;
        return chip;
      })
    );

    const highRarity = results.filter((operator) => operator.rarity === 5).length;
    elements.summary.textContent = `抽卡 #${String(token).padStart(3, "0")} · ${highRarity} 名六星`;
    elements.copy.disabled = false;
    elements.reroll.disabled = false;
    updateLockControls();
  }

  function updateLockControls() {
    const lockedCount = state.lastResults.filter((operator) => operator.isLocked).length;
    elements.keepReroll.disabled = lockedCount === 0;

    if (lockedCount === DRAW_SIZE) {
      elements.keepReroll.textContent = "已保留全部 12 名";
    } else if (lockedCount === 0) {
      elements.keepReroll.textContent = "保留所选 · 重抽其余";
    } else {
      elements.keepReroll.textContent =
        `保留 ${lockedCount} 名 · 重抽其余 ${DRAW_SIZE - lockedCount} 名`;
    }
  }

  function toggleLock(index) {
    const operator = state.lastResults[index];
    if (!operator) {
      return;
    }

    operator.isLocked = !operator.isLocked;
    const card = elements.grid.querySelector(`[data-card-index="${index}"]`);
    const lockButton = card?.querySelector(".card-lock");
    if (card && lockButton) {
      card.classList.toggle("is-locked", operator.isLocked);
      lockButton.setAttribute("aria-pressed", String(operator.isLocked));
      lockButton.setAttribute(
        "aria-label",
        `${operator.isLocked ? "取消保留" : "保留"}${operator.name}`
      );
      lockButton.querySelector("span").textContent = operator.isLocked ? "已保留" : "保留";
    }
    updateLockControls();
  }

  function draw() {
    const error = validateConstraints(state.minimums, state.maximums, state.unique);
    if (error) {
      showError(error);
      return;
    }

    showError("");
    state.drawToken += 1;
    state.lastResults = drawOperators(state.minimums, state.maximums, state.unique);
    elements.draw.disabled = true;
    elements.keepReroll.disabled = true;
    elements.draw.classList.add("is-drawing");
    elements.summary.textContent = "正在读取档案…";

    window.setTimeout(() => {
      renderResults(state.lastResults, state.drawToken);
      elements.draw.classList.remove("is-drawing");
      elements.draw.disabled = false;
    }, 260);
  }

  function rerollUnlocked() {
    const locked = state.lastResults.filter((operator) => operator.isLocked);
    if (locked.length === 0) {
      showToast("请先点击卡片右上角“保留”");
      return;
    }

    const error = validateConstraints(
      state.minimums,
      state.maximums,
      state.unique,
      locked
    );
    if (error) {
      showError(error);
      return;
    }

    showError("");
    state.drawToken += 1;
    try {
      const results = drawOperators(
        state.minimums,
        state.maximums,
        state.unique,
        DRAW_SIZE,
        locked
      );
      renderResults(results, state.drawToken);
      showToast(`已保留 ${locked.length} 名，其余位置完成重抽`);
    } catch (drawError) {
      showError(drawError.message);
    }
  }

  function resultText() {
    const header = [
      "【泰拉征募】十二人小队",
      `抽取编号 #${String(state.drawToken).padStart(3, "0")} · ${window.OPERATOR_DATA.syncedAt}`,
      ""
    ];
    const rows = state.lastResults.map((operator, index) =>
      `${String(index + 1).padStart(2, "0")}. ${operator.name} / ${operator.profession} / ${
        operator.rarity + 1
      }★${operator.isLocked ? " [保留]" : ""}`
    );
    const rules = PROFESSIONS
      .flatMap((profession) => {
        const rules = [];
        if (state.minimums[profession] > 0) {
          rules.push(`${profession}≥${state.minimums[profession]}`);
        }
        if (state.maximums[profession] < DRAW_SIZE) {
          rules.push(`${profession}≤${state.maximums[profession]}`);
        }
        return rules;
      });
    return [...header, ...rows, "", `限制：${rules.length ? rules.join("，") : "无"}`, `重复：${state.unique ? "否" : "允许"}`].join("\n");
  }

  async function copyResults() {
    const text = resultText();
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("本次十二人名单已复制");
  }

  let toastTimer = 0;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
  }

  function initialize() {
    elements.count.textContent = `${ALL_OPERATORS.length} 名干员`;
    elements.syncDate.textContent = window.OPERATOR_DATA.syncedAt.replaceAll("-", ".");
    renderControls();
    renderIdleCards();

    elements.controls.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }
      const profession = button.closest(".profession-control").dataset.profession;
      const delta = button.dataset.action === "increase" ? 1 : -1;
      const kind = button.dataset.kind;
      const current = kind === "min" ? state.minimums[profession] : state.maximums[profession];
      setConstraint(profession, kind, current + delta);
    });

    elements.uniqueToggle.addEventListener("change", (event) => {
      state.unique = event.target.checked;
      updateControlState();
    });

    elements.presets.forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });

    elements.reset.addEventListener("click", resetConditions);
    elements.draw.addEventListener("click", draw);
    elements.reroll.addEventListener("click", draw);
    elements.keepReroll.addEventListener("click", rerollUnlocked);
    elements.copy.addEventListener("click", copyResults);
    elements.grid.addEventListener("click", (event) => {
      const lockButton = event.target.closest(".card-lock");
      if (!lockButton || lockButton.hidden) {
        return;
      }
      event.stopPropagation();
      toggleLock(Number(lockButton.dataset.index));
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isTyping = target.matches("input, textarea, select") || target.isContentEditable;
      if (!isTyping && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (!elements.draw.disabled) {
          draw();
        }
      }
    });

    const supportsOfflineCache =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if ("serviceWorker" in navigator && supportsOfflineCache) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
          // The app still works without offline caching.
        });
      });
    }

  }

  initialize();
})();
