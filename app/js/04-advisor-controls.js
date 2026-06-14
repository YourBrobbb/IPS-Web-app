// Rendering coordinator, action controls, strategy advisor and object selectors. Source: script.js lines 946-1831.
function renderAll() {
  renderMetrics();
  renderActionControls();
  renderCityScene();
  renderProperties();
  renderLatestEvent();
  renderEventHistory();
  renderSummary();
  renderTimelineTable();
  renderCharts();
  updateStartScreen();
}

function renderMetrics() {
  elements.metricQuarter.textContent = state.gameOver ? `${Math.min(state.quarter, MAX_QUARTERS)}/${MAX_QUARTERS}` : `${state.quarter}/${MAX_QUARTERS}`;
  elements.metricMoney.textContent = formatMoney(state.money);
  elements.metricReputation.textContent = `${state.reputation}/100`;
  elements.metricDemand.textContent = `${state.demand}/100`;
  elements.metricInterest.textContent = `${state.interestRate}%`;
  elements.metricProfit.textContent = formatMoney(state.totalProfit);
}

function renderActionControls() {
  const activeProperties = getActiveProperties();
  const gameLocked = state.gameOver;

  populatePropertySelect(elements.upgradeSelect, activeProperties, "Нет объектов для улучшения");
  populatePropertySelect(elements.sellSelect, activeProperties, "Нет объектов для продажи");
  syncSellSelectWithVisibleObject();

  elements.buildHousingButton.disabled = gameLocked;
  elements.buildOfficeButton.disabled = gameLocked;
  elements.buildRetailButton.disabled = gameLocked;
  elements.buildHousingButton.classList.toggle("is-selected", pendingBuildType === "housing");
  elements.buildOfficeButton.classList.toggle("is-selected", pendingBuildType === "office");
  elements.buildRetailButton.classList.toggle("is-selected", pendingBuildType === "retail");
  elements.loanButton.disabled = gameLocked || state.loan.active;
  elements.skipTurnButton.disabled = gameLocked;
  elements.upgradeButton.disabled = gameLocked || activeProperties.length === 0;
  elements.sellButton.disabled = gameLocked || activeProperties.length === 0;

  renderActionRecommendation(activeProperties, gameLocked);
  renderStrategicAdvisor(activeProperties, gameLocked);
  renderControlSummaries(activeProperties);
  renderLoanStatus();
}

function syncSellSelectWithVisibleObject() {
  if (!elements.upgradeSelect || !elements.sellSelect || elements.sellSelect.disabled) {
    return;
  }

  elements.sellSelect.value = elements.upgradeSelect.value;
}

function renderActionRecommendation(activeProperties, gameLocked) {
  if (!elements.nextActionCard) {
    return;
  }

  const recommendation = getActionRecommendation(activeProperties, gameLocked);
  elements.nextActionCard.innerHTML = `
    <span>${recommendation.label}</span>
    <strong>${recommendation.title}</strong>
    <p>${recommendation.reason}</p>
  `;
}

function getActionRecommendation(activeProperties, gameLocked) {
  const advice = getStrategicAdvice(activeProperties, gameLocked);

  return {
    label: advice.badge,
    title: advice.title,
    reason: advice.reason
  };
}

function renderStrategicAdvisor(activeProperties, gameLocked) {
  if (!elements.advisorPanel) {
    return;
  }

  const advisorEnabled = state.ui.advisorEnabled !== false;
  const advice = getStrategicAdvice(activeProperties, gameLocked);
  elements.advisorPanel.className = `advisor-panel advisor-panel--${advisorEnabled ? advice.tone : "muted"}`;

  if (!advisorEnabled) {
    elements.advisorPanel.innerHTML = `
      <div class="advisor-panel__top">
        <label class="advisor-toggle">
          <input type="checkbox" data-advisor-toggle>
          <span>Режим подсказок</span>
        </label>
        <span class="advisor-pill">выключен</span>
      </div>
      <p class="advisor-muted-text">Включите советника, чтобы получать конкретный план на каждый квартал.</p>
    `;
    return;
  }

  const actionButton = advice.actionKey
    ? `<button class="button button--primary button--full advisor-apply-button" data-advisor-action="apply">${escapeHtml(advice.buttonLabel)}</button>`
    : `<button class="button button--secondary button--full advisor-apply-button" disabled>Нет доступного действия</button>`;
  const warnings = advice.warnings.length
    ? `<div class="advisor-warnings">${advice.warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("")}</div>`
    : "";
  const alternatives = advice.alternatives.length
    ? `<div class="advisor-alternatives"><strong>Если не хотите так:</strong><span>${advice.alternatives.map(escapeHtml).join(" · ")}</span></div>`
    : "";

  elements.advisorPanel.innerHTML = `
    <div class="advisor-panel__top">
      <label class="advisor-toggle">
        <input type="checkbox" data-advisor-toggle checked>
        <span>Режим подсказок</span>
      </label>
      <span class="advisor-pill">${advice.actionsLeft} ход. осталось</span>
    </div>

    <div class="advisor-main-card">
      <span class="advisor-badge">${escapeHtml(advice.badge)}</span>
      <h4>${escapeHtml(advice.title)}</h4>
      <p>${escapeHtml(advice.reason)}</p>
      ${actionButton}
    </div>

    <div class="advisor-event-note">
      <strong>Как реагировать на событие</strong>
      <p>${escapeHtml(advice.eventAdvice)}</p>
    </div>

    <div class="advisor-checklist">
      ${advice.checklist.map((item) => `
        <div class="advisor-check ${item.met ? "advisor-check--done" : ""}">
          <span>${item.met ? "✓" : "!"}</span>
          <p>${escapeHtml(item.label)}</p>
        </div>
      `).join("")}
    </div>
    ${warnings}
    ${alternatives}
  `;
}

function handleAdvisorPanelClick(event) {
  const toggle = event.target.closest("[data-advisor-toggle]");
  if (toggle) {
    state.ui.advisorEnabled = toggle.checked;
    saveGame(true);
    renderActionControls();
    return;
  }

  const applyButton = event.target.closest("[data-advisor-action='apply']");
  if (applyButton && !applyButton.disabled) {
    performRecommendedAction();
  }
}

function performRecommendedAction() {
  const advice = getStrategicAdvice(getActiveProperties(), state.gameOver);

  if (!advice.actionKey) {
    showToast("Советник не нашёл безопасного действия на этот квартал.", "warning");
    return;
  }

  if (advice.targetPropertyId && elements.upgradeSelect) {
    elements.upgradeSelect.value = String(advice.targetPropertyId);
    syncSellSelectWithVisibleObject();
  }

  const handlers = {
    "build-housing": () => beginBuildingPlacement("housing", { suggestedPlotId: getBestPlotForType("housing")?.plotId }),
    "build-office": () => beginBuildingPlacement("office", { suggestedPlotId: getBestPlotForType("office")?.plotId }),
    "build-retail": () => beginBuildingPlacement("retail", { suggestedPlotId: getBestPlotForType("retail")?.plotId }),
    "upgrade": () => upgradeProperty(advice.targetPropertyId),
    "sell": () => sellProperty(advice.targetPropertyId),
    "loan": takeLoan,
    "skip": skipTurn
  };
  const handler = handlers[advice.actionKey];

  if (!handler) {
    showToast("Для этого совета нет обработчика действия.", "danger");
    return;
  }

  if (advice.actionKey.startsWith("build-")) {
    handler();
    return;
  }

  performAction(handler);
}

function getStrategicAdvice(activeProperties, gameLocked) {
  const actionsLeft = Math.max(0, MAX_QUARTERS - state.quarter + 1);
  const victoryStatus = getVictoryStatus();
  const upgradeCount = getUpgradeCount();
  const improvedActivePropertyCount = getImprovedActivePropertyCount();
  const typeDiversity = getPortfolioTypeDiversity(activeProperties);
  const expectedNetIncome = getExpectedPortfolioNetIncome(activeProperties);
  const bestBuild = getBestBuildOption(activeProperties);
  const bestUpgradeTarget = getBestUpgradeTarget(activeProperties, improvedActivePropertyCount < STRATEGIC_IMPROVED_ACTIVE_PROPERTIES);
  const sellCandidate = getSellCandidate(activeProperties);
  const canTakeVictoryLoan = !state.loan.active && actionsLeft >= LOAN_TERM;
  const missingActiveProperties = Math.max(0, VICTORY_ACTIVE_PROPERTIES - activeProperties.length);
  const missingImprovedActiveProperties = Math.max(0, VICTORY_IMPROVED_ACTIVE_PROPERTIES - improvedActivePropertyCount);
  const profitNeed = Math.max(0, VICTORY_TOTAL_PROFIT - state.totalProfit);
  const profitPaceIsEnough = !profitNeed || (expectedNetIncome > 0 && expectedNetIncome * actionsLeft >= profitNeed * 1.08);
  const moneyBufferTarget = VICTORY_MONEY + 60000;
  const warnings = getAdvisorWarnings(activeProperties, expectedNetIncome, actionsLeft);
  const checklist = victoryStatus.requirements;
  const eventAdvice = getEventResponseAdvice(bestUpgradeTarget, bestBuild);

  if (gameLocked) {
    return {
      badge: "Игра завершена",
      title: "Посмотрите итог",
      reason: "Советник отключает действия после финального результата.",
      buttonLabel: "Игра завершена",
      actionKey: null,
      targetPropertyId: null,
      tone: "muted",
      actionsLeft,
      checklist,
      warnings,
      alternatives: [],
      eventAdvice
    };
  }

  if (!activeProperties.length) {
    if (state.money >= PROPERTY_TYPES.housing.baseCost) {
      return createAdvice({
        badge: "Старт портфеля",
        title: "Построить жильё",
        reason: "Без активных объектов не будет прибыли, прогресса по портфелю и денежного эффекта от событий. Жильё дешевле всего и быстрее запускает денежный поток.",
        actionKey: "build-housing",
        buttonLabel: "Выполнить: построить жильё",
        tone: "success",
        actionsLeft,
        checklist,
        warnings,
        alternatives: ["Офис даст больше дохода, если хотите рискнуть большим стартовым вложением"],
        eventAdvice
      });
    }

    if (canTakeVictoryLoan) {
      return createAdvice({
        badge: "Нет актива",
        title: "Взять кредит",
        reason: "Денег не хватает даже на первый объект. Кредит имеет смысл только сейчас, пока до 20 квартала достаточно времени, чтобы его погасить.",
        actionKey: "loan",
        buttonLabel: "Выполнить: взять кредит",
        tone: "warning",
        actionsLeft,
        checklist,
        warnings,
        alternatives: ["Если не хотите кредит, останется пропускать ход, но это почти точно сорвёт победу"],
        eventAdvice
      });
    }
  }

  if (state.loan.active && state.loan.remainingPayments > actionsLeft) {
    return createAdvice({
      badge: "Кредитный риск",
      title: expectedNetIncome > 0 ? "Пропустить ход" : "Снизить расходы",
      reason: "Активный кредит не успеет закрыться до финала, поэтому победа уже под угрозой. Сейчас лучше не наращивать риск и дать объектам принести доход.",
      actionKey: expectedNetIncome > 0 ? "skip" : null,
      buttonLabel: "Выполнить: пропустить ход",
      tone: "danger",
      actionsLeft,
      checklist,
      warnings,
      alternatives: ["Продажа поможет ликвидности, но не закрывает кредит досрочно в текущей модели"],
      eventAdvice
    });
  }

  if (activeProperties.length > VICTORY_ACTIVE_PROPERTIES && state.money < UPGRADE_COST && improvedActivePropertyCount < VICTORY_IMPROVED_ACTIVE_PROPERTIES && sellCandidate) {
    return createAdvice({
      badge: "Нужны улучшения",
      title: `Продать ${sellCandidate.name}`,
      reason: "У вас больше объектов, чем требуется для победы, спрос высокий, а объект уже удерживался достаточно долго. Продажа слабого лишнего объекта может профинансировать обязательные улучшения.",
      actionKey: "sell",
      targetPropertyId: sellCandidate.id,
      buttonLabel: `Выполнить: продать ${sellCandidate.name}`,
      tone: "warning",
      actionsLeft,
      checklist,
      warnings,
      alternatives: ["Если кварталов достаточно, можно пропустить ход и накопить прибыль без продажи"],
      eventAdvice
    });
  }

  if (activeProperties.length < VICTORY_ACTIVE_PROPERTIES) {
    if (bestBuild) {
      return createAdvice({
        badge: "Закрыть цель по объектам",
        title: bestBuild.title,
        reason: `Для победы нужно минимум ${VICTORY_ACTIVE_PROPERTIES} активных объекта. Сейчас их ${activeProperties.length}, поэтому приоритет — расширить портфель, а не продавать или ждать.`,
        actionKey: bestBuild.actionKey,
        buttonLabel: `Выполнить: ${bestBuild.buttonLabel}`,
        tone: "success",
        actionsLeft,
        checklist,
        warnings,
        alternatives: getBuildAlternatives(bestBuild),
        eventAdvice
      });
    }

    if (canTakeVictoryLoan) {
      return createAdvice({
        badge: "Капитала мало",
        title: "Взять кредит",
        reason: "Без нового капитала вы не успеете собрать 4 активных объекта. Кредит оправдан, потому что до конца игры ещё достаточно платежей для полного погашения.",
        actionKey: "loan",
        buttonLabel: "Выполнить: взять кредит",
        tone: "warning",
        actionsLeft,
        checklist,
        warnings,
        alternatives: ["Если кредит уже кажется рискованным, пропустите ход и дождитесь дохода портфеля"],
        eventAdvice
      });
    }
  }

  if ((state.reputation < VICTORY_REPUTATION || improvedActivePropertyCount < VICTORY_IMPROVED_ACTIVE_PROPERTIES) && bestUpgradeTarget && state.money >= UPGRADE_COST) {
    return createAdvice({
      badge: state.reputation < VICTORY_REPUTATION ? "Восстановить доверие" : "Развить разные объекты",
      title: `Улучшить ${bestUpgradeTarget.name}`,
      reason: `Победа требует минимум ${VICTORY_IMPROVED_ACTIVE_PROPERTIES} улучшенных активных объекта. Советник выбирает объект так, чтобы не вкладывать все улучшения только в одно здание.`,
      actionKey: "upgrade",
      targetPropertyId: bestUpgradeTarget.id,
      buttonLabel: `Выполнить: улучшить ${bestUpgradeTarget.name}`,
      tone: "success",
      actionsLeft,
      checklist,
      warnings,
      alternatives: ["Если денег мало, сначала дождитесь дохода или возьмите кредит только при достаточном времени до финала"],
      eventAdvice
    });
  }

  if (state.reputation < STRATEGIC_REPUTATION_BUFFER && bestUpgradeTarget && state.money >= UPGRADE_COST && actionsLeft <= 5) {
    return createAdvice({
      badge: "Финальный буфер",
      title: `Улучшить ${bestUpgradeTarget.name}`,
      reason: `До финала мало времени. Репутация формально может быть достаточной, но событие способно снять несколько пунктов, поэтому нужен запас около ${STRATEGIC_REPUTATION_BUFFER}/100.`,
      actionKey: "upgrade",
      targetPropertyId: bestUpgradeTarget.id,
      buttonLabel: `Выполнить: улучшить ${bestUpgradeTarget.name}`,
      tone: "warning",
      actionsLeft,
      checklist,
      warnings,
      alternatives: ["Если денег мало, лучше не продавать обязательные 4 объекта, а дождаться дохода"],
      eventAdvice
    });
  }

  if (state.money < UPGRADE_COST && !state.loan.active && state.reputation < VICTORY_REPUTATION && canTakeVictoryLoan) {
    return createAdvice({
      badge: "Нужна ликвидность",
      title: "Взять кредит",
      reason: "Репутация ниже цели, а денег не хватает на улучшение. Кредит можно брать только если до финала достаточно времени для погашения.",
      actionKey: "loan",
      buttonLabel: "Выполнить: взять кредит",
      tone: "warning",
      actionsLeft,
      checklist,
      warnings,
      alternatives: ["Без кредита можно пропустить ход и накопить доход, но темп будет ниже"],
      eventAdvice
    });
  }

  if (
    activeProperties.length < STRATEGIC_ACTIVE_PROPERTIES &&
    actionsLeft > 5 &&
    bestBuild &&
    state.money - bestBuild.cost >= STRATEGIC_CASH_RESERVE
  ) {
    return createAdvice({
      badge: "Рост сверх минимума",
      title: bestBuild.title,
      reason: `Минимум для победы — ${VICTORY_ACTIVE_PROPERTIES} объекта, но пятый актив повышает доход и создаёт запас на случай плохих событий. Денежный резерв после покупки остаётся безопасным.`,
      actionKey: bestBuild.actionKey,
      buttonLabel: `Выполнить: ${bestBuild.buttonLabel}`,
      tone: "success",
      actionsLeft,
      checklist,
      warnings,
      alternatives: bestUpgradeTarget && state.money >= UPGRADE_COST ? [`Улучшить ${bestUpgradeTarget.name}, если хотите развивать качество вместо масштаба`] : [],
      eventAdvice
    });
  }

  if (
    typeDiversity < 3 &&
    actionsLeft > 4 &&
    bestBuild &&
    state.money - bestBuild.cost >= STRATEGIC_CASH_RESERVE
  ) {
    return createAdvice({
      badge: "Диверсификация",
      title: bestBuild.title,
      reason: "Портфель устойчивее, когда в нём есть разные типы недвижимости. Это не обязательное условие победы, но снижает зависимость от одного сегмента.",
      actionKey: bestBuild.actionKey,
      buttonLabel: `Выполнить: ${bestBuild.buttonLabel}`,
      tone: "success",
      actionsLeft,
      checklist,
      warnings,
      alternatives: [],
      eventAdvice
    });
  }

  if (
    improvedActivePropertyCount < STRATEGIC_IMPROVED_ACTIVE_PROPERTIES &&
    bestUpgradeTarget &&
    state.money - UPGRADE_COST >= STRATEGIC_CASH_RESERVE &&
    actionsLeft > 4
  ) {
    return createAdvice({
      badge: "Качество портфеля",
      title: `Улучшить ${bestUpgradeTarget.name}`,
      reason: `Минимальные улучшения уже могут быть закрыты, но ${STRATEGIC_IMPROVED_ACTIVE_PROPERTIES} развитых объекта дают лучший доход и репутационный запас. Это делает игру менее зависимой от случайных событий.`,
      actionKey: "upgrade",
      targetPropertyId: bestUpgradeTarget.id,
      buttonLabel: `Выполнить: улучшить ${bestUpgradeTarget.name}`,
      tone: "success",
      actionsLeft,
      checklist,
      warnings,
      alternatives: bestBuild && state.money - bestBuild.cost >= STRATEGIC_CASH_RESERVE ? [bestBuild.title] : [],
      eventAdvice
    });
  }

  if (profitNeed > 0 && !profitPaceIsEnough) {
    if (bestBuild && activeProperties.length < CITY_PLOTS.length && state.money - bestBuild.cost > 120000) {
      return createAdvice({
        badge: "Нарастить прибыль",
        title: bestBuild.title,
        reason: `Суммарной прибыли не хватает: осталось добрать ${formatMoney(profitNeed)}. Текущий темп портфеля недостаточен, поэтому нужен новый источник дохода.`,
        actionKey: bestBuild.actionKey,
        buttonLabel: `Выполнить: ${bestBuild.buttonLabel}`,
        tone: "success",
        actionsLeft,
        checklist,
        warnings,
        alternatives: bestUpgradeTarget && state.money >= UPGRADE_COST ? [`Улучшить ${bestUpgradeTarget.name}, если хотите меньше расширяться`] : [],
        eventAdvice
      });
    }

    if (bestUpgradeTarget && state.money >= UPGRADE_COST) {
      return createAdvice({
        badge: "Усилить доход",
        title: `Улучшить ${bestUpgradeTarget.name}`,
        reason: `До цели по суммарной прибыли ещё ${formatMoney(profitNeed)}. Улучшение повышает доход уже существующего актива без потери активных объектов.`,
        actionKey: "upgrade",
        targetPropertyId: bestUpgradeTarget.id,
        buttonLabel: `Выполнить: улучшить ${bestUpgradeTarget.name}`,
        tone: "success",
        actionsLeft,
        checklist,
        warnings,
        alternatives: bestBuild ? [bestBuild.title] : [],
        eventAdvice
      });
    }
  }

  if (
    sellCandidate &&
    state.money < moneyBufferTarget &&
    state.money + sellCandidate.salePrice > moneyBufferTarget &&
    activeProperties.length > VICTORY_ACTIVE_PROPERTIES &&
    missingActiveProperties === 0 &&
    missingImprovedActiveProperties === 0 &&
    profitPaceIsEnough
  ) {
    return createAdvice({
      badge: "Финальная фиксация",
      title: `Продать ${sellCandidate.name}`,
      reason: "Структурные цели уже закрыты, есть лишний объект, спрос высокий, а продажа даст денежный буфер выше 2 млн. Это редкий случай, когда продажа логична.",
      actionKey: "sell",
      targetPropertyId: sellCandidate.id,
      buttonLabel: `Выполнить: продать ${sellCandidate.name}`,
      tone: "warning",
      actionsLeft,
      checklist,
      warnings,
      alternatives: expectedNetIncome > 0 ? ["Можно не продавать и дождаться дохода, если до финала хватает кварталов"] : [],
      eventAdvice
    });
  }

  if (
    activeProperties.length < STRATEGIC_MAX_ACTIVE_PROPERTIES &&
    actionsLeft > 4 &&
    bestBuild &&
    state.money - bestBuild.cost >= STRATEGIC_CASH_RESERVE + 80000 &&
    profitPaceIsEnough
  ) {
    return createAdvice({
      badge: "Инвестировать прибыль",
      title: bestBuild.title,
      reason: `Минимум уже близко или закрыт, но свободный капитал лучше превратить в новый доходный актив. ${STRATEGIC_MAX_ACTIVE_PROPERTIES}-й объект увеличит прибыль и сделает финал менее зависимым от случайных событий.`,
      actionKey: bestBuild.actionKey,
      buttonLabel: `Выполнить: ${bestBuild.buttonLabel}`,
      tone: "success",
      actionsLeft,
      checklist,
      warnings,
      alternatives: bestUpgradeTarget && state.money - UPGRADE_COST >= STRATEGIC_CASH_RESERVE ? [`Улучшить ${bestUpgradeTarget.name}`] : [],
      eventAdvice
    });
  }

  if (
    upgradeCount < STRATEGIC_MAX_UPGRADES &&
    bestUpgradeTarget &&
    state.money - UPGRADE_COST >= STRATEGIC_CASH_RESERVE &&
    actionsLeft > 3 &&
    expectedNetIncome > 0
  ) {
    return createAdvice({
      badge: "Реинвестировать доход",
      title: `Улучшить ${bestUpgradeTarget.name}`,
      reason: `Просто ждать уже не лучший ход: у портфеля есть денежный поток и запас денег. Улучшение повышает доходность, репутацию и создаёт буфер к финалу.`,
      actionKey: "upgrade",
      targetPropertyId: bestUpgradeTarget.id,
      buttonLabel: `Выполнить: улучшить ${bestUpgradeTarget.name}`,
      tone: "success",
      actionsLeft,
      checklist,
      warnings,
      alternatives: bestBuild && state.money - bestBuild.cost >= STRATEGIC_CASH_RESERVE ? [bestBuild.title] : [],
      eventAdvice
    });
  }

  if (state.money < VICTORY_MONEY) {
    if (expectedNetIncome > 0) {
      return createAdvice({
        badge: "Добрать капитал",
        title: "Пропустить ход",
        reason: "Основные структурные условия почти закрыты. Сейчас безопаснее дать портфелю заработать, чем продавать активы или брать лишний кредит.",
        actionKey: "skip",
        buttonLabel: "Выполнить: пропустить ход",
        tone: "info",
        actionsLeft,
        checklist,
        warnings,
        alternatives: bestBuild && state.money - bestBuild.cost > 180000 ? [bestBuild.title] : [],
        eventAdvice
      });
    }
  }

  if (state.money < moneyBufferTarget && actionsLeft <= 2 && expectedNetIncome > 0) {
    return createAdvice({
      badge: "Защитить финал",
      title: "Пропустить ход",
      reason: "Перед финалом лучше держать деньги выше 2 060 000, потому что случайное событие может снять до 60 000. Положительный денежный поток безопаснее продажи обязательных активов.",
      actionKey: "skip",
      buttonLabel: "Выполнить: пропустить ход",
      tone: "info",
      actionsLeft,
      checklist,
      warnings,
      alternatives: sellCandidate ? [`Продать ${sellCandidate.name}, если срочно нужен денежный буфер`] : [],
      eventAdvice
    });
  }

  if (state.loan.active) {
    return createAdvice({
      badge: "Финиш без долга",
      title: "Пропустить ход",
      reason: "Для победы нужен закрытый кредит. Продолжайте получать доход и дождитесь автоматического погашения платежей.",
      actionKey: "skip",
      buttonLabel: "Выполнить: пропустить ход",
      tone: "info",
      actionsLeft,
      checklist,
      warnings,
      alternatives: bestUpgradeTarget && state.money >= UPGRADE_COST ? [`Улучшить ${bestUpgradeTarget.name}, если после платежа останется запас`] : [],
      eventAdvice
    });
  }

  return createAdvice({
    badge: victoryStatus.isVictory ? "Позиция победы" : "Стабилизация",
    title: "Пропустить ход",
    reason: victoryStatus.isVictory
      ? "Условия победы уже выполнены. Сохраняйте портфель активным и не берите новый кредит до финала."
      : "Сильного действия сейчас нет: продажа ухудшит портфель, кредит может не успеть погаситься, а доход объектов работает в вашу пользу.",
    actionKey: "skip",
    buttonLabel: "Выполнить: пропустить ход",
    tone: victoryStatus.isVictory ? "success" : "info",
    actionsLeft,
    checklist,
    warnings,
    alternatives: [],
    eventAdvice
  });
}

function createAdvice(config) {
  return {
    badge: config.badge,
    title: config.title,
    reason: config.reason,
    actionKey: config.actionKey || null,
    targetPropertyId: config.targetPropertyId || null,
    buttonLabel: config.buttonLabel || "Выполнить совет",
    tone: config.tone || "info",
    actionsLeft: config.actionsLeft,
    checklist: config.checklist || [],
    warnings: config.warnings || [],
    alternatives: config.alternatives || [],
    eventAdvice: config.eventAdvice || "Событий пока нет: ориентируйтесь на цели победы и денежный поток."
  };
}

function getExpectedPortfolioNetIncome(activeProperties) {
  return activeProperties.reduce((sum, property) => sum + Math.round(calculateNetIncome(property)), 0);
}

function getBestBuildOption(activeProperties) {
  const existingTypes = new Set(activeProperties.map(getPropertyTypeKey));
  const options = Object.values(PROPERTY_TYPES)
    .filter((config) => state.money >= config.baseCost)
    .map((config) => {
      const bestPlot = getBestPlotForType(config.key);
      if (!bestPlot) {
        return null;
      }

      const projectedNetIncome = Math.round(calculateProjectedNetIncome(config, 1, bestPlot.evaluation));
      const demandBonus = state.demand >= 70 && config.key === "office" ? 14 : 0;
      const lowRiskBonus = state.demand < 45 && config.key === "housing" ? 10 : 0;
      const diversificationBonus = existingTypes.has(config.key) ? 0 : 18;
      const locationBonus = (bestPlot.evaluation.demandScore - 55) * 0.45;
      const score = (projectedNetIncome / config.baseCost) * 100 + demandBonus + lowRiskBonus + diversificationBonus + locationBonus;

      return {
        key: config.key,
        actionKey: `build-${config.key}`,
        title: `Построить ${config.type.toLowerCase()} в районе «${bestPlot.plot.name}»`,
        buttonLabel: `выбрать участок для ${config.type.toLowerCase()}`,
        cost: config.baseCost,
        projectedNetIncome,
        plotId: bestPlot.plotId,
        plotName: bestPlot.plot.name,
        score
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  return options[0] || null;
}

function getBuildAlternatives(bestBuild) {
  return Object.values(PROPERTY_TYPES)
    .filter((config) => config.key !== bestBuild.key && state.money >= config.baseCost)
    .map((config) => {
      const bestPlot = getBestPlotForType(config.key);
      return bestPlot
        ? `Построить ${config.type.toLowerCase()} в районе «${bestPlot.plot.name}», если хотите другой профиль риска`
        : null;
    })
    .filter(Boolean);
}

function calculateProjectedNetIncome(config, level, plotEvaluation = null) {
  const levelMultiplier = 1 + (level - 1) * 0.15;
  const incomeMultiplier = plotEvaluation ? plotEvaluation.incomeMultiplier : 1;
  const expenseMultiplier = plotEvaluation ? plotEvaluation.expenseMultiplier : 1;
  const income = config.baseIncome *
    (0.5 + state.demand / 200) *
    (0.7 + state.reputation / 200) *
    levelMultiplier *
    incomeMultiplier;
  const expense = config.baseExpense * (1 + state.interestRate / 1000) * expenseMultiplier;

  return income - expense;
}

function getBestUpgradeTarget(activeProperties, preferNewImprovedObject = false) {
  return [...activeProperties]
    .map((property) => {
      const currentNetIncome = calculateNetIncome(property);
      const upgradedProperty = { ...property, level: property.level + 1 };
      const upgradedNetIncome = calculateNetIncome(upgradedProperty);

      return {
        ...property,
        upgradeGain: Math.round(upgradedNetIncome - currentNetIncome)
      };
    })
    .sort((left, right) => {
      if (preferNewImprovedObject && left.level !== right.level) {
        return left.level - right.level;
      }

      return right.upgradeGain - left.upgradeGain || left.level - right.level;
    })[0] || null;
}

function getSellCandidate(activeProperties) {
  if (activeProperties.length <= VICTORY_ACTIVE_PROPERTIES) {
    return null;
  }

  return [...activeProperties]
    .filter((property) => state.quarter - property.createdAtQuarter >= FULL_PRICE_HOLDING_QUARTERS)
    .filter(() => state.demand >= 70)
    .map((property) => ({
      ...property,
      currentNetIncome: Math.round(calculateNetIncome(property)),
      salePrice: Math.round(calculateSalePrice(property))
    }))
    .sort((left, right) => left.currentNetIncome - right.currentNetIncome || right.salePrice - left.salePrice)[0] || null;
}

function getAdvisorWarnings(activeProperties, expectedNetIncome, actionsLeft) {
  const warnings = [];
  const missingActiveProperties = Math.max(0, VICTORY_ACTIVE_PROPERTIES - activeProperties.length);
  const missingImprovedActiveProperties = Math.max(0, VICTORY_IMPROVED_ACTIVE_PROPERTIES - getImprovedActivePropertyCount());
  const profitNeed = Math.max(0, VICTORY_TOTAL_PROFIT - state.totalProfit);

  if (state.loan.active && state.loan.remainingPayments > actionsLeft) {
    warnings.push("Активный кредит не успеет погаситься до 20 квартала: победа с текущей моделью невозможна без новой партии.");
  } else if (!state.loan.active && actionsLeft < LOAN_TERM && state.money < PROPERTY_TYPES.housing.baseCost) {
    warnings.push("Новый кредит уже опасен: платежей до конца игры не хватит для полного закрытия.");
  }

  if (missingActiveProperties + missingImprovedActiveProperties > actionsLeft) {
    warnings.push("До финала меньше ходов, чем нужно для всех обязательных объектов и улучшенных активов. Нужны самые приоритетные действия без пропусков.");
  } else if (missingActiveProperties && actionsLeft <= missingActiveProperties + 1) {
    warnings.push("Осталось мало ходов для набора нужного количества активных объектов.");
  }

  if (profitNeed > 0 && expectedNetIncome > 0 && expectedNetIncome * actionsLeft < profitNeed) {
    warnings.push(`Текущий денежный поток может не добрать ${formatMoney(profitNeed)} суммарной прибыли до финала.`);
  }

  if (expectedNetIncome <= 0 && activeProperties.length) {
    warnings.push("Портфель почти не генерирует прибыль: проверьте ставку, спрос и структуру объектов.");
  }

  if (state.money < 150000 && state.loan.active) {
    warnings.push("Денежный запас низкий при активном кредите: любое негативное событие может привести к поражению.");
  }

  if (state.lastEvent && state.lastEvent.effect.reputation < 0) {
    warnings.push("Последнее событие ударило по репутации: доходы и шанс победы просели.");
  }

  if (actionsLeft <= 2 && state.money <= VICTORY_MONEY + 60000) {
    warnings.push("На финише нужен денежный буфер выше 2 060 000: негативное событие может забрать часть капитала.");
  }

  return warnings;
}

function getEventResponseAdvice(bestUpgradeTarget, bestBuild) {
  if (!state.lastEvent) {
    return "События ещё не было. Первый приоритет: построить активный объект и запустить доход.";
  }

  const effect = state.lastEvent.effect;

  if (effect.reputation < 0) {
    return bestUpgradeTarget && state.money >= UPGRADE_COST
      ? `Событие снизило доверие. Логичный ответ: улучшить ${bestUpgradeTarget.name}, чтобы вернуть репутацию и увеличить доход.`
      : "Событие снизило доверие. Не продавайте активы в панике: сначала накопите деньги на улучшение или стабилизируйте денежный поток.";
  }

  if (effect.interestRate > 0) {
    return "Ставка выросла: кредит становится опаснее, расходы немного выше. Лучше развивать портфель из текущей прибыли.";
  }

  if (effect.interestRate < 0) {
    return state.loan.active
      ? "Ставка снизилась: платежи по действующему кредиту становятся мягче, но новый кредит брать нельзя, пока старый активен."
      : "Ставка снизилась: кредит становится менее рискованным, если он нужен для добора объектов и до финала хватает кварталов.";
  }

  if (effect.demand > 0) {
    return bestBuild
      ? `Спрос вырос: хорошее окно для расширения. Советник предпочитает действие "${bestBuild.title.toLowerCase()}".`
      : "Спрос вырос: держите активы, не продавайте слишком рано, доходность портфеля стала выше.";
  }

  if (effect.demand < 0) {
    return "Спрос просел: продажа сейчас хуже, чем удержание. Лучше улучшать сильные объекты или переждать квартал с доходом.";
  }

  if (effect.money < 0) {
    return "Событие забрало деньги: держите резерв и не берите лишний кредит без понятного плана погашения.";
  }

  if (effect.money > 0) {
    return "Событие дало денежный плюс: лучший вариант — реинвестировать его в объект или улучшение, а не оставлять без дела.";
  }

  return "Событие не требует резкой реакции. Ориентируйтесь на ближайшее невыполненное условие победы.";
}

function renderControlSummaries(activeProperties) {
  if (elements.turnSummaryCard) {
    if (!state.lastQuarterSummary) {
      elements.turnSummaryCard.innerHTML = `
        <span>Прошлый квартал</span>
        <strong>ещё нет</strong>
        <small>Сделайте первое действие</small>
      `;
    } else {
      const summary = state.lastQuarterSummary;
      const netResult = summary.netIncome - summary.loanPayment;
      elements.turnSummaryCard.innerHTML = `
        <span>Прошлый квартал</span>
        <strong>${formatSignedMoney(netResult)}</strong>
        <small>${escapeHtml(summary.actionLabel)}</small>
      `;
    }
  }

  if (elements.portfolioSummaryCard) {
    const expectedNetIncome = activeProperties.reduce((sum, property) => {
      return sum + Math.round(calculateIncome(property) - calculateExpense(property));
    }, 0);

    elements.portfolioSummaryCard.innerHTML = `
      <span>Портфель</span>
      <strong>${activeProperties.length} объектов</strong>
      <small>${formatSignedMoney(expectedNetIncome)} / квартал</small>
    `;
  }
}

function renderLoanStatus() {
  if (!state.loan.active) {
    elements.loanStatusBox.innerHTML = `
      <strong>Кредит: нет</strong>
      <p>Доступно ${formatMoney(LOAN_AMOUNT)}</p>
    `;
    return;
  }

  const payment = Math.round(LOAN_AMOUNT * (state.interestRate / 100) / LOAN_TERM);
  elements.loanStatusBox.innerHTML = `
    <strong>Кредит: ${state.loan.remainingPayments} плат.</strong>
    <p>${formatMoney(payment)} / квартал</p>
  `;
}

function populatePropertySelect(selectElement, items, emptyLabel) {
  if (!items.length) {
    selectElement.innerHTML = `<option value="">${emptyLabel}</option>`;
    selectElement.disabled = true;
    return;
  }

  selectElement.disabled = false;
  selectElement.innerHTML = items
    .map((property) => `<option value="${property.id}">${property.name} • ур. ${property.level}</option>`)
    .join("");
}
