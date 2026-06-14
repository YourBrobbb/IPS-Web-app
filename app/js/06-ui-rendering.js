// Visual event panels, portfolio cards, summaries, charts, screens and modals. Source: script.js lines 3226-3849.
function renderCityMarketBoard() {
  const activeProperties = getActiveProperties();
  const portfolioLoad = clamp(Math.round((activeProperties.length / CITY_PLOTS.length) * 100), 0, 100);
  const locationScore = Math.round(getPortfolioLocationScore(activeProperties));
  const creditPressure = state.loan.active ? clamp(Math.round((state.loan.remainingPayments / LOAN_TERM) * 100), 0, 100) : 0;
  const rateComfort = clamp(Math.round(((25 - state.interestRate) / 24) * 100), 0, 100);

  elements.cityMarketBoard.innerHTML = `
    <h4>Пульс района</h4>
    ${renderMeter("Спрос", state.demand, `${state.demand}/100`)}
    ${renderMeter("Репутация", state.reputation, `${state.reputation}/100`)}
    ${renderMeter("Комфорт ставки", rateComfort, `${state.interestRate}%`)}
    ${renderMeter("Качество локаций", locationScore, `${locationScore}/100`)}
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
    const location = getPropertyLocationEvaluation(property);
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
          <div class="property-mini-stat">
            <span>Локация</span>
            <strong>${location.demandScore}/100</strong>
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
              <span class="property-stat__label">Район</span>
              <span class="property-stat__value">${escapeHtml(location.plotName)}</span>
            </div>
            <div class="property-stat">
              <span class="property-stat__label">Бонус дохода локации</span>
              <span class="property-stat__value">${formatSignedPercent(location.incomeMultiplier - 1)}</span>
            </div>
            <div class="property-stat">
              <span class="property-stat__label">Поток района</span>
              <span class="property-stat__value">${location.demandScore}/100</span>
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
            <span>Район: ${escapeHtml(location.plotName)}</span>
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
