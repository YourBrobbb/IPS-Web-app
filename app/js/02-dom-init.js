// DOM element cache, initial state holder, startup flow and event bindings. Source: script.js lines 257-378.
const elements = {};
let state = null;
let cityAnimationFrameId = null;
let citySceneCache = null;
let cityHitAreas = [];
let pendingBuildType = null;
let cityHoveredPlotId = null;
let citySuggestedPlotId = null;

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

  elements.buildHousingButton.addEventListener("click", () => beginBuildingPlacement("housing"));
  elements.buildOfficeButton.addEventListener("click", () => beginBuildingPlacement("office"));
  elements.buildRetailButton.addEventListener("click", () => beginBuildingPlacement("retail"));
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
