// Core game engine: state creation, actions, quarters, economy and outcomes. Source: script.js lines 379-945.
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
  migratePropertyPlots(normalizedState.properties);
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
  cancelBuildingPlacement(true);
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
  cancelBuildingPlacement(true);
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

  cancelBuildingPlacement(true);
  const actionResult = actionHandler();
  if (!actionResult.success) {
    showToast(actionResult.message, actionResult.tone || "warning");
    return;
  }

  processQuarter(actionResult.actionLabel);
  showToast(actionResult.message, actionResult.tone || "success");
}

function beginBuildingPlacement(typeKey, options = {}) {
  const config = PROPERTY_TYPES[typeKey];
  if (!config || state.gameOver) {
    showToast("Строительство сейчас недоступно.", "warning");
    return;
  }

  if (state.money < config.baseCost) {
    showToast(`Для строительства нужно ${formatMoney(config.baseCost)}.`, "warning");
    return;
  }

  const availablePlots = getAvailableBuildPlots();
  if (!availablePlots.length) {
    showToast("На карте больше нет свободных участков для строительства.", "warning");
    return;
  }

  const bestPlot = getBestPlotForType(typeKey);
  pendingBuildType = typeKey;
  citySuggestedPlotId = options.suggestedPlotId || (bestPlot ? bestPlot.plotId : null);
  cityHoveredPlotId = citySuggestedPlotId;
  renderActionControls();
  renderCityScene();
  showToast(`Выберите участок на карте для объекта «${config.type}». Наведите курсор, чтобы сравнить бонусы.`, "info");
}

function cancelBuildingPlacement(silent = false) {
  if (!pendingBuildType) {
    return;
  }

  pendingBuildType = null;
  cityHoveredPlotId = null;
  citySuggestedPlotId = null;

  if (!silent && state) {
    renderActionControls();
    renderCityScene();
    showToast("Выбор участка отменён.", "info");
  }
}

function buildProperty(typeKey, plotId) {
  const config = PROPERTY_TYPES[typeKey];
  if (!config) {
    return { success: false, message: "Неизвестный тип недвижимости.", tone: "danger" };
  }

  if (state.money < config.baseCost) {
    return { success: false, message: "Недостаточно денег для строительства.", tone: "warning" };
  }

  const plot = getCityPlotById(plotId);
  if (!plot || !isBuildableCityPlot(plot)) {
    return { success: false, message: "Выберите доступный участок на карте.", tone: "warning" };
  }

  if (getPropertyAtPlot(plotId)) {
    return { success: false, message: "Этот участок уже занят. Выберите другой.", tone: "warning" };
  }

  const evaluation = getPlotEvaluation(plot, typeKey);
  state.money -= config.baseCost;
  state.reputation = clamp(state.reputation + evaluation.reputationEffect, 0, 100);
  state.demand = clamp(state.demand + evaluation.demandEffect, 0, 100);

  const property = createProperty(config, plot, evaluation);
  state.properties.push(property);

  return {
    success: true,
    message: `${property.name} построен в районе «${plot.name}». Доход участка: ${formatSignedPercent(evaluation.incomeMultiplier - 1)}, поток: ${evaluation.demandScore}/100.`,
    tone: "success",
    actionLabel: `Построен объект: ${property.name} • ${plot.name}`
  };
}

function createProperty(config, plot, evaluation) {
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
    plotId: getCityPlotId(plot),
    locationName: plot.name,
    locationDemandAtBuild: evaluation.demandScore,
    locationIncomeAtBuild: evaluation.incomeMultiplier,
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
  const portfolioLocationScore = getPortfolioLocationScore(activeProperties);
  const demandShift = Math.round(
    randomBetween(-2, 2) +
    (state.reputation - 50) / 22 -
    (state.interestRate - 10) / 4 +
    Math.min(activeProperties.length, 4) * 0.5 +
    (portfolioLocationScore - 60) / 20
  );
  const interestShift = randomBetween(-1, 1);
  let reputationShift = 0;

  if (activeProperties.length >= 3) {
    reputationShift += 1;
  }
  if (activeProperties.length >= 2 && portfolioLocationScore >= 72) {
    reputationShift += 1;
  }
  if (activeProperties.length && portfolioLocationScore < 48) {
    reputationShift -= 1;
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
  const locationMultiplier = getPropertyLocationEvaluation(property).incomeMultiplier;
  return property.baseIncome *
    (0.5 + state.demand / 200) *
    (0.7 + state.reputation / 200) *
    levelMultiplier *
    locationMultiplier;
}

function calculateExpense(property) {
  const locationMultiplier = getPropertyLocationEvaluation(property).expenseMultiplier;
  return property.baseExpense * (1 + state.interestRate / 1000) * locationMultiplier;
}

function calculateNetIncome(property) {
  return calculateIncome(property) - calculateExpense(property);
}

function calculateSalePrice(property) {
  const demandMultiplier = 0.72 + state.demand / 250;
  const levelMultiplier = 1 + (property.level - 1) * 0.08;
  const locationMultiplier = getPropertyLocationEvaluation(property).saleMultiplier;
  const holdingQuarters = Math.max(0, state.quarter - property.createdAtQuarter);
  const holdingMultiplier = holdingQuarters >= FULL_PRICE_HOLDING_QUARTERS
    ? 1
    : 1 - EARLY_SALE_DISCOUNT_RATE;
  const transactionMultiplier = 1 - SALE_TRANSACTION_FEE_RATE;

  return property.baseCost * demandMultiplier * levelMultiplier * locationMultiplier * holdingMultiplier * transactionMultiplier;
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
