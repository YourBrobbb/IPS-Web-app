const STORAGE_KEY = "real-estate-simulator-save-v1";
const MAX_QUARTERS = 20;
const LOAN_AMOUNT = 300000;
const LOAN_TERM = 8;
const UPGRADE_COST = 80000;
const VICTORY_MONEY = 2000000;
const VICTORY_REPUTATION = 60;
const VICTORY_ACTIVE_PROPERTIES = 4;
const VICTORY_TOTAL_PROFIT = 700000;
const VICTORY_IMPROVED_ACTIVE_PROPERTIES = 2;
const STRATEGIC_ACTIVE_PROPERTIES = 5;
const STRATEGIC_MAX_ACTIVE_PROPERTIES = 6;
const STRATEGIC_IMPROVED_ACTIVE_PROPERTIES = 3;
const STRATEGIC_MAX_UPGRADES = 8;
const STRATEGIC_REPUTATION_BUFFER = 72;
const STRATEGIC_CASH_RESERVE = 220000;
const SALE_TRANSACTION_FEE_RATE = 0.08;
const EARLY_SALE_DISCOUNT_RATE = 0.14;
const FULL_PRICE_HOLDING_QUARTERS = 4;

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
    effect: { demand: -8, interestRate: 0, reputation: 0, money: 0 }
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
    effect: { demand: 4, interestRate: -1, reputation: 3, money: 70000 }
  },
  {
    title: "Проверка объекта",
    description: "Регулятор нашёл недочёты в документации и потребовал оперативно исправить замечания.",
    category: "Репутация",
    effect: { demand: -2, interestRate: 0, reputation: -6, money: -60000 }
  },
  {
    title: "Удачная PR-кампания",
    description: "Информационная кампания усилила доверие к компании и привела новых клиентов.",
    category: "Маркетинг",
    effect: { demand: 5, interestRate: 0, reputation: 7, money: -45000 }
  },
  {
    title: "Инфляционное давление",
    description: "На рынке выросли цены, часть арендаторов сокращает активность.",
    category: "Макроэкономика",
    effect: { demand: -4, interestRate: 2, reputation: 0, money: -35000 }
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
    effect: { demand: 0, interestRate: 0, reputation: -1, money: -60000 }
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
    effect: { demand: -8, interestRate: 0, reputation: 0, money: 0 }
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

const CITY_GRID = { columns: 9, rows: 8 };

const CITY_PLOTS = [
  { name: "Северный двор", x: 0, y: 0, zone: "residential" },
  { name: "Садовый квартал", x: 1, y: 0, zone: "park" },
  { name: "Деловая башня", x: 3, y: 0, zone: "business" },
  { name: "Финансовый фасад", x: 4, y: 0, zone: "business" },
  { name: "Витринная улица", x: 6, y: 0, zone: "commerce" },
  { name: "Речной квартал", x: 7, y: 0, zone: "waterfront" },
  { name: "Старый район", x: 0, y: 2, zone: "residential" },
  { name: "Биржевой блок", x: 3, y: 2, zone: "business" },
  { name: "Площадь арендаторов", x: 4, y: 2, zone: "park" },
  { name: "Торговая линия", x: 6, y: 2, zone: "commerce" },
  { name: "Набережная", x: 8, y: 2, zone: "waterfront" },
  { name: "Южный двор", x: 0, y: 4, zone: "residential" },
  { name: "Транспортный узел", x: 1, y: 4, zone: "commerce" },
  { name: "Кампус", x: 3, y: 4, zone: "park" },
  { name: "Офисный парк", x: 4, y: 4, zone: "business" },
  { name: "Молл-стрит", x: 6, y: 4, zone: "commerce" },
  { name: "Новый сектор", x: 8, y: 4, zone: "residential" },
  { name: "Променад", x: 0, y: 7, zone: "waterfront" },
  { name: "Южный парк", x: 1, y: 7, zone: "park" },
  { name: "Городские ворота", x: 3, y: 7, zone: "business" },
  { name: "Ритейл-плаза", x: 4, y: 7, zone: "commerce" },
  { name: "Речной фасад", x: 6, y: 7, zone: "waterfront" },
  { name: "Парк сделок", x: 8, y: 7, zone: "park" }
];

const CITY_ROADS = [
  ...Array.from({ length: CITY_GRID.columns }, (_, x) => ({ x, y: 3 })),
  ...Array.from({ length: CITY_GRID.columns }, (_, x) => ({ x, y: 6 })),
  ...Array.from({ length: CITY_GRID.rows }, (_, y) => ({ x: 2, y })),
  ...Array.from({ length: CITY_GRID.rows }, (_, y) => ({ x: 5, y })),
  ...Array.from({ length: 4 }, (_, index) => ({ x: index + 5, y: index }))
];

const CITY_ROAD_KEYS = new Set(CITY_ROADS.map((road) => `${road.x}:${road.y}`));

const CITY_TRAFFIC_ROUTES = [
  {
    color: "#df5b4f",
    speed: 0.000055,
    offset: 0,
    points: [{ x: -0.4, y: 3.5 }, { x: 9.3, y: 3.5 }]
  },
  {
    color: "#e7b84a",
    speed: 0.000046,
    offset: 0.32,
    points: [{ x: 9.2, y: 6.5 }, { x: -0.3, y: 6.5 }]
  },
  {
    color: "#4b83cf",
    speed: 0.00005,
    offset: 0.58,
    points: [{ x: 2.5, y: -0.5 }, { x: 2.5, y: 8.4 }]
  },
  {
    color: "#ffffff",
    speed: 0.000042,
    offset: 0.77,
    points: [{ x: 5.5, y: 8.2 }, { x: 5.5, y: -0.4 }]
  }
];

const EVENT_SCENE_MAP = {
  "Спрос": { className: "city-map--growth", label: "Покупательский поток" },
  "Рынок": { className: "city-map--risk", label: "Просадка активности" },
  "Финансы": { className: "city-map--finance", label: "Финансовый импульс" },
  "Политика": { className: "city-map--growth", label: "Поддержка рынка" },
  "Репутация": { className: "city-map--risk", label: "Проверка доверия" },
  "Маркетинг": { className: "city-map--growth", label: "Медийный всплеск" },
  "Макроэкономика": { className: "city-map--risk", label: "Макроэкономическое давление" },
  "Инфраструктура": { className: "city-map--growth", label: "Обновление среды" },
  "Издержки": { className: "city-map--risk", label: "Рост затрат" },
  "Бизнес": { className: "city-map--finance", label: "Деловая активность" },
  "Город": { className: "city-map--culture", label: "Городской поток" }
};

const elements = {};
let state = null;
let cityAnimationFrameId = null;
let citySceneCache = null;
let cityHitAreas = [];

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
  elements.nextActionCard = document.getElementById("next-action-card");
  elements.advisorPanel = document.getElementById("advisor-panel");
  elements.turnSummaryCard = document.getElementById("turn-summary-card");
  elements.portfolioSummaryCard = document.getElementById("portfolio-summary-card");
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
  elements.cityMap = document.getElementById("city-map");
  elements.cityMarketBoard = document.getElementById("city-market-board");
  elements.quarterFlowBoard = document.getElementById("quarter-flow-board");
  elements.visualEventBoard = document.getElementById("visual-event-board");

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
  elements.backToMenuButton = document.getElementById("back-to-menu-button");

  elements.rulesSection = document.getElementById("rules-section");
  elements.aboutSection = document.getElementById("about-section");
}

function bindEvents() {
  elements.startGameButton.addEventListener("click", () => startNewGame());
  elements.scrollToRulesButton.addEventListener("click", () => scrollToSection(elements.rulesSection));
  elements.showRulesButton.addEventListener("click", () => scrollToSection(elements.rulesSection));
  elements.showAboutButton.addEventListener("click", () => scrollToSection(elements.aboutSection));
  elements.advisorPanel.addEventListener("click", handleAdvisorPanelClick);

  elements.buildHousingButton.addEventListener("click", () => performAction(() => buildProperty("housing")));
  elements.buildOfficeButton.addEventListener("click", () => performAction(() => buildProperty("office")));
  elements.buildRetailButton.addEventListener("click", () => performAction(() => buildProperty("retail")));
  elements.upgradeSelect.addEventListener("change", syncSellSelectWithVisibleObject);
  elements.upgradeButton.addEventListener("click", () => performAction(() => upgradeProperty(Number(elements.upgradeSelect.value))));
  elements.sellButton.addEventListener("click", () => performAction(() => sellProperty(Number(elements.sellSelect.value))));
  elements.loanButton.addEventListener("click", () => performAction(takeLoan));
  elements.skipTurnButton.addEventListener("click", () => performAction(skipTurn));

  elements.newGameButton.addEventListener("click", () => startNewGame());
  elements.resetProgressButton.addEventListener("click", resetProgress);
  elements.restartFromModalButton.addEventListener("click", startNewGame);
  elements.backToMenuButton.addEventListener("click", returnToMenuFromModal);
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
      wasGameVisible: false,
      advisorEnabled: true
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

function startNewGame() {
  state = createInitialState();
  saveGame(true);
  closeEndgameModal();
  showGameScreen(true);
  renderAll();
  showToast("Новая игра началась. Первый квартал готов к решению.", "success");
}

function resetProgress() {
  const confirmed = window.confirm("Сбросить текущую игру и вернуться в меню?");
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
  const directMoneyEffect = Math.round((eventTemplate.effect.money || 0) * getEventMoneyExposure());
  const appliedEffect = {
    demand: eventTemplate.effect.demand || 0,
    interestRate: eventTemplate.effect.interestRate || 0,
    reputation: eventTemplate.effect.reputation || 0,
    money: directMoneyEffect
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
    const victoryStatus = getVictoryStatus();

    if (victoryStatus.isVictory) {
      state.resultType = "victory";
      state.resultMessage = "Портфель вырос до сильной позиции: капитал, репутация, активы и суммарная прибыль подтверждают устойчивую стратегию.";
    } else {
      state.resultType = "neutral";
      state.resultMessage = `Вы дошли до 20 квартала, но не выполнили все условия уверенной победы. Не хватает: ${getUnmetVictoryText(victoryStatus.requirements)}.`;
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
  const demandMultiplier = 0.72 + state.demand / 250;
  const levelMultiplier = 1 + (property.level - 1) * 0.08;
  const holdingQuarters = Math.max(0, state.quarter - property.createdAtQuarter);
  const holdingMultiplier = holdingQuarters >= FULL_PRICE_HOLDING_QUARTERS
    ? 1
    : 1 - EARLY_SALE_DISCOUNT_RATE;
  const transactionMultiplier = 1 - SALE_TRANSACTION_FEE_RATE;

  return property.baseCost * demandMultiplier * levelMultiplier * holdingMultiplier * transactionMultiplier;
}

function findActiveProperty(propertyId) {
  return state.properties.find((property) => property.id === propertyId && property.status === "active");
}

function getActiveProperties() {
  return state.properties.filter((property) => property.status === "active");
}

function getUpgradeCount() {
  return state.properties.reduce((sum, property) => sum + Math.max(property.level - 1, 0), 0);
}

function getImprovedActivePropertyCount() {
  return getActiveProperties().filter((property) => property.level > 1).length;
}

function getPortfolioTypeDiversity(activeProperties = getActiveProperties()) {
  return new Set(activeProperties.map(getPropertyTypeKey)).size;
}

function getEventMoneyExposure() {
  const activePropertiesCount = getActiveProperties().length;

  if (!activePropertiesCount) {
    return 0;
  }

  return Math.min(1, 0.5 + activePropertiesCount * 0.17);
}

function getVictoryStatus() {
  const activePropertiesCount = getActiveProperties().length;
  const improvedActivePropertyCount = getImprovedActivePropertyCount();
  const requirements = [
    {
      label: `капитал выше ${formatMoney(VICTORY_MONEY)}`,
      met: state.money > VICTORY_MONEY
    },
    {
      label: `репутация не ниже ${VICTORY_REPUTATION}/100`,
      met: state.reputation >= VICTORY_REPUTATION
    },
    {
      label: `минимум ${VICTORY_ACTIVE_PROPERTIES} активных объекта`,
      met: activePropertiesCount >= VICTORY_ACTIVE_PROPERTIES
    },
    {
      label: `суммарная прибыль портфеля после платежей не ниже ${formatMoney(VICTORY_TOTAL_PROFIT)}`,
      met: state.totalProfit >= VICTORY_TOTAL_PROFIT
    },
    {
      label: `минимум ${VICTORY_IMPROVED_ACTIVE_PROPERTIES} улучшенных активных объекта`,
      met: improvedActivePropertyCount >= VICTORY_IMPROVED_ACTIVE_PROPERTIES
    },
    {
      label: "нет активного кредита",
      met: !state.loan.active
    }
  ];

  return {
    requirements,
    isVictory: requirements.every((requirement) => requirement.met)
  };
}

function getUnmetVictoryText(requirements) {
  const unmetRequirements = requirements
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.label);

  return unmetRequirements.length ? unmetRequirements.join("; ") : "нет";
}

function getNextPropertyId() {
  return state.properties.reduce((maxId, property) => Math.max(maxId, property.id), 0) + 1;
}

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
    "build-housing": () => buildProperty("housing"),
    "build-office": () => buildProperty("office"),
    "build-retail": () => buildProperty("retail"),
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
      const projectedNetIncome = Math.round(calculateProjectedNetIncome(config, 1));
      const demandBonus = state.demand >= 70 && config.key === "office" ? 14 : 0;
      const lowRiskBonus = state.demand < 45 && config.key === "housing" ? 10 : 0;
      const diversificationBonus = existingTypes.has(config.key) ? 0 : 18;
      const score = (projectedNetIncome / config.baseCost) * 100 + demandBonus + lowRiskBonus + diversificationBonus;

      return {
        key: config.key,
        actionKey: `build-${config.key}`,
        title: `Построить ${config.type.toLowerCase()}`,
        buttonLabel: `построить ${config.type.toLowerCase()}`,
        cost: config.baseCost,
        projectedNetIncome,
        score
      };
    })
    .sort((left, right) => right.score - left.score);

  return options[0] || null;
}

function getBuildAlternatives(bestBuild) {
  return Object.values(PROPERTY_TYPES)
    .filter((config) => config.key !== bestBuild.key && state.money >= config.baseCost)
    .map((config) => `Построить ${config.type.toLowerCase()}, если хотите другой профиль риска`);
}

function calculateProjectedNetIncome(config, level) {
  const levelMultiplier = 1 + (level - 1) * 0.15;
  const income = config.baseIncome *
    (0.5 + state.demand / 200) *
    (0.7 + state.reputation / 200) *
    levelMultiplier;
  const expense = config.baseExpense * (1 + state.interestRate / 1000);

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

function renderCityScene() {
  if (!elements.cityMap) {
    return;
  }

  const scene = getEventScene(state.lastEvent);
  const orderedProperties = [...state.properties].sort((left, right) => left.id - right.id);
  const visibleProperties = orderedProperties.slice(0, CITY_PLOTS.length);
  const hiddenPropertiesCount = Math.max(orderedProperties.length - CITY_PLOTS.length, 0);

  elements.cityMap.className = `city-map city-map--canvas ${scene.className}`;
  ensureCityCanvas();
  citySceneCache = {
    scene,
    orderedProperties,
    visibleProperties,
    hiddenPropertiesCount
  };

  renderCityHud(scene, orderedProperties.length, hiddenPropertiesCount);
  renderCityMarketBoard();
  renderQuarterFlowBoard();
  renderVisualEventBoard(scene);
  startCityAnimation();
  drawCityFrame(performance.now());
}

function ensureCityCanvas() {
  if (elements.cityCanvas && elements.cityMap.contains(elements.cityCanvas)) {
    return;
  }

  elements.cityMap.innerHTML = `
    <canvas class="city-canvas" id="city-canvas" role="img" aria-label="Изометрическая карта города с дорогами и зданиями"></canvas>
    <div class="city-hud" id="city-hud"></div>
    <div class="city-tooltip" id="city-tooltip" hidden></div>
  `;

  elements.cityCanvas = document.getElementById("city-canvas");
  elements.cityHud = document.getElementById("city-hud");
  elements.cityTooltip = document.getElementById("city-tooltip");
  elements.cityCanvas.addEventListener("mousemove", handleCityPointerMove);
  elements.cityCanvas.addEventListener("mouseleave", hideCityTooltip);
}

function renderCityHud(scene, totalProperties, hiddenPropertiesCount) {
  if (!elements.cityHud) {
    return;
  }

  const activeCount = getActiveProperties().length;
  const note = totalProperties === 0
    ? "Постройте первый объект, чтобы район начал расти."
    : hiddenPropertiesCount > 0
      ? `На карте показано ${CITY_PLOTS.length}, ещё ${hiddenPropertiesCount} в портфеле.`
      : `${activeCount} активных объектов на карте.`;

  elements.cityHud.innerHTML = `
    <div class="city-hud__event">
      <span>${escapeHtml(scene.label)}</span>
      <strong>${escapeHtml(scene.description)}</strong>
    </div>
    <div class="city-hud__meta">
      <span>Квартал ${Math.min(state.quarter, MAX_QUARTERS)}/${MAX_QUARTERS}</span>
      <span>${escapeHtml(note)}</span>
    </div>
  `;
}

function startCityAnimation() {
  if (cityAnimationFrameId) {
    return;
  }

  const animate = (timestamp) => {
    drawCityFrame(timestamp);
    cityAnimationFrameId = requestAnimationFrame(animate);
  };

  cityAnimationFrameId = requestAnimationFrame(animate);
}

function drawCityFrame(timestamp) {
  if (!elements.cityCanvas || !citySceneCache) {
    return;
  }

  const canvas = elements.cityCanvas;
  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.round(rect.width * dpr);
  const targetHeight = Math.round(rect.height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const metrics = createCityMetrics(rect.width, rect.height);
  cityHitAreas = [];

  drawCityBackground(ctx, metrics);
  drawEventAtmosphere(ctx, metrics, timestamp);
  drawRiver(ctx, metrics, timestamp);
  drawCityTiles(ctx, metrics);
  drawCityItems(ctx, metrics, timestamp);
  drawCityForeground(ctx, metrics, timestamp);
}

function createCityMetrics(width, height) {
  const tileW = Math.max(58, Math.min(132, (width - 10) / 8, (height - 150) / 4.65));
  const tileH = tileW * 0.54;

  return {
    width,
    height,
    tileW,
    tileH,
    originX: width * 0.5,
    originY: Math.max(74, height * 0.13)
  };
}

function projectCityPoint(metrics, x, y, z = 0) {
  return {
    x: metrics.originX + (x - y) * metrics.tileW * 0.5,
    y: metrics.originY + (x + y) * metrics.tileH * 0.5 - z
  };
}

function getTilePoints(metrics, x, y, z = 0) {
  return [
    projectCityPoint(metrics, x, y, z),
    projectCityPoint(metrics, x + 1, y, z),
    projectCityPoint(metrics, x + 1, y + 1, z),
    projectCityPoint(metrics, x, y + 1, z)
  ];
}

function getFootprintPoints(metrics, centerX, centerY, halfX, halfY, z = 0) {
  return [
    projectCityPoint(metrics, centerX - halfX, centerY - halfY, z),
    projectCityPoint(metrics, centerX + halfX, centerY - halfY, z),
    projectCityPoint(metrics, centerX + halfX, centerY + halfY, z),
    projectCityPoint(metrics, centerX - halfX, centerY + halfY, z)
  ];
}

function drawCityBackground(ctx, metrics) {
  const sky = ctx.createLinearGradient(0, 0, metrics.width, metrics.height);
  sky.addColorStop(0, "#d9efe7");
  sky.addColorStop(0.45, "#eef6ea");
  sky.addColorStop(1, "#cbdedc");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, metrics.width, metrics.height);

  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;

  for (let x = -metrics.height; x < metrics.width + metrics.height; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + metrics.height, metrics.height);
    ctx.stroke();
  }

  for (let x = 0; x < metrics.width + metrics.height; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - metrics.height, metrics.height);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEventAtmosphere(ctx, metrics, timestamp) {
  const sceneClass = citySceneCache.scene.className;
  const pulse = 0.5 + Math.sin(timestamp / 850) * 0.5;

  if (sceneClass === "city-map--risk") {
    ctx.fillStyle = `rgba(177, 80, 64, ${0.08 + pulse * 0.05})`;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    return;
  }

  if (sceneClass === "city-map--finance") {
    const beam = ctx.createLinearGradient(0, 0, metrics.width, metrics.height);
    beam.addColorStop(0, "rgba(69, 112, 184, 0)");
    beam.addColorStop(0.52, `rgba(74, 127, 205, ${0.12 + pulse * 0.04})`);
    beam.addColorStop(1, "rgba(232, 184, 74, 0.1)");
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    return;
  }

  if (sceneClass === "city-map--growth") {
    const glow = ctx.createRadialGradient(metrics.width * 0.48, metrics.height * 0.44, 80, metrics.width * 0.48, metrics.height * 0.44, metrics.width * 0.7);
    glow.addColorStop(0, `rgba(58, 151, 99, ${0.12 + pulse * 0.05})`);
    glow.addColorStop(1, "rgba(58, 151, 99, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
  }
}

function drawRiver(ctx, metrics, timestamp) {
  const river = [
    projectCityPoint(metrics, 7.2, -1.1),
    projectCityPoint(metrics, 10.3, 1.4),
    projectCityPoint(metrics, 9.9, 8.9),
    projectCityPoint(metrics, 6.1, 8.7)
  ];

  const gradient = ctx.createLinearGradient(river[0].x, river[0].y, river[2].x, river[2].y);
  gradient.addColorStop(0, "#8ccbd9");
  gradient.addColorStop(1, "#4e98b5");
  fillPolygon(ctx, river, gradient);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#e7fbff";
  ctx.lineWidth = 2;

  for (let index = 0; index < 7; index += 1) {
    const offset = ((timestamp / 60 + index * 34) % 180) - 90;
    ctx.beginPath();
    ctx.moveTo(river[0].x + offset, river[0].y + index * 52);
    ctx.quadraticCurveTo(river[0].x + 120 + offset, river[0].y + 40 + index * 52, river[0].x + 260 + offset, river[0].y + 20 + index * 52);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCityTiles(ctx, metrics) {
  for (let y = 0; y < CITY_GRID.rows; y += 1) {
    for (let x = 0; x < CITY_GRID.columns; x += 1) {
      const plot = getCityPlotAt(x, y);
      const isRoad = CITY_ROAD_KEYS.has(`${x}:${y}`);
      const points = getTilePoints(metrics, x, y);

      if (isRoad) {
        drawRoadTile(ctx, metrics, x, y, points);
      } else if (plot) {
        drawPlotTile(ctx, points, plot.zone);
        cityHitAreas.push({
          polygon: points,
          plot,
          property: citySceneCache.visibleProperties[CITY_PLOTS.indexOf(plot)]
        });
      } else {
        drawPlotTile(ctx, points, "empty");
      }
    }
  }
}

function drawRoadTile(ctx, metrics, x, y, points) {
  fillPolygon(ctx, points, "#4e6566");
  strokePolygon(ctx, points, "rgba(255, 255, 255, 0.2)", 1);

  const center = projectCityPoint(metrics, x + 0.5, y + 0.5);
  const horizontal = y === 3 || y === 6;
  const from = horizontal ? projectCityPoint(metrics, x + 0.12, y + 0.5) : projectCityPoint(metrics, x + 0.5, y + 0.12);
  const to = horizontal ? projectCityPoint(metrics, x + 0.88, y + 0.5) : projectCityPoint(metrics, x + 0.5, y + 0.88);

  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = "#e9f0dc";
  ctx.lineWidth = Math.max(2, metrics.tileW * 0.025);
  ctx.setLineDash([metrics.tileW * 0.12, metrics.tileW * 0.08]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(center.x, center.y, metrics.tileW * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlotTile(ctx, points, zone) {
  const fills = {
    residential: "#bcd5c9",
    business: "#c7d6df",
    commerce: "#dcc8a5",
    park: "#b7d78e",
    waterfront: "#b8dce1",
    empty: "#c9ddd2"
  };

  fillPolygon(ctx, offsetPoints(points, 0, 13), "rgba(31, 52, 45, 0.13)");
  fillPolygon(ctx, points, fills[zone] || fills.empty);
  strokePolygon(ctx, points, "rgba(255, 255, 255, 0.6)", 1.3);
  strokePolygon(ctx, points, "rgba(40, 78, 61, 0.18)", 1);
}

function drawCityItems(ctx, metrics, timestamp) {
  const items = CITY_PLOTS.map((plot, index) => ({
    type: "plot",
    plot,
    property: citySceneCache.visibleProperties[index],
    depth: plot.x + plot.y + 0.95
  }));

  CITY_TRAFFIC_ROUTES.forEach((route, index) => {
    const position = getRoutePosition(route, timestamp);
    const nextPosition = getRoutePosition(route, timestamp + 180);
    items.push({
      type: "car",
      route,
      index,
      position,
      nextPosition,
      depth: position.x + position.y + 0.4
    });
  });

  items
    .sort((left, right) => left.depth - right.depth)
    .forEach((item) => {
      if (item.type === "car") {
        drawCar(ctx, metrics, item.position, item.nextPosition, item.route.color);
        return;
      }

      drawPlotContent(ctx, metrics, item.plot, item.property, timestamp);
    });
}

function drawPlotContent(ctx, metrics, plot, property, timestamp) {
  if (!property) {
    drawZoneDetails(ctx, metrics, plot);
    drawEmptyFoundation(ctx, metrics, plot);
    return;
  }

  if (property.status === "sold") {
    drawSoldLot(ctx, metrics, plot);
    return;
  }

  drawBuilding(ctx, metrics, plot, property, timestamp);
}

function drawZoneDetails(ctx, metrics, plot) {
  if (plot.zone === "park") {
    drawTree(ctx, metrics, plot.x + 0.28, plot.y + 0.42, 0.95);
    drawTree(ctx, metrics, plot.x + 0.68, plot.y + 0.62, 0.72);
    return;
  }

  if (plot.zone === "waterfront") {
    const pier = getFootprintPoints(metrics, plot.x + 0.5, plot.y + 0.52, 0.24, 0.08, 2);
    fillPolygon(ctx, pier, "rgba(122, 92, 61, 0.78)");
    return;
  }

  if (plot.zone === "commerce") {
    drawParkingLines(ctx, metrics, plot);
  }
}

function drawEmptyFoundation(ctx, metrics, plot) {
  const base = getFootprintPoints(metrics, plot.x + 0.5, plot.y + 0.52, 0.27, 0.23, 2);
  fillPolygon(ctx, base, "rgba(255, 255, 255, 0.28)");
  strokePolygon(ctx, base, "rgba(44, 82, 68, 0.24)", 2);
}

function drawBuilding(ctx, metrics, plot, property, timestamp) {
  const typeKey = getPropertyTypeKey(property);
  const level = Math.min(property.level, 6);
  const palettes = {
    housing: { front: "#78aa84", side: "#5e8a6b", sideDark: "#4d735d", top: "#d9e7d9", window: "#fff0a7", accent: "#35634e" },
    office: { front: "#6b91c8", side: "#456da5", sideDark: "#365989", top: "#c9def4", window: "#dff6ff", accent: "#254b78" },
    retail: { front: "#cf8d43", side: "#a8672e", sideDark: "#834f2a", top: "#f1d3a4", window: "#fff0be", accent: "#743b25" }
  };
  const palette = palettes[typeKey] || palettes.housing;
  const height = metrics.tileW * (typeKey === "office" ? 0.95 + level * 0.28 : typeKey === "retail" ? 0.5 + level * 0.12 : 0.7 + level * 0.18);
  const footprint = typeKey === "retail"
    ? { halfX: 0.36, halfY: 0.3 }
    : typeKey === "office"
      ? { halfX: 0.24, halfY: 0.25 }
      : { halfX: 0.29, halfY: 0.27 };

  const centerX = plot.x + 0.5;
  const centerY = plot.y + 0.52;
  const rows = typeKey === "retail" ? 2 + level : Math.max(4, Math.round(height / 20));
  const cols = typeKey === "office" ? 4 : 3;

  drawPrism(ctx, metrics, {
    centerX,
    centerY,
    halfX: footprint.halfX,
    halfY: footprint.halfY,
    height,
    palette,
    rows,
    cols
  });

  if (typeKey === "office") {
    drawOfficeAntenna(ctx, metrics, centerX, centerY, height, palette.accent);
  }

  if (typeKey === "retail") {
    drawRetailAwning(ctx, metrics, centerX, centerY, footprint.halfX, footprint.halfY, height);
  }

  if (typeKey === "housing") {
    drawTree(ctx, metrics, plot.x + 0.22, plot.y + 0.73, 0.64);
  }

  if (state.quarter - property.createdAtQuarter <= 1) {
    drawConstructionSpark(ctx, metrics, centerX, centerY, height, timestamp);
  }

  drawBuildingLabel(ctx, metrics, centerX, centerY, height, `${getShortTypeLabel(property)}-${property.id}`);
}

function drawPrism(ctx, metrics, options) {
  const base = getFootprintPoints(metrics, options.centerX, options.centerY, options.halfX, options.halfY, 0);
  const top = getFootprintPoints(metrics, options.centerX, options.centerY, options.halfX, options.halfY, options.height);

  fillPolygon(ctx, offsetPoints(base, 14, 22), "rgba(26, 43, 39, 0.18)");
  fillPolygon(ctx, [base[0], base[3], top[3], top[0]], options.palette.sideDark);
  fillPolygon(ctx, [base[1], base[2], top[2], top[1]], options.palette.side);
  fillPolygon(ctx, [base[3], base[2], top[2], top[3]], options.palette.front);
  fillPolygon(ctx, top, options.palette.top);

  drawWindowGrid(ctx, base[3], base[2], top[2], top[3], options.rows, options.cols, options.palette.window);
  drawWindowGrid(ctx, base[1], base[2], top[2], top[1], options.rows, 2, "rgba(218, 244, 255, 0.62)");
  strokePolygon(ctx, top, "rgba(255, 255, 255, 0.5)", 1);
}

function drawWindowGrid(ctx, bottomLeft, bottomRight, topRight, topLeft, rows, cols, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.86;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const u1 = (col + 0.22) / cols;
      const u2 = (col + 0.62) / cols;
      const v1 = (row + 0.2) / (rows + 0.4);
      const v2 = (row + 0.48) / (rows + 0.4);
      const windowPoints = [
        bilinearPoint(bottomLeft, bottomRight, topRight, topLeft, u1, v1),
        bilinearPoint(bottomLeft, bottomRight, topRight, topLeft, u2, v1),
        bilinearPoint(bottomLeft, bottomRight, topRight, topLeft, u2, v2),
        bilinearPoint(bottomLeft, bottomRight, topRight, topLeft, u1, v2)
      ];
      fillPolygon(ctx, windowPoints, color);
    }
  }

  ctx.restore();
}

function drawOfficeAntenna(ctx, metrics, centerX, centerY, height, color) {
  const roof = projectCityPoint(metrics, centerX, centerY, height);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(roof.x, roof.y);
  ctx.lineTo(roof.x, roof.y - metrics.tileW * 0.22);
  ctx.stroke();
  ctx.fillStyle = "#f3c75d";
  ctx.beginPath();
  ctx.arc(roof.x, roof.y - metrics.tileW * 0.23, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRetailAwning(ctx, metrics, centerX, centerY, halfX, halfY, height) {
  const frontLeft = projectCityPoint(metrics, centerX - halfX, centerY + halfY, height * 0.42);
  const frontRight = projectCityPoint(metrics, centerX + halfX, centerY + halfY, height * 0.42);

  ctx.save();
  ctx.strokeStyle = "#f7e2a8";
  ctx.lineWidth = Math.max(5, metrics.tileW * 0.055);
  ctx.beginPath();
  ctx.moveTo(frontLeft.x, frontLeft.y);
  ctx.lineTo(frontRight.x, frontRight.y);
  ctx.stroke();
  ctx.restore();
}

function drawBuildingLabel(ctx, metrics, centerX, centerY, height, label) {
  const point = projectCityPoint(metrics, centerX, centerY, height + metrics.tileW * 0.14);
  ctx.save();
  ctx.font = `800 ${Math.max(10, metrics.tileW * 0.11)}px Trebuchet MS, sans-serif`;
  const width = ctx.measureText(label).width + 16;
  const heightBox = 22;
  drawRoundedRect(ctx, point.x - width / 2, point.y - heightBox / 2, width, heightBox, 9, "rgba(255, 255, 255, 0.9)", "rgba(30, 54, 45, 0.1)");
  ctx.fillStyle = "#173126";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, point.x, point.y + 0.5);
  ctx.restore();
}

function drawConstructionSpark(ctx, metrics, centerX, centerY, height, timestamp) {
  const point = projectCityPoint(metrics, centerX + 0.18, centerY - 0.16, height * 0.72);
  const pulse = Math.sin(timestamp / 120) * 0.5 + 0.5;
  ctx.save();
  ctx.strokeStyle = `rgba(245, 190, 71, ${0.35 + pulse * 0.45})`;
  ctx.lineWidth = 2;

  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5 + timestamp / 460;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + Math.cos(angle) * 15, point.y + Math.sin(angle) * 15);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSoldLot(ctx, metrics, plot) {
  const base = getFootprintPoints(metrics, plot.x + 0.5, plot.y + 0.52, 0.32, 0.24, 3);
  fillPolygon(ctx, base, "rgba(160, 156, 143, 0.86)");
  strokePolygon(ctx, base, "rgba(95, 91, 83, 0.6)", 2);

  const sign = projectCityPoint(metrics, plot.x + 0.5, plot.y + 0.5, metrics.tileW * 0.35);
  drawRoundedRect(ctx, sign.x - 25, sign.y - 11, 50, 22, 6, "#b64b43", "rgba(255,255,255,0.4)");
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 10px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SOLD", sign.x, sign.y);
  ctx.restore();
}

function drawParkingLines(ctx, metrics, plot) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.44)";
  ctx.lineWidth = 1.5;

  for (let index = 0; index < 4; index += 1) {
    const from = projectCityPoint(metrics, plot.x + 0.18 + index * 0.15, plot.y + 0.72);
    const to = projectCityPoint(metrics, plot.x + 0.28 + index * 0.15, plot.y + 0.84);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTree(ctx, metrics, x, y, scale = 1) {
  const base = projectCityPoint(metrics, x, y, 0);
  const trunkHeight = metrics.tileW * 0.14 * scale;
  const crown = metrics.tileW * 0.13 * scale;

  ctx.save();
  ctx.fillStyle = "#7a5733";
  ctx.fillRect(base.x - 2 * scale, base.y - trunkHeight, 4 * scale, trunkHeight);
  ctx.fillStyle = "#4e965c";
  ctx.beginPath();
  ctx.ellipse(base.x, base.y - trunkHeight - crown * 0.25, crown, crown * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.arc(base.x - crown * 0.28, base.y - trunkHeight - crown * 0.5, crown * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCar(ctx, metrics, position, nextPosition, color) {
  const point = projectCityPoint(metrics, position.x, position.y, 5);
  const next = projectCityPoint(metrics, nextPosition.x, nextPosition.y, 5);
  const angle = Math.atan2(next.y - point.y, next.x - point.x);
  const width = metrics.tileW * 0.31;
  const height = metrics.tileW * 0.16;

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  drawRoundedRect(ctx, -width / 2, -height / 2, width, height, height * 0.35, color, "rgba(20, 36, 34, 0.25)");
  drawRoundedRect(ctx, -width * 0.12, -height * 0.42, width * 0.33, height * 0.84, height * 0.2, "rgba(213, 237, 244, 0.85)", "transparent");
  ctx.fillStyle = "#222f31";
  ctx.beginPath();
  ctx.arc(-width * 0.28, height * 0.52, height * 0.22, 0, Math.PI * 2);
  ctx.arc(width * 0.28, height * 0.52, height * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCityForeground(ctx, metrics, timestamp) {
  if (citySceneCache.scene.className !== "city-map--culture") {
    return;
  }

  ctx.save();
  ctx.globalAlpha = 0.75;

  for (let index = 0; index < 18; index += 1) {
    const x = (index * 83 + timestamp / 18) % metrics.width;
    const y = 48 + ((index * 37 + timestamp / 34) % (metrics.height * 0.55));
    ctx.fillStyle = index % 2 ? "#d68c2d" : "#2b8b57";
    ctx.fillRect(x, y, 4, 9);
  }

  ctx.restore();
}

function getCityPlotAt(x, y) {
  return CITY_PLOTS.find((plot) => plot.x === x && plot.y === y);
}

function getRoutePosition(route, timestamp) {
  const segments = [];
  let totalLength = 0;

  for (let index = 0; index < route.points.length - 1; index += 1) {
    const from = route.points[index];
    const to = route.points[index + 1];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    segments.push({ from, to, length });
    totalLength += length;
  }

  let distance = ((timestamp * route.speed + route.offset) % 1) * totalLength;

  for (const segment of segments) {
    if (distance <= segment.length) {
      const progress = segment.length ? distance / segment.length : 0;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * progress,
        y: segment.from.y + (segment.to.y - segment.from.y) * progress
      };
    }
    distance -= segment.length;
  }

  return route.points[0];
}

function handleCityPointerMove(event) {
  if (!elements.cityCanvas || !elements.cityTooltip) {
    return;
  }

  const rect = elements.cityCanvas.getBoundingClientRect();
  const point = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  const hit = [...cityHitAreas].reverse().find((area) => pointInPolygon(point, area.polygon));

  if (!hit) {
    hideCityTooltip();
    elements.cityCanvas.style.cursor = "default";
    return;
  }

  elements.cityCanvas.style.cursor = "pointer";
  const propertyText = hit.property
    ? `${hit.property.name}, уровень ${hit.property.level}, статус: ${hit.property.status === "active" ? "активен" : "продан"}`
    : "Свободный участок для будущей застройки";

  elements.cityTooltip.hidden = false;
  elements.cityTooltip.style.left = `${Math.min(point.x + 18, rect.width - 240)}px`;
  elements.cityTooltip.style.top = `${Math.max(12, point.y - 20)}px`;
  elements.cityTooltip.innerHTML = `
    <strong>${escapeHtml(hit.plot.name)}</strong>
    <span>${escapeHtml(propertyText)}</span>
  `;
}

function hideCityTooltip() {
  if (elements.cityTooltip) {
    elements.cityTooltip.hidden = true;
  }
}

function pointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const current = polygon[i];
    const previous = polygon[j];
    const intersects = current.y > point.y !== previous.y > point.y
      && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function fillPolygon(ctx, points, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function strokePolygon(ctx, points, strokeStyle, lineWidth = 1) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function offsetPoints(points, x, y) {
  return points.map((point) => ({ x: point.x + x, y: point.y + y }));
}

function bilinearPoint(bottomLeft, bottomRight, topRight, topLeft, u, v) {
  const left = lerpPoint(bottomLeft, topLeft, v);
  const right = lerpPoint(bottomRight, topRight, v);
  return lerpPoint(left, right, u);
}

function lerpPoint(from, to, progress) {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress
  };
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle) {
  ctx.save();
  ctx.beginPath();

  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  ctx.fillStyle = fillStyle;
  ctx.fill();

  if (strokeStyle && strokeStyle !== "transparent") {
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }

  ctx.restore();
}

function renderCityMarketBoard() {
  const activeProperties = getActiveProperties();
  const portfolioLoad = clamp(Math.round((activeProperties.length / CITY_PLOTS.length) * 100), 0, 100);
  const creditPressure = state.loan.active ? clamp(Math.round((state.loan.remainingPayments / LOAN_TERM) * 100), 0, 100) : 0;
  const rateComfort = clamp(Math.round(((25 - state.interestRate) / 24) * 100), 0, 100);

  elements.cityMarketBoard.innerHTML = `
    <h4>Пульс района</h4>
    ${renderMeter("Спрос", state.demand, `${state.demand}/100`)}
    ${renderMeter("Репутация", state.reputation, `${state.reputation}/100`)}
    ${renderMeter("Комфорт ставки", rateComfort, `${state.interestRate}%`)}
    ${renderMeter("Загрузка карты", portfolioLoad, `${activeProperties.length}/${CITY_PLOTS.length}`)}
    ${state.loan.active ? renderMeter("Кредитное давление", creditPressure, `${state.loan.remainingPayments} плат.`) : ""}
  `;
}

function renderQuarterFlowBoard() {
  if (!state.lastQuarterSummary) {
    elements.quarterFlowBoard.innerHTML = `
      <h4>Поток квартала</h4>
      <p>После первого действия здесь появится разбор доходов, расходов, кредита и чистого квартального результата.</p>
    `;
    return;
  }

  const summary = state.lastQuarterSummary;
  elements.quarterFlowBoard.innerHTML = `
    <h4>Поток квартала ${summary.quarter}</h4>
    <div class="flow-grid">
      ${renderFlowItem("Доход", summary.portfolioIncome, "positive")}
      ${renderFlowItem("Расходы", -summary.portfolioExpense, "negative")}
      ${renderFlowItem("Кредит", -summary.loanPayment, summary.loanPayment ? "negative" : "neutral")}
      ${renderFlowItem("Итог", summary.netIncome - summary.loanPayment, summary.netIncome - summary.loanPayment >= 0 ? "positive" : "negative")}
    </div>
  `;
}

function renderVisualEventBoard(scene) {
  if (!state.lastEvent) {
    elements.visualEventBoard.innerHTML = `
      <h4>Событие на карте</h4>
      <p>Рыночные события будут менять цветовой слой города, панели эффектов и историю кварталов.</p>
    `;
    return;
  }

  elements.visualEventBoard.innerHTML = `
    <h4>${escapeHtml(state.lastEvent.title)}</h4>
    <p>${escapeHtml(state.lastEvent.description)}</p>
    <div class="event-impact-grid">
      ${renderEventImpact("Спрос", state.lastEvent.effect.demand)}
      ${renderEventImpact("Ставка", state.lastEvent.effect.interestRate)}
      ${renderEventImpact("Репутация", state.lastEvent.effect.reputation)}
      ${renderEventImpact("Деньги", state.lastEvent.effect.money, true)}
    </div>
    <p>${escapeHtml(scene.label)}: ${escapeHtml(state.lastEvent.effectText)}</p>
  `;
}

function renderMeter(label, value, displayValue) {
  return `
    <div class="city-meter">
      <div class="city-meter__label">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(displayValue)}</strong>
      </div>
      <div class="city-meter__track">
        <div class="city-meter__fill" style="--value: ${clamp(value, 0, 100)}%"></div>
      </div>
    </div>
  `;
}

function renderFlowItem(label, value, tone) {
  const toneClass = tone === "positive" ? "flow-item--positive" : tone === "negative" ? "flow-item--negative" : "";
  return `
    <div class="flow-item ${toneClass}">
      <span>${escapeHtml(label)}</span>
      <strong>${formatSignedMoney(value)}</strong>
    </div>
  `;
}

function renderEventImpact(label, value, moneyLike = false) {
  const toneClass = value > 0 ? "event-impact--positive" : value < 0 ? "event-impact--negative" : "";
  const displayValue = moneyLike ? formatSignedMoney(value) : formatSignedNumber(value);

  return `
    <div class="event-impact ${toneClass}">
      <span>${escapeHtml(label)}</span>
      <strong>${displayValue}</strong>
    </div>
  `;
}

function getEventScene(eventItem) {
  if (!eventItem) {
    return {
      className: "",
      label: "Рынок в ожидании",
      description: "Пока не было квартального события. Карта показывает стартовое состояние района."
    };
  }

  const scene = EVENT_SCENE_MAP[eventItem.category] || {
    className: "",
    label: "Рыночный сигнал"
  };

  return {
    className: scene.className,
    label: scene.label,
    description: eventItem.description
  };
}

function getPropertyTypeKey(property) {
  if (property.typeKey) {
    return property.typeKey;
  }

  if (property.type === "Офис") {
    return "office";
  }
  if (property.type === "Ритейл") {
    return "retail";
  }

  return "housing";
}

function getShortTypeLabel(property) {
  const typeKey = getPropertyTypeKey(property);

  if (typeKey === "office") {
    return "ОФ";
  }
  if (typeKey === "retail") {
    return "ТР";
  }

  return "ЖК";
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

        <div class="property-summary-row">
          <div class="property-main-number">
            <span>${isActive ? "Чистая прибыль / квартал" : "Получено при продаже"}</span>
            <strong>${isActive ? formatMoney(netIncome) : formatMoney(salePrice)}</strong>
          </div>
          <div class="property-mini-stat">
            <span>Уровень</span>
            <strong>${property.level}</strong>
          </div>
          <div class="property-mini-stat">
            <span>${isActive ? "Цена продажи" : "Статус"}</span>
            <strong>${isActive ? formatMoney(salePrice) : "Закрыт"}</strong>
          </div>
        </div>

        <details class="property-details">
          <summary>Показать расчёты</summary>
          <div class="property-stats">
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
              <span class="property-stat__label">ID объекта</span>
              <span class="property-stat__value">${property.id}</span>
            </div>
          </div>
        </details>

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
  const victoryStatus = getVictoryStatus();
  const averageNetIncome = activeProperties.length
    ? Math.round(activeProperties.reduce((sum, property) => sum + calculateNetIncome(property), 0) / activeProperties.length)
    : 0;
  const lastQuarterText = state.lastQuarterSummary
    ? `Доход ${formatMoney(state.lastQuarterSummary.portfolioIncome)}, расходы ${formatMoney(state.lastQuarterSummary.portfolioExpense)}, кредит ${formatMoney(state.lastQuarterSummary.loanPayment)}.`
    : "Квартал ещё не обработан, показатели находятся в стартовом состоянии.";
  const victoryRequirementsText = victoryStatus.requirements
    .map((requirement) => `${requirement.met ? "Выполнено" : "Нужно"}: ${requirement.label}`)
    .join(". ");

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
      <span>${victoryRequirementsText}.</span>
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
  elements.saveHint.textContent = "Нажмите «Начать новую игру», чтобы запустить симуляцию с первого квартала.";
}

function showGameScreen(scrollIntoView) {
  elements.startScreen.classList.add("is-hidden");
  elements.gameScreen.classList.remove("is-hidden");
  document.body.classList.add("is-playing");
  state.ui.wasGameVisible = true;
  saveGame(true);

  if (scrollIntoView) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function showStartScreen() {
  elements.startScreen.classList.remove("is-hidden");
  elements.gameScreen.classList.add("is-hidden");
  document.body.classList.remove("is-playing");
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
      <span>Улучшенные активы</span>
      <strong>${getImprovedActivePropertyCount()}</strong>
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

function returnToMenuFromModal() {
  closeEndgameModal();
  showStartScreen();
  saveGame(true);
  updateStartScreen();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
      showToast("Не удалось записать текущий прогресс.", "danger");
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
    showToast("Не удалось сбросить текущий прогресс.", "danger");
  }
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

function formatSignedMoney(value) {
  if (!value) {
    return "0";
  }

  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

function formatSignedNumber(value) {
  if (!value) {
    return "0";
  }

  return `${value > 0 ? "+" : ""}${value}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
