const STORAGE_KEY = "real-estate-simulator-save-v1";
const MAX_QUARTERS = 20;
const LOAN_AMOUNT = 300000;
const LOAN_TERM = 8;
const UPGRADE_COST = 80000;

const PROPERTY_TYPES = {
  housing: {
    key: "housing",
    type: "Жильё",
    namePrefix: "Жилой комплекс",
    baseCost: 250000,
    baseIncome: 45000,
    baseExpense: 12000
  },
  office: {
    key: "office",
    type: "Офис",
    namePrefix: "Бизнес-центр",
    baseCost: 400000,
    baseIncome: 70000,
    baseExpense: 22000
  },
  retail: {
    key: "retail",
    type: "Ритейл",
    namePrefix: "Торговая галерея",
    baseCost: 320000,
    baseIncome: 60000,
    baseExpense: 18000
  }
};

const EVENT_POOL = [
  {
    title: "Рост интереса к жилью",
    description: "Покупатели активнее рассматривают аренду и покупку квартир.",
    category: "Спрос",
    effect: { demand: 8, interestRate: 0, reputation: 0, money: 0 }
  },
  {
    title: "Спад потребительской активности",
    description: "Потребители осторожнее тратят деньги, а арендаторы откладывают решения.",
    category: "Рынок",
    effect: { demand: -7, interestRate: 0, reputation: 0, money: 0 }
  },
  {
    title: "Снижение процентной ставки",
    description: "Финансирование стало доступнее, сделки начали ускоряться.",
    category: "Финансы",
    effect: { demand: 3, interestRate: -2, reputation: 0, money: 0 }
  },
  {
    title: "Рост ставки",
    description: "Банки ужесточили условия, девелоперам приходится считать расходы внимательнее.",
    category: "Финансы",
    effect: { demand: -4, interestRate: 2, reputation: 0, money: 0 }
  },
  {
    title: "Государственная поддержка",
    description: "Программа поддержки девелоперов принесла субсидию и улучшила восприятие бренда.",
    category: "Политика",
    effect: { demand: 4, interestRate: -1, reputation: 3, money: 90000 }
  },
  {
    title: "Проверка объекта",
    description: "Регулятор нашёл недочёты в документации и потребовал оперативно исправить замечания.",
    category: "Репутация",
    effect: { demand: -2, interestRate: 0, reputation: -6, money: -70000 }
  },
  {
    title: "Удачная PR-кампания",
    description: "Информационная кампания усилила доверие к компании и привела новых клиентов.",
    category: "Маркетинг",
    effect: { demand: 5, interestRate: 0, reputation: 8, money: -30000 }
  },
  {
    title: "Инфляционное давление",
    description: "На рынке выросли цены, часть арендаторов сокращает активность.",
    category: "Макроэкономика",
    effect: { demand: -4, interestRate: 1, reputation: 0, money: -40000 }
  },
  {
    title: "Ремонт инфраструктуры",
    description: "Транспортная доступность района улучшилась, объекты стали привлекательнее.",
    category: "Инфраструктура",
    effect: { demand: 6, interestRate: 0, reputation: 2, money: 0 }
  },
  {
    title: "Рост затрат на обслуживание",
    description: "Подрядчики подняли цены на сервис и обслуживание помещений.",
    category: "Издержки",
    effect: { demand: 0, interestRate: 1, reputation: -1, money: -50000 }
  },
  {
    title: "Приток бизнеса в район",
    description: "Новые компании ищут помещения, коммерческие площади арендуются быстрее.",
    category: "Бизнес",
    effect: { demand: 7, interestRate: 0, reputation: 2, money: 40000 }
  },
  {
    title: "Сокращение спроса на коммерческие площади",
    description: "Часть компаний переводит команды в удалённый формат и сокращает площади.",
    category: "Бизнес",
    effect: { demand: -8, interestRate: 0, reputation: -2, money: 0 }
  },
  {
    title: "Льготное кредитование",
    description: "На рынке появилась временная программа мягкого финансирования.",
    category: "Финансы",
    effect: { demand: 4, interestRate: -1, reputation: 1, money: 0 }
  },
  {
    title: "Локальный городской фестиваль",
    description: "Трафик в районах вырос, объекты стали заметнее для арендаторов.",
    category: "Город",
    effect: { demand: 5, interestRate: 0, reputation: 1, money: 25000 }
  }
];

const elements = {};
let state = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  bindEvents();

  const savedState = loadGame();
  if (savedState) {
    state = normalizeLoadedState(savedState);
  } else {
    state = createInitialState();
  }

  updateStartScreen();

  if (savedState && savedState.ui && savedState.ui.wasGameVisible) {
    showGameScreen(false);
    if (state.gameOver) {
      openEndgameModal();
    }
  } else {
    showStartScreen();
  }

  renderAll();
  window.addEventListener("resize", renderCharts);
}

function cacheElements() {
  elements.startScreen = document.getElementById("start-screen");
  elements.gameScreen = document.getElementById("game-screen");
  elements.saveHint = document.getElementById("save-hint");
  elements.startGameButton = document.getElementById("start-game-button");
  elements.continueGameButton = document.getElementById("continue-game-button");
  elements.scrollToRulesButton = document.getElementById("scroll-to-rules-button");
  elements.showRulesButton = document.getElementById("show-rules-button");
  elements.showAboutButton = document.getElementById("show-about-button");

  elements.metricQuarter = document.getElementById("metric-quarter");
  elements.metricMoney = document.getElementById("metric-money");
  elements.metricReputation = document.getElementById("metric-reputation");
  elements.metricDemand = document.getElementById("metric-demand");
  elements.metricInterest = document.getElementById("metric-interest");
  elements.metricProfit = document.getElementById("metric-profit");

  elements.buildHousingButton = document.getElementById("build-housing-button");
  elements.buildOfficeButton = document.getElementById("build-office-button");
  elements.buildRetailButton = document.getElementById("build-retail-button");
  elements.upgradeSelect = document.getElementById("upgrade-select");
  elements.upgradeButton = document.getElementById("upgrade-button");
  elements.sellSelect = document.getElementById("sell-select");
  elements.sellButton = document.getElementById("sell-button");
  elements.loanStatusBox = document.getElementById("loan-status-box");
  elements.loanButton = document.getElementById("loan-button");
  elements.skipTurnButton = document.getElementById("skip-turn-button");
  elements.newGameButton = document.getElementById("new-game-button");
  elements.resetProgressButton = document.getElementById("reset-progress-button");

  elements.propertiesGrid = document.getElementById("properties-grid");
  elements.latestEventCard = document.getElementById("latest-event-card");
  elements.eventHistory = document.getElementById("event-history");
  elements.gameSummary = document.getElementById("game-summary");

  elements.moneyChart = document.getElementById("money-chart");
  elements.demandChart = document.getElementById("demand-chart");
  elements.reputationChart = document.getElementById("reputation-chart");
  elements.moneyTrendLabel = document.getElementById("money-trend-label");
  elements.demandTrendLabel = document.getElementById("demand-trend-label");
  elements.reputationTrendLabel = document.getElementById("reputation-trend-label");
  elements.timelineTableBody = document.getElementById("timeline-table-body");

  elements.toastContainer = document.getElementById("toast-container");
  elements.endgameModal = document.getElementById("endgame-modal");
  elements.endgameResultBadge = document.getElementById("endgame-result-badge");
  elements.endgameTitle = document.getElementById("endgame-title");
  elements.endgameDescription = document.getElementById("endgame-description");
  elements.endgameMetrics = document.getElementById("endgame-metrics");
  elements.restartFromModalButton = document.getElementById("restart-from-modal-button");

  elements.rulesSection = document.getElementById("rules-section");
  elements.aboutSection = document.getElementById("about-section");
}

function bindEvents() {
  elements.startGameButton.addEventListener("click", () => startNewGame({ askConfirmation: hasSavedGame() }));
  elements.continueGameButton.addEventListener("click", continueSavedGame);
  elements.scrollToRulesButton.addEventListener("click", () => scrollToSection(elements.rulesSection));
  elements.showRulesButton.addEventListener("click", () => scrollToSection(elements.rulesSection));
  elements.showAboutButton.addEventListener("click", () => scrollToSection(elements.aboutSection));

  elements.buildHousingButton.addEventListener("click", () => performAction(() => buildProperty("housing")));
  elements.buildOfficeButton.addEventListener("click", () => performAction(() => buildProperty("office")));
  elements.buildRetailButton.addEventListener("click", () => performAction(() => buildProperty("retail")));
  elements.upgradeButton.addEventListener("click", () => performAction(() => upgradeProperty(Number(elements.upgradeSelect.value))));
  elements.sellButton.addEventListener("click", () => performAction(() => sellProperty(Number(elements.sellSelect.value))));
  elements.loanButton.addEventListener("click", () => performAction(takeLoan));
  elements.skipTurnButton.addEventListener("click", () => performAction(skipTurn));

  elements.newGameButton.addEventListener("click", () => startNewGame({ askConfirmation: true }));
  elements.resetProgressButton.addEventListener("click", resetProgress);
  elements.restartFromModalButton.addEventListener("click", () => startNewGame({ askConfirmation: false }));
}

function createInitialState() {
  return {
    money: 1000000,
    reputation: 50,
    demand: 50,
    interestRate: 10,
    quarter: 1,
    totalProfit: 0,
    properties: [],
    loan: {
      active: false,
      amount: 0,
      remainingPayments: 0
    },
    eventHistory: [],
    lastEvent: null,
    timeline: [
      {
        quarter: 0,
        money: 1000000,
        demand: 50,
        reputation: 50,
        interestRate: 10
      }
    ],
    lastQuarterSummary: null,
    lastActionLabel: "Игра ещё не началась",
    gameOver: false,
    resultType: null,
    resultMessage: "",
    ui: {
      wasGameVisible: false
    }
  };
}

function normalizeLoadedState(rawState) {
  const initialState = createInitialState();
  const normalizedState = {
    ...initialState,
    ...rawState,
    loan: {
      ...initialState.loan,
      ...(rawState.loan || {})
    },
    ui: {
      ...initialState.ui,
      ...(rawState.ui || {})
    }
  };

  normalizedState.properties = Array.isArray(rawState.properties) ? rawState.properties : [];
  normalizedState.eventHistory = Array.isArray(rawState.eventHistory) ? rawState.eventHistory.slice(0, 5) : [];
  normalizedState.timeline = Array.isArray(rawState.timeline) && rawState.timeline.length
    ? rawState.timeline
    : initialState.timeline;
  normalizedState.lastEvent = rawState.lastEvent || null;
  normalizedState.lastQuarterSummary = rawState.lastQuarterSummary || null;
  normalizedState.lastActionLabel = rawState.lastActionLabel || initialState.lastActionLabel;

  return normalizedState;
}

function startNewGame(options = {}) {
  const { askConfirmation = false } = options;
  if (askConfirmation && hasSavedGame()) {
    const confirmed = window.confirm("Начать новую игру? Текущее сохранение будет перезаписано.");
    if (!confirmed) {
      return;
    }
  }

  state = createInitialState();
  saveGame(true);
  closeEndgameModal();
  showGameScreen(true);
  renderAll();
  showToast("Новая игра началась. Первый квартал готов к решению.", "success");
}

function continueSavedGame() {
  const savedState = loadGame();
  if (!savedState) {
    showToast("Сохранение не найдено. Запустите новую игру.", "warning");
    updateStartScreen();
    return;
  }

  state = normalizeLoadedState(savedState);
  showGameScreen(true);
  renderAll();

  if (state.gameOver) {
    openEndgameModal();
  } else {
    showToast("Сохранение загружено.", "info");
  }
}

function resetProgress() {
  const confirmed = window.confirm("Удалить сохранение и сбросить весь прогресс?");
  if (!confirmed) {
    return;
  }

  clearSavedGame();
  state = createInitialState();
  closeEndgameModal();
  showStartScreen();
  renderAll();
  updateStartScreen();
  showToast("Прогресс удалён. Можно начать заново.", "warning");
}

function performAction(actionHandler) {
  if (state.gameOver) {
    showToast("Игра уже завершена. Начните новую партию.", "warning");
    return;
  }

  const actionResult = actionHandler();
  if (!actionResult.success) {
    showToast(actionResult.message, actionResult.tone || "warning");
    return;
  }

  processQuarter(actionResult.actionLabel);
  showToast(actionResult.message, actionResult.tone || "success");
}

function buildProperty(typeKey) {
  const config = PROPERTY_TYPES[typeKey];
  if (!config) {
    return { success: false, message: "Неизвестный тип недвижимости.", tone: "danger" };
  }

  if (state.money < config.baseCost) {
    return { success: false, message: "Недостаточно денег для строительства.", tone: "warning" };
  }

  state.money -= config.baseCost;

  const property = createProperty(config);
  state.properties.push(property);

  return {
    success: true,
    message: `${property.name} введён в портфель.`,
    tone: "success",
    actionLabel: `Построен объект: ${property.name}`
  };
}

function createProperty(config) {
  const propertyId = getNextPropertyId();
  const sameTypeCount = state.properties.filter((item) => item.type === config.type).length + 1;

  return {
    id: propertyId,
    type: config.type,
    typeKey: config.key,
    name: `${config.namePrefix} ${sameTypeCount}`,
    baseCost: config.baseCost,
    baseIncome: config.baseIncome,
    baseExpense: config.baseExpense,
    level: 1,
    status: "active",
    createdAtQuarter: state.quarter,
    soldAtQuarter: null,
    soldPrice: null
  };
}

function upgradeProperty(propertyId) {
  const property = findActiveProperty(propertyId);
  if (!property) {
    return { success: false, message: "Для улучшения нужно выбрать активный объект.", tone: "warning" };
  }

  if (state.money < UPGRADE_COST) {
    return { success: false, message: "Недостаточно денег для улучшения объекта.", tone: "warning" };
  }

  state.money -= UPGRADE_COST;
  property.level += 1;
  state.reputation = clamp(state.reputation + 3, 0, 100);

  return {
    success: true,
    message: `${property.name} улучшен до уровня ${property.level}.`,
    tone: "success",
    actionLabel: `Улучшен объект: ${property.name}`
  };
}

function sellProperty(propertyId) {
  const property = findActiveProperty(propertyId);
  if (!property) {
    return { success: false, message: "Для продажи нужно выбрать активный объект.", tone: "warning" };
  }

  const salePrice = Math.round(calculateSalePrice(property));
  property.status = "sold";
  property.soldAtQuarter = state.quarter;
  property.soldPrice = salePrice;
  state.money += salePrice;

  return {
    success: true,
    message: `${property.name} продан за ${formatMoney(salePrice)}.`,
    tone: "success",
    actionLabel: `Продан объект: ${property.name}`
  };
}

function takeLoan() {
  if (state.loan.active) {
    return { success: false, message: "Сначала погасите текущий кредит.", tone: "warning" };
  }

  state.loan.active = true;
  state.loan.amount = LOAN_AMOUNT;
  state.loan.remainingPayments = LOAN_TERM;
  state.money += LOAN_AMOUNT;

  return {
    success: true,
    message: "Кредит оформлен, капитал увеличен на 300 000.",
    tone: "info",
    actionLabel: "Оформлен кредит"
  };
}

function skipTurn() {
  return {
    success: true,
    message: "Квартал завершён без активного действия.",
    tone: "info",
    actionLabel: "Ход пропущен"
  };
}

function processQuarter(actionLabel) {
  const currentQuarter = state.quarter;
  const portfolioResult = applyPortfolioCashflow();
  const loanPayment = applyLoanPayment();
  const resolvedEvent = applyRandomEvent();
  const marketShift = updateMarketState();

  state.totalProfit += portfolioResult.netIncome - loanPayment;
  state.money = Math.round(state.money);
  state.totalProfit = Math.round(state.totalProfit);
  state.lastActionLabel = actionLabel;
  state.lastQuarterSummary = {
    quarter: currentQuarter,
    actionLabel,
    portfolioIncome: portfolioResult.income,
    portfolioExpense: portfolioResult.expense,
    netIncome: portfolioResult.netIncome,
    loanPayment,
    marketShift
  };

  state.timeline.push({
    quarter: currentQuarter,
    money: Math.round(state.money),
    demand: state.demand,
    reputation: state.reputation,
    interestRate: state.interestRate
  });

  const outcome = evaluateOutcome(currentQuarter);

  if (!state.gameOver) {
    state.quarter += 1;
  }

  saveGame(true);
  renderAll();

  if (outcome) {
    openEndgameModal();
  }

  if (resolvedEvent) {
    showToast(`Событие квартала: ${resolvedEvent.title}`, "info");
  }
}

function applyPortfolioCashflow() {
  const activeProperties = getActiveProperties();
  let totalIncome = 0;
  let totalExpense = 0;

  activeProperties.forEach((property) => {
    totalIncome += calculateIncome(property);
    totalExpense += calculateExpense(property);
  });

  const totalNetIncome = totalIncome - totalExpense;
  state.money += totalNetIncome;

  return {
    income: Math.round(totalIncome),
    expense: Math.round(totalExpense),
    netIncome: Math.round(totalNetIncome)
  };
}

function applyLoanPayment() {
  if (!state.loan.active) {
    return 0;
  }

  const payment = Math.round(LOAN_AMOUNT * (state.interestRate / 100) / LOAN_TERM);
  state.money -= payment;
  state.loan.remainingPayments -= 1;

  if (state.loan.remainingPayments <= 0) {
    state.loan.active = false;
    state.loan.amount = 0;
    state.loan.remainingPayments = 0;
  }

  return payment;
}

function applyRandomEvent() {
  const eventTemplate = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  const appliedEffect = {
    demand: eventTemplate.effect.demand || 0,
    interestRate: eventTemplate.effect.interestRate || 0,
    reputation: eventTemplate.effect.reputation || 0,
    money: eventTemplate.effect.money || 0
  };

  state.demand = clamp(state.demand + appliedEffect.demand, 0, 100);
  state.interestRate = clamp(state.interestRate + appliedEffect.interestRate, 1, 25);
  state.reputation = clamp(state.reputation + appliedEffect.reputation, 0, 100);
  state.money += appliedEffect.money;

  const eventRecord = {
    title: eventTemplate.title,
    description: eventTemplate.description,
    category: eventTemplate.category,
    effect: appliedEffect,
    effectText: formatEffectText(appliedEffect),
    quarter: state.quarter
  };

  state.lastEvent = eventRecord;
  state.eventHistory = [eventRecord, ...state.eventHistory].slice(0, 5);

  return eventRecord;
}

function updateMarketState() {
  const activeProperties = getActiveProperties();
  const demandShift = Math.round(
    randomBetween(-2, 2) +
    (state.reputation - 50) / 22 -
    (state.interestRate - 10) / 4 +
    Math.min(activeProperties.length, 4) * 0.5
  );
  const interestShift = randomBetween(-1, 1);
  let reputationShift = 0;

  if (activeProperties.length >= 3) {
    reputationShift += 1;
  }
  if (state.loan.active && state.money < 200000) {
    reputationShift -= 1;
  }

  state.demand = clamp(state.demand + demandShift, 0, 100);
  state.interestRate = clamp(state.interestRate + interestShift, 1, 25);
  state.reputation = clamp(state.reputation + reputationShift, 0, 100);

  return {
    demandShift,
    interestShift,
    reputationShift
  };
}

function evaluateOutcome(processedQuarter) {
  if (state.money < 0) {
    state.gameOver = true;
    state.resultType = "defeat";
    state.resultMessage = "Капитал стал отрицательным. Рынок оказался сильнее вашей финансовой подушки.";
    return state.resultType;
  }

  if (processedQuarter >= MAX_QUARTERS) {
    state.gameOver = true;

    if (state.money > 2000000 && state.reputation >= 60) {
      state.resultType = "victory";
      state.resultMessage = "Портфель вырос до сильной позиции, а репутация поддержала успех на рынке.";
    } else {
      state.resultType = "neutral";
      state.resultMessage = "Вы дошли до 20 квартала, но не выполнили все условия уверенной победы.";
    }

    return state.resultType;
  }

  return null;
}

function calculateIncome(property) {
  const levelMultiplier = 1 + (property.level - 1) * 0.15;
  return property.baseIncome *
    (0.5 + state.demand / 200) *
    (0.7 + state.reputation / 200) *
    levelMultiplier;
}

function calculateExpense(property) {
  return property.baseExpense * (1 + state.interestRate / 1000);
}

function calculateNetIncome(property) {
  return calculateIncome(property) - calculateExpense(property);
}

function calculateSalePrice(property) {
  return property.baseCost * (0.8 + state.demand / 200) * (1 + property.level * 0.05);
}

function findActiveProperty(propertyId) {
  return state.properties.find((property) => property.id === propertyId && property.status === "active");
}

function getActiveProperties() {
  return state.properties.filter((property) => property.status === "active");
}

function getNextPropertyId() {
  return state.properties.reduce((maxId, property) => Math.max(maxId, property.id), 0) + 1;
}

function renderAll() {
  renderMetrics();
  renderActionControls();
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

  elements.buildHousingButton.disabled = gameLocked;
  elements.buildOfficeButton.disabled = gameLocked;
  elements.buildRetailButton.disabled = gameLocked;
  elements.loanButton.disabled = gameLocked || state.loan.active;
  elements.skipTurnButton.disabled = gameLocked;
  elements.upgradeButton.disabled = gameLocked || activeProperties.length === 0;
  elements.sellButton.disabled = gameLocked || activeProperties.length === 0;

  renderLoanStatus();
}

function renderLoanStatus() {
  if (!state.loan.active) {
    elements.loanStatusBox.innerHTML = `
      <strong>Кредит отсутствует</strong>
      <p>Можно привлечь ${formatMoney(LOAN_AMOUNT)} на 8 кварталов.</p>
    `;
    return;
  }

  const payment = Math.round(LOAN_AMOUNT * (state.interestRate / 100) / LOAN_TERM);
  elements.loanStatusBox.innerHTML = `
    <strong>Кредит активен</strong>
    <p>Осталось платежей: ${state.loan.remainingPayments}</p>
    <p>Текущий квартальный платёж: ${formatMoney(payment)}</p>
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

function renderProperties() {
  if (!state.properties.length) {
    elements.propertiesGrid.innerHTML = `
      <div class="empty-state">
        <h4>Портфель пока пуст</h4>
        <p>Постройте первый объект, чтобы начать генерировать доход и формировать репутацию на рынке.</p>
      </div>
    `;
    return;
  }

  const sortedProperties = [...state.properties].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }
    return left.id - right.id;
  });

  elements.propertiesGrid.innerHTML = sortedProperties.map((property) => {
    const isActive = property.status === "active";
    const income = isActive ? Math.round(calculateIncome(property)) : 0;
    const expense = isActive ? Math.round(calculateExpense(property)) : 0;
    const netIncome = isActive ? income - expense : 0;
    const salePrice = isActive ? Math.round(calculateSalePrice(property)) : property.soldPrice || 0;

    return `
      <article class="property-card ${isActive ? "" : "property-card--sold"}">
        <div class="property-card__header">
          <div class="property-card__title">
            <h4>${property.name}</h4>
            <div class="property-card__type">${property.type}</div>
          </div>
          <span class="status-badge ${isActive ? "status-badge--active" : "status-badge--sold"}">
            ${isActive ? "Активен" : "Продан"}
          </span>
        </div>

        <div class="property-stats">
          <div class="property-stat">
            <span class="property-stat__label">Уровень</span>
            <span class="property-stat__value">${property.level}</span>
          </div>
          <div class="property-stat">
            <span class="property-stat__label">Базовая стоимость</span>
            <span class="property-stat__value">${formatMoney(property.baseCost)}</span>
          </div>
          <div class="property-stat">
            <span class="property-stat__label">Базовый доход</span>
            <span class="property-stat__value">${formatMoney(property.baseIncome)}</span>
          </div>
          <div class="property-stat">
            <span class="property-stat__label">Базовый расход</span>
            <span class="property-stat__value">${formatMoney(property.baseExpense)}</span>
          </div>
          <div class="property-stat">
            <span class="property-stat__label">Текущий доход</span>
            <span class="property-stat__value">${isActive ? formatMoney(income) : "—"}</span>
          </div>
          <div class="property-stat">
            <span class="property-stat__label">Текущий расход</span>
            <span class="property-stat__value">${isActive ? formatMoney(expense) : "—"}</span>
          </div>
          <div class="property-stat">
            <span class="property-stat__label">Чистая прибыль</span>
            <span class="property-stat__value">${isActive ? formatMoney(netIncome) : "—"}</span>
          </div>
          <div class="property-stat">
            <span class="property-stat__label">${isActive ? "Цена продажи" : "Цена продажи при сделке"}</span>
            <span class="property-stat__value">${salePrice ? formatMoney(salePrice) : "—"}</span>
          </div>
        </div>

        <div class="property-card__footer">
          <div class="property-card__meta">
            <span>ID: ${property.id}</span>
            <span>Создан в квартале: ${property.createdAtQuarter}</span>
            ${property.soldAtQuarter ? `<span>Продан в квартале: ${property.soldAtQuarter}</span>` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderLatestEvent() {
  if (!state.lastEvent) {
    elements.latestEventCard.innerHTML = `
      <div class="empty-state">
        <h4>Пока без событий</h4>
        <p>После завершения первого квартала здесь появится последнее рыночное событие.</p>
      </div>
    `;
    return;
  }

  elements.latestEventCard.innerHTML = renderEventCard(state.lastEvent);
}

function renderEventHistory() {
  if (!state.eventHistory.length) {
    elements.eventHistory.innerHTML = `
      <div class="empty-state">
        <p>История событий начнёт заполняться после первого квартала.</p>
      </div>
    `;
    return;
  }

  elements.eventHistory.innerHTML = state.eventHistory.map((eventItem) => `
    <article class="event-history-item">
      <div class="event-history-item__header">
        <h5>${eventItem.title}</h5>
        <span class="event-chip">${eventItem.category}</span>
      </div>
      <p>${eventItem.description}</p>
      <div class="event-history-item__effect">Квартал ${eventItem.quarter}: ${eventItem.effectText}</div>
    </article>
  `).join("");
}

function renderSummary() {
  const activeProperties = getActiveProperties();
  const soldProperties = state.properties.filter((property) => property.status === "sold").length;
  const averageNetIncome = activeProperties.length
    ? Math.round(activeProperties.reduce((sum, property) => sum + calculateNetIncome(property), 0) / activeProperties.length)
    : 0;
  const victoryTargetMoney = 2000000 - state.money;
  const reputationGap = 60 - state.reputation;
  const lastQuarterText = state.lastQuarterSummary
    ? `Доход ${formatMoney(state.lastQuarterSummary.portfolioIncome)}, расходы ${formatMoney(state.lastQuarterSummary.portfolioExpense)}, кредит ${formatMoney(state.lastQuarterSummary.loanPayment)}.`
    : "Квартал ещё не обработан, показатели находятся в стартовом состоянии.";

  elements.gameSummary.innerHTML = `
    <div class="summary-item">
      <strong>Последнее действие</strong>
      <span>${state.lastActionLabel}</span>
    </div>
    <div class="summary-item">
      <strong>Портфель</strong>
      <span>Активных объектов: ${activeProperties.length}. Проданных объектов: ${soldProperties}. Средняя чистая прибыль: ${formatMoney(averageNetIncome)}.</span>
    </div>
    <div class="summary-item">
      <strong>Финансовое состояние</strong>
      <span>${describeMoneyState(state.money)} ${lastQuarterText}</span>
    </div>
    <div class="summary-item">
      <strong>Рыночный фон</strong>
      <span>${describeMarketState()}.</span>
    </div>
    <div class="summary-item">
      <strong>Прогресс к победе</strong>
      <span>${victoryTargetMoney > 0 ? `До цели по капиталу не хватает ${formatMoney(victoryTargetMoney)}.` : "Цель по капиталу уже выполнена."} ${reputationGap > 0 ? `До нужной репутации осталось ${reputationGap} пунктов.` : "Требуемая репутация уже достигнута."}</span>
    </div>
  `;
}

function renderTimelineTable() {
  const recentEntries = [...state.timeline].slice(-6).reverse();
  elements.timelineTableBody.innerHTML = recentEntries.map((entry) => `
    <tr>
      <td>${entry.quarter === 0 ? "Старт" : entry.quarter}</td>
      <td>${formatMoney(entry.money)}</td>
      <td>${entry.demand}</td>
      <td>${entry.reputation}</td>
      <td>${entry.interestRate}%</td>
    </tr>
  `).join("");
}

function renderCharts() {
  const timeline = state.timeline;
  const moneyValues = timeline.map((entry) => entry.money);
  const demandValues = timeline.map((entry) => entry.demand);
  const reputationValues = timeline.map((entry) => entry.reputation);

  elements.moneyTrendLabel.textContent = getTrendLabel(moneyValues, true);
  elements.demandTrendLabel.textContent = getTrendLabel(demandValues, false);
  elements.reputationTrendLabel.textContent = getTrendLabel(reputationValues, false);

  drawLineChart(elements.moneyChart, moneyValues, {
    stroke: "#176b52",
    fill: "rgba(23, 107, 82, 0.16)",
    min: Math.min(...moneyValues, 0)
  });
  drawLineChart(elements.demandChart, demandValues, {
    stroke: "#d68c2d",
    fill: "rgba(214, 140, 45, 0.18)",
    min: 0,
    max: 100
  });
  drawLineChart(elements.reputationChart, reputationValues, {
    stroke: "#2b8b57",
    fill: "rgba(43, 139, 87, 0.18)",
    min: 0,
    max: 100
  });
}

function drawLineChart(canvas, values, options) {
  if (!canvas || !values.length) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 18, right: 18, bottom: 24, left: 18 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const dataMin = typeof options.min === "number" ? options.min : Math.min(...values);
  const dataMax = typeof options.max === "number" ? options.max : Math.max(...values);
  const range = dataMax - dataMin || 1;

  ctx.strokeStyle = "rgba(21, 39, 30, 0.08)";
  ctx.lineWidth = 1;

  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight / 4) * index;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const points = values.map((value, index) => {
    const x = padding.left + (values.length === 1 ? chartWidth / 2 : (chartWidth / (values.length - 1)) * index);
    const y = padding.top + chartHeight - ((value - dataMin) / range) * chartHeight;
    return { x, y };
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = options.fill;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.strokeStyle = options.stroke;
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = options.stroke;
    ctx.fill();
  });

  ctx.fillStyle = "rgba(21, 39, 30, 0.52)";
  ctx.font = "12px Trebuchet MS";
  ctx.fillText(formatCompactValue(dataMax), padding.left, 14);
  ctx.fillText(formatCompactValue(dataMin), padding.left, height - 8);
}

function updateStartScreen() {
  const savedState = loadGame();

  if (!savedState) {
    elements.saveHint.textContent = "Сохранение не найдено. Игра начнётся с чистого состояния.";
    elements.continueGameButton.classList.add("is-hidden");
    return;
  }

  const loadedState = normalizeLoadedState(savedState);
  elements.continueGameButton.classList.remove("is-hidden");

  if (loadedState.gameOver) {
    const resultText = loadedState.resultType === "victory" ? "победа" : loadedState.resultType === "defeat" ? "поражение" : "нейтральный итог";
    elements.saveHint.textContent = `Найдено завершённое сохранение: ${resultText}, деньги ${formatMoney(loadedState.money)}, репутация ${loadedState.reputation}.`;
    return;
  }

  elements.saveHint.textContent = `Найдено сохранение: квартал ${loadedState.quarter}, деньги ${formatMoney(loadedState.money)}, объектов ${loadedState.properties.filter((property) => property.status === "active").length}.`;
}

function showGameScreen(scrollIntoView) {
  elements.startScreen.classList.add("is-hidden");
  elements.gameScreen.classList.remove("is-hidden");
  state.ui.wasGameVisible = true;
  saveGame(true);

  if (scrollIntoView) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function showStartScreen() {
  elements.startScreen.classList.remove("is-hidden");
  elements.gameScreen.classList.add("is-hidden");
  state.ui.wasGameVisible = false;
}

function openEndgameModal() {
  const configMap = {
    victory: {
      badge: "Победа",
      title: "Цели выполнены",
      description: state.resultMessage
    },
    defeat: {
      badge: "Поражение",
      title: "Финансовый баланс сорван",
      description: state.resultMessage
    },
    neutral: {
      badge: "Нейтральный итог",
      title: "20 кварталов завершены",
      description: state.resultMessage
    }
  };

  const modalConfig = configMap[state.resultType] || configMap.neutral;
  elements.endgameResultBadge.textContent = modalConfig.badge;
  elements.endgameTitle.textContent = modalConfig.title;
  elements.endgameDescription.textContent = modalConfig.description;
  elements.endgameMetrics.innerHTML = `
    <div class="endgame-metric">
      <span>Деньги</span>
      <strong>${formatMoney(state.money)}</strong>
    </div>
    <div class="endgame-metric">
      <span>Репутация</span>
      <strong>${state.reputation}/100</strong>
    </div>
    <div class="endgame-metric">
      <span>Спрос</span>
      <strong>${state.demand}/100</strong>
    </div>
    <div class="endgame-metric">
      <span>Суммарная прибыль</span>
      <strong>${formatMoney(state.totalProfit)}</strong>
    </div>
    <div class="endgame-metric">
      <span>Активные объекты</span>
      <strong>${getActiveProperties().length}</strong>
    </div>
    <div class="endgame-metric">
      <span>Последний квартал</span>
      <strong>${Math.min(state.quarter, MAX_QUARTERS)}</strong>
    </div>
  `;
  elements.endgameModal.classList.remove("is-hidden");
}

function closeEndgameModal() {
  elements.endgameModal.classList.add("is-hidden");
}

function renderEventCard(eventItem) {
  return `
    <article class="event-card">
      <div class="event-card__header">
        <h5>${eventItem.title}</h5>
        <span class="event-chip">${eventItem.category}</span>
      </div>
      <p class="event-card__description">${eventItem.description}</p>
      <div class="event-card__effect">Квартал ${eventItem.quarter}: ${eventItem.effectText}</div>
    </article>
  `;
}

function describeMoneyState(amount) {
  if (amount >= 1800000) {
    return "Капитал уже выглядит очень устойчивым.";
  }
  if (amount >= 900000) {
    return "Финансовая подушка остаётся комфортной.";
  }
  if (amount >= 300000) {
    return "Запас денег есть, но решения требуют аккуратности.";
  }
  return "Запас ликвидности низкий, риск просадки заметно вырос.";
}

function describeMarketState() {
  const demandDescriptor = state.demand >= 70
    ? "Спрос высокий"
    : state.demand >= 45
      ? "Спрос умеренный"
      : "Спрос слабый";
  const rateDescriptor = state.interestRate <= 8
    ? "ставка благоприятная"
    : state.interestRate <= 14
      ? "ставка умеренная"
      : "ставка давит на издержки";

  return `${demandDescriptor}, ${rateDescriptor}, репутация ${state.reputation}/100`;
}

function getTrendLabel(values, moneyLike) {
  if (values.length < 2) {
    return "Пока без динамики";
  }

  const lastValue = values[values.length - 1];
  const previousValue = values[values.length - 2];
  const delta = Math.round(lastValue - previousValue);

  if (delta === 0) {
    return "Без изменений";
  }

  const prefix = delta > 0 ? "+" : "";
  return moneyLike ? `${prefix}${formatCompactValue(delta)}` : `${prefix}${delta}`;
}

function formatEffectText(effect) {
  const parts = [];

  if (effect.demand) {
    parts.push(`спрос ${effect.demand > 0 ? "+" : ""}${effect.demand}`);
  }
  if (effect.interestRate) {
    parts.push(`ставка ${effect.interestRate > 0 ? "+" : ""}${effect.interestRate}`);
  }
  if (effect.reputation) {
    parts.push(`репутация ${effect.reputation > 0 ? "+" : ""}${effect.reputation}`);
  }
  if (effect.money) {
    parts.push(`деньги ${effect.money > 0 ? "+" : ""}${formatMoney(effect.money)}`);
  }

  return parts.length ? parts.join(", ") : "без прямого эффекта";
}

function showToast(message, tone = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${tone}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function scrollToSection(section) {
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveGame(silent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (!silent) {
      showToast("Не удалось сохранить игру в LocalStorage.", "danger");
    }
  }
}

function loadGame() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}

function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    showToast("Не удалось очистить сохранение.", "danger");
  }
}

function hasSavedGame() {
  return Boolean(loadGame());
}

function clamp(value, min, max) {
  return Math.min(Math.max(Math.round(value), min), max);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatMoney(amount) {
  const formatter = new Intl.NumberFormat("ru-RU");
  return `${amount < 0 ? "-" : ""}${formatter.format(Math.abs(Math.round(amount)))}`;
}

function formatCompactValue(value) {
  const absolute = Math.abs(value);
  if (absolute >= 1000000) {
    return `${(value / 1000000).toFixed(1)} млн`;
  }
  if (absolute >= 1000) {
    return `${Math.round(value / 1000)} тыс`;
  }
  return `${Math.round(value)}`;
}
