// Canvas city renderer, buildings, roads, traffic, plot selection and location scoring. Source: script.js lines 1832-3225.
function renderCityScene() {
  if (!elements.cityMap) {
    return;
  }

  const scene = getEventScene(state.lastEvent);
  const orderedProperties = [...state.properties].sort((left, right) => left.id - right.id);
  const propertiesByPlotId = new Map(orderedProperties.filter((property) => property.plotId).map((property) => [property.plotId, property]));
  const hiddenPropertiesCount = Math.max(orderedProperties.length - propertiesByPlotId.size, 0);

  elements.cityMap.className = `city-map city-map--canvas ${scene.className} ${pendingBuildType ? "city-map--placing" : ""}`;
  ensureCityCanvas();
  citySceneCache = {
    scene,
    orderedProperties,
    propertiesByPlotId,
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
  elements.cityCanvas.addEventListener("click", handleCityCanvasClick);
}

function renderCityHud(scene, totalProperties, hiddenPropertiesCount) {
  if (!elements.cityHud) {
    return;
  }

  const activeCount = getActiveProperties().length;
  if (pendingBuildType) {
    const config = PROPERTY_TYPES[pendingBuildType];
    const suggestedPlot = getCityPlotById(citySuggestedPlotId);
    elements.cityHud.innerHTML = `
      <div class="city-hud__placement">
        <span>Режим размещения</span>
        <strong>Выберите участок для объекта «${escapeHtml(config.type)}»</strong>
        <p>На свободных участках показаны поток района и бонус дохода для выбранного типа здания. ${suggestedPlot ? `Советчик выделил район «${escapeHtml(suggestedPlot.name)}».` : ""}</p>
        <button class="button button--secondary button--small" type="button" data-cancel-placement>Отменить выбор</button>
      </div>
    `;
    elements.cityHud.querySelector("[data-cancel-placement]").addEventListener("click", () => cancelBuildingPlacement());
    return;
  }

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
  drawCityTiles(ctx, metrics);
  drawCityItems(ctx, metrics, timestamp);
  drawSceneColorGrade(ctx, metrics);
  drawCityForeground(ctx, metrics);
}

function createCityMetrics(width, height) {
  const tileW = Math.max(56, Math.min(118, width / 8.7, (height - 118) / 4.55));
  const tileH = tileW * 0.54;

  return {
    width,
    height,
    tileW,
    tileH,
    originX: width * 0.52,
    originY: Math.max(88, height * 0.15)
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
  sky.addColorStop(0, "#dcece7");
  sky.addColorStop(0.42, "#f4f2df");
  sky.addColorStop(1, "#c2d7d1");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, metrics.width, metrics.height);

  const cityPlate = [
    projectCityPoint(metrics, -0.6, -0.65),
    projectCityPoint(metrics, CITY_GRID.columns + 0.65, -0.65),
    projectCityPoint(metrics, CITY_GRID.columns + 0.65, CITY_GRID.rows + 0.55),
    projectCityPoint(metrics, -0.6, CITY_GRID.rows + 0.55)
  ];

  ctx.save();
  ctx.shadowColor = "rgba(28, 48, 43, 0.2)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 20;
  fillPolygon(ctx, cityPlate, "rgba(229, 239, 229, 0.68)");
  ctx.restore();

  strokePolygon(ctx, cityPlate, "rgba(255, 255, 255, 0.58)", 2);
}

function drawSceneColorGrade(ctx, metrics) {
  const sceneClass = citySceneCache.scene.className;

  if (sceneClass === "city-map--risk") {
    ctx.fillStyle = "rgba(177, 80, 64, 0.08)";
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    return;
  }

  if (sceneClass === "city-map--finance") {
    const beam = ctx.createLinearGradient(0, 0, metrics.width, metrics.height);
    beam.addColorStop(0, "rgba(69, 112, 184, 0)");
    beam.addColorStop(0.52, "rgba(74, 127, 205, 0.1)");
    beam.addColorStop(1, "rgba(232, 184, 74, 0.08)");
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
    return;
  }

  if (sceneClass === "city-map--growth") {
    const glow = ctx.createRadialGradient(metrics.width * 0.48, metrics.height * 0.44, 80, metrics.width * 0.48, metrics.height * 0.44, metrics.width * 0.7);
    glow.addColorStop(0, "rgba(58, 151, 99, 0.11)");
    glow.addColorStop(1, "rgba(58, 151, 99, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, metrics.width, metrics.height);
  }
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
          property: citySceneCache.propertiesByPlotId.get(getCityPlotId(plot)) || null
        });
      } else {
        drawPlotTile(ctx, points, "empty");
      }
    }
  }
}

function drawRoadTile(ctx, metrics, x, y, points) {
  fillPolygon(ctx, offsetPoints(points, 0, 8), "rgba(20, 35, 34, 0.16)");
  fillPolygon(ctx, points, createPolygonGradient(ctx, points, "#52696b", "#344a4f"));

  drawRoadCurbs(ctx, x, y, points);

  const hasWest = isRoadTile(x - 1, y);
  const hasEast = isRoadTile(x + 1, y);
  const hasNorth = isRoadTile(x, y - 1);
  const hasSouth = isRoadTile(x, y + 1);
  if (hasWest || hasEast) {
    drawRoadLane(ctx, metrics, projectCityPoint(metrics, x + 0.16, y + 0.5), projectCityPoint(metrics, x + 0.84, y + 0.5));
  }

  if (hasNorth || hasSouth) {
    drawRoadLane(ctx, metrics, projectCityPoint(metrics, x + 0.5, y + 0.16), projectCityPoint(metrics, x + 0.5, y + 0.84));
  }

}

function drawRoadCurbs(ctx, x, y, points) {
  const edges = [
    { neighbor: [x, y - 1], from: points[0], to: points[1] },
    { neighbor: [x + 1, y], from: points[1], to: points[2] },
    { neighbor: [x, y + 1], from: points[2], to: points[3] },
    { neighbor: [x - 1, y], from: points[3], to: points[0] }
  ];

  ctx.save();
  ctx.strokeStyle = "rgba(236, 244, 235, 0.78)";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";

  edges.forEach((edge) => {
    if (isRoadTile(edge.neighbor[0], edge.neighbor[1])) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(edge.from.x, edge.from.y);
    ctx.lineTo(edge.to.x, edge.to.y);
    ctx.stroke();
  });

  ctx.restore();
}

function drawRoadLane(ctx, metrics, from, to) {
  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.strokeStyle = "#efe8d4";
  ctx.lineWidth = Math.max(1.4, metrics.tileW * 0.018);
  ctx.setLineDash([metrics.tileW * 0.08, metrics.tileW * 0.08]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawPlotTile(ctx, points, zone) {
  const fills = {
    residential: ["#d7e5d8", "#abcbbc"],
    business: ["#dae5ec", "#b6cad6"],
    commerce: ["#eadbb8", "#d0b06f"],
    park: ["#cbe4a6", "#99c773"],
    waterfront: ["#dbe7da", "#b9d0c3"],
    empty: ["#dce8df", "#bfd4ca"]
  };
  const palette = fills[zone] || fills.empty;
  const parcel = insetPolygon(points, 0.86);

  fillPolygon(ctx, offsetPoints(points, 0, 12), "rgba(31, 52, 45, 0.13)");
  fillPolygon(ctx, points, "#edf3ec");
  fillPolygon(ctx, parcel, createPolygonGradient(ctx, parcel, palette[0], palette[1]));
  strokePolygon(ctx, points, "rgba(255, 255, 255, 0.72)", 1.4);
  strokePolygon(ctx, parcel, "rgba(40, 78, 61, 0.2)", 1.2);
}

function drawCityItems(ctx, metrics, timestamp) {
  const items = CITY_PLOTS.map((plot) => ({
    type: "plot",
    plot,
    property: citySceneCache.propertiesByPlotId.get(getCityPlotId(plot)) || null,
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
        drawCar(ctx, metrics, item.position, item.nextPosition, item.route.color, item.route.size);
        return;
      }

      drawPlotContent(ctx, metrics, item.plot, item.property, timestamp);
    });
}

function drawPlotContent(ctx, metrics, plot, property, timestamp) {
  if (!property) {
    drawZoneDetails(ctx, metrics, plot);
    if (isBuildableCityPlot(plot)) {
      drawEmptyFoundation(ctx, metrics, plot);
      drawPlacementOption(ctx, metrics, plot);
    } else {
      drawPublicSpaceLabel(ctx, metrics, plot);
    }
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
    drawTilePath(ctx, metrics, plot, { x: 0.18, y: 0.62 }, { x: 0.82, y: 0.38 }, "rgba(245, 238, 198, 0.72)", 0.035);
    drawTree(ctx, metrics, plot.x + 0.24, plot.y + 0.36, 0.92);
    drawTree(ctx, metrics, plot.x + 0.62, plot.y + 0.58, 0.76);
    drawTree(ctx, metrics, plot.x + 0.78, plot.y + 0.28, 0.58);
    drawBench(ctx, metrics, plot.x + 0.48, plot.y + 0.66, 0.78);
    return;
  }

  if (plot.zone === "waterfront") {
    drawTilePath(ctx, metrics, plot, { x: 0.18, y: 0.62 }, { x: 0.82, y: 0.38 }, "rgba(246, 240, 215, 0.62)", 0.035);
    drawStreetLight(ctx, metrics, plot.x + 0.24, plot.y + 0.7, 0.7);
    drawTree(ctx, metrics, plot.x + 0.74, plot.y + 0.34, 0.5);
    return;
  }

  if (plot.zone === "business") {
    drawTilePath(ctx, metrics, plot, { x: 0.18, y: 0.76 }, { x: 0.82, y: 0.28 }, "rgba(242, 246, 245, 0.48)", 0.032);
    drawStreetLight(ctx, metrics, plot.x + 0.25, plot.y + 0.7, 0.78);
    drawStreetLight(ctx, metrics, plot.x + 0.76, plot.y + 0.28, 0.7);
    return;
  }

  if (plot.zone === "commerce") {
    drawParkingLines(ctx, metrics, plot);
    drawStreetLight(ctx, metrics, plot.x + 0.26, plot.y + 0.78, 0.72);
    return;
  }

  if (plot.zone === "residential") {
    drawTilePath(ctx, metrics, plot, { x: 0.24, y: 0.74 }, { x: 0.76, y: 0.28 }, "rgba(246, 239, 209, 0.52)", 0.028);
    drawTree(ctx, metrics, plot.x + 0.23, plot.y + 0.38, 0.58);
    drawTree(ctx, metrics, plot.x + 0.78, plot.y + 0.64, 0.54);
  }
}

function drawEmptyFoundation(ctx, metrics, plot) {
  const base = getFootprintPoints(metrics, plot.x + 0.5, plot.y + 0.52, 0.27, 0.23, 2);
  fillPolygon(ctx, offsetPoints(base, 0, 5), "rgba(39, 61, 55, 0.1)");
  fillPolygon(ctx, base, "rgba(255, 255, 255, 0.34)");

  ctx.save();
  ctx.setLineDash([7, 6]);
  strokePolygon(ctx, base, "rgba(44, 82, 68, 0.34)", 2);
  ctx.restore();

  const labelPoint = projectCityPoint(metrics, plot.x + 0.5, plot.y + 0.52, 9);
  ctx.save();
  ctx.font = `800 ${Math.max(8, metrics.tileW * 0.075)}px Trebuchet MS, sans-serif`;
  ctx.fillStyle = "rgba(33, 57, 49, 0.52)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("УЧАСТОК", labelPoint.x, labelPoint.y);
  ctx.restore();
}

function drawPlacementOption(ctx, metrics, plot) {
  if (!pendingBuildType) {
    return;
  }

  const plotId = getCityPlotId(plot);
  const evaluation = getPlotEvaluation(plot, pendingBuildType);
  const isHovered = cityHoveredPlotId === plotId;
  const isSuggested = citySuggestedPlotId === plotId;
  const tile = getTilePoints(metrics, plot.x, plot.y, 5);
  const center = projectCityPoint(metrics, plot.x + 0.5, plot.y + 0.5, 16);

  ctx.save();
  ctx.globalAlpha = isHovered ? 0.72 : isSuggested ? 0.58 : 0.34;
  fillPolygon(ctx, tile, isHovered ? "rgba(255, 220, 113, 0.72)" : isSuggested ? "rgba(105, 205, 139, 0.64)" : "rgba(255, 255, 255, 0.54)");
  strokePolygon(ctx, tile, isHovered ? "#f2b84b" : isSuggested ? "#2b8b57" : "rgba(23, 107, 82, 0.62)", isHovered || isSuggested ? 3 : 1.8);
  ctx.restore();

  const bonusText = formatSignedPercent(evaluation.incomeMultiplier - 1);
  const width = Math.max(78, metrics.tileW * 0.72);
  drawRoundedRect(ctx, center.x - width / 2, center.y - 16, width, 31, 9, isHovered ? "rgba(31, 67, 54, 0.95)" : "rgba(31, 67, 54, 0.84)", "rgba(255, 255, 255, 0.48)");

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.max(8, metrics.tileW * 0.072)}px Trebuchet MS, sans-serif`;
  ctx.fillText(`ПОТОК ${evaluation.demandScore}`, center.x, center.y - 6);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.font = `800 ${Math.max(7, metrics.tileW * 0.061)}px Trebuchet MS, sans-serif`;
  ctx.fillText(`ДОХОД ${bonusText}`, center.x, center.y + 7);
  ctx.restore();
}

function drawPublicSpaceLabel(ctx, metrics, plot) {
  const point = projectCityPoint(metrics, plot.x + 0.5, plot.y + 0.54, 8);
  const label = plot.zone === "park" ? "ПАРК" : "ПРОМЕНАД";
  const fill = plot.zone === "park" ? "rgba(54, 111, 65, 0.74)" : "rgba(57, 101, 90, 0.72)";

  ctx.save();
  ctx.font = `900 ${Math.max(8, metrics.tileW * 0.07)}px Trebuchet MS, sans-serif`;
  const width = ctx.measureText(label).width + 14;
  drawRoundedRect(ctx, point.x - width / 2, point.y - 10, width, 20, 8, fill, "rgba(255, 255, 255, 0.34)");
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, point.x, point.y);
  ctx.restore();
}

function drawBuilding(ctx, metrics, plot, property, timestamp) {
  const typeKey = getPropertyTypeKey(property);
  const level = Math.min(property.level, 6);
  const palettes = {
    housing: { front: "#7eac88", side: "#5e8a6b", sideDark: "#496f58", top: "#dfe7d6", window: "#ffeaa3", accent: "#335d4a" },
    office: { front: "#6e98cf", side: "#476fa8", sideDark: "#365989", top: "#d8e8f7", window: "#e4fbff", accent: "#244a78" },
    retail: { front: "#d39145", side: "#a8672e", sideDark: "#7c4a27", top: "#f2d7a4", window: "#fff2bd", accent: "#743b25" }
  };
  const palette = palettes[typeKey] || palettes.housing;
  const height = metrics.tileW * (typeKey === "office" ? 0.78 + level * 0.2 : typeKey === "retail" ? 0.44 + level * 0.11 : 0.62 + level * 0.16);
  const footprint = typeKey === "retail"
    ? { halfX: 0.38, halfY: 0.29 }
    : typeKey === "office"
      ? { halfX: 0.24, halfY: 0.24 }
      : { halfX: 0.3, halfY: 0.27 };

  const centerX = plot.x + 0.5;
  const centerY = plot.y + 0.52;
  const rows = typeKey === "retail" ? 2 + level : Math.max(4, Math.round(height / 18));
  const cols = typeKey === "office" ? 4 : 3;

  drawBuildingPodium(ctx, metrics, centerX, centerY, footprint.halfX + 0.06, footprint.halfY + 0.05, typeKey);

  if (typeKey === "housing") {
    drawLowWing(ctx, metrics, centerX - 0.16, centerY + 0.02, 0.14, 0.2, height * 0.68, palette);
  }

  const prism = drawPrism(ctx, metrics, {
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
    drawOfficeFacadeHighlights(ctx, prism.base, prism.top);
    drawRooftopEquipment(ctx, metrics, centerX, centerY, height, palette.accent);
    drawOfficeAntenna(ctx, metrics, centerX, centerY, height, palette.accent);
  }

  if (typeKey === "retail") {
    drawRetailAwning(ctx, metrics, centerX, centerY, footprint.halfX, footprint.halfY, height);
    drawRetailSign(ctx, metrics, centerX, centerY, height);
  }

  if (typeKey === "housing") {
    drawHousingBalconies(ctx, prism.base, prism.top, Math.min(5, rows));
    drawTree(ctx, metrics, plot.x + 0.22, plot.y + 0.73, 0.64);
    drawTree(ctx, metrics, plot.x + 0.78, plot.y + 0.35, 0.52);
  }

  if (state.quarter - property.createdAtQuarter <= 1) {
    drawConstructionDetails(ctx, metrics, centerX, centerY, height, timestamp);
  }

  drawBuildingLabel(ctx, metrics, centerX, centerY, height, `${getShortTypeLabel(property)}-${property.id}`);
}

function drawBuildingPodium(ctx, metrics, centerX, centerY, halfX, halfY, typeKey) {
  const palette = {
    housing: "#dfe8d4",
    office: "#dce8ee",
    retail: "#ead6ad"
  };
  const base = getFootprintPoints(metrics, centerX, centerY, halfX, halfY, 0);
  const shadow = getFootprintPoints(metrics, centerX, centerY, halfX + 0.02, halfY + 0.02, 0);

  fillPolygon(ctx, offsetPoints(shadow, 0, 5), "rgba(28, 44, 40, 0.12)");
  fillPolygon(ctx, base, palette[typeKey] || "#dfe8d4");
  strokePolygon(ctx, base, "rgba(255, 255, 255, 0.68)", 1.4);
  strokePolygon(ctx, insetPolygon(base, 0.78), "rgba(54, 83, 72, 0.16)", 1);
}

function drawLowWing(ctx, metrics, centerX, centerY, halfX, halfY, height, palette) {
  drawPrism(ctx, metrics, {
    centerX,
    centerY,
    halfX,
    halfY,
    height,
    palette,
    rows: 3,
    cols: 2
  });
}

function drawPrism(ctx, metrics, options) {
  const base = getFootprintPoints(metrics, options.centerX, options.centerY, options.halfX, options.halfY, 0);
  const top = getFootprintPoints(metrics, options.centerX, options.centerY, options.halfX, options.halfY, options.height);

  fillPolygon(ctx, offsetPoints(base, 6, 8), "rgba(26, 43, 39, 0.18)");
  fillPolygon(ctx, [base[0], base[3], top[3], top[0]], options.palette.sideDark);
  fillPolygon(ctx, [base[1], base[2], top[2], top[1]], options.palette.side);
  fillPolygon(ctx, [base[3], base[2], top[2], top[3]], options.palette.front);
  fillPolygon(ctx, top, options.palette.top);

  drawWindowGrid(ctx, base[3], base[2], top[2], top[3], options.rows, options.cols, options.palette.window);
  drawWindowGrid(ctx, base[1], base[2], top[2], top[1], options.rows, 2, "rgba(218, 244, 255, 0.62)");
  strokePolygon(ctx, top, "rgba(255, 255, 255, 0.5)", 1);
  strokePolygon(ctx, [base[3], base[2], top[2], top[3]], "rgba(255, 255, 255, 0.2)", 1);

  return { base, top };
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

function drawOfficeFacadeHighlights(ctx, base, top) {
  const stripLeft = bilinearPoint(base[3], base[2], top[2], top[3], 0.18, 0.02);
  const stripRight = bilinearPoint(base[3], base[2], top[2], top[3], 0.33, 0.02);
  const stripTopRight = bilinearPoint(base[3], base[2], top[2], top[3], 0.33, 0.98);
  const stripTopLeft = bilinearPoint(base[3], base[2], top[2], top[3], 0.18, 0.98);

  fillPolygon(ctx, [stripLeft, stripRight, stripTopRight, stripTopLeft], "rgba(255, 255, 255, 0.16)");
}

function drawRooftopEquipment(ctx, metrics, centerX, centerY, height, color) {
  const unit = getFootprintPoints(metrics, centerX + 0.08, centerY - 0.05, 0.07, 0.045, height + 2);
  fillPolygon(ctx, unit, "rgba(255, 255, 255, 0.38)");
  strokePolygon(ctx, unit, color, 1.2);
}

function drawHousingBalconies(ctx, base, top, rows) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
  ctx.lineWidth = 1.2;

  for (let row = 1; row <= rows; row += 1) {
    const v = row / (rows + 1);
    for (let col = 0; col < 2; col += 1) {
      const u1 = 0.18 + col * 0.34;
      const u2 = u1 + 0.18;
      const left = bilinearPoint(base[3], base[2], top[2], top[3], u1, v);
      const right = bilinearPoint(base[3], base[2], top[2], top[3], u2, v);
      ctx.beginPath();
      ctx.moveTo(left.x, left.y + 4);
      ctx.lineTo(right.x, right.y + 4);
      ctx.stroke();
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

function drawRetailSign(ctx, metrics, centerX, centerY, height) {
  const point = projectCityPoint(metrics, centerX, centerY + 0.25, height * 0.55);
  const width = Math.max(32, metrics.tileW * 0.32);
  const signHeight = Math.max(13, metrics.tileW * 0.11);

  drawRoundedRect(ctx, point.x - width / 2, point.y - signHeight / 2, width, signHeight, 5, "#f7e1a6", "rgba(116, 59, 37, 0.22)");

  ctx.save();
  ctx.fillStyle = "#743b25";
  ctx.font = `900 ${Math.max(8, metrics.tileW * 0.07)}px Trebuchet MS, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SHOP", point.x, point.y + 0.5);
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

function drawConstructionDetails(ctx, metrics, centerX, centerY, height) {
  const base = projectCityPoint(metrics, centerX + 0.26, centerY - 0.18, 0);
  const top = projectCityPoint(metrics, centerX + 0.26, centerY - 0.18, height * 0.9);
  const armEnd = projectCityPoint(metrics, centerX + 0.58, centerY - 0.18, height * 0.86);

  ctx.save();
  ctx.strokeStyle = "rgba(93, 71, 48, 0.62)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(top.x, top.y);
  ctx.lineTo(armEnd.x, armEnd.y);
  ctx.stroke();
  ctx.fillStyle = "#d6a343";
  ctx.beginPath();
  ctx.arc(armEnd.x, armEnd.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
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

function drawTilePath(ctx, metrics, plot, from, to, color, widthRatio) {
  const start = projectCityPoint(metrics, plot.x + from.x, plot.y + from.y, 3);
  const end = projectCityPoint(metrics, plot.x + to.x, plot.y + to.y, 3);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, metrics.tileW * widthRatio);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

function drawBench(ctx, metrics, x, y, scale = 1) {
  const point = projectCityPoint(metrics, x, y, 5);
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(-0.38);
  drawRoundedRect(ctx, -metrics.tileW * 0.08 * scale, -metrics.tileW * 0.018 * scale, metrics.tileW * 0.16 * scale, metrics.tileW * 0.036 * scale, 3, "#9b663a", "rgba(56, 37, 22, 0.18)");
  ctx.restore();
}

function drawStreetLight(ctx, metrics, x, y, scale = 1) {
  const base = projectCityPoint(metrics, x, y, 0);
  const height = metrics.tileW * 0.22 * scale;

  ctx.save();
  ctx.strokeStyle = "rgba(48, 64, 61, 0.7)";
  ctx.lineWidth = Math.max(1.2, metrics.tileW * 0.012);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(base.x, base.y - height);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 232, 154, 0.88)";
  ctx.beginPath();
  ctx.arc(base.x, base.y - height, metrics.tileW * 0.025 * scale, 0, Math.PI * 2);
  ctx.fill();
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

function drawCar(ctx, metrics, position, nextPosition, color, size = 1) {
  const point = projectCityPoint(metrics, position.x, position.y, 1);
  const next = projectCityPoint(metrics, nextPosition.x, nextPosition.y, 1);
  const angle = Math.atan2(next.y - point.y, next.x - point.x);
  const width = metrics.tileW * 0.24 * size;
  const height = metrics.tileW * 0.115 * size;

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  drawRoundedRect(ctx, -width * 0.56, -height * 0.18, width * 1.12, height * 0.52, height * 0.28, "rgba(12, 27, 28, 0.2)", "transparent");
  drawRoundedRect(ctx, -width / 2, -height / 2, width, height, height * 0.35, color, "rgba(20, 36, 34, 0.25)");
  drawRoundedRect(ctx, -width * 0.12, -height * 0.38, width * 0.32, height * 0.76, height * 0.18, "rgba(213, 237, 244, 0.85)", "transparent");
  ctx.fillStyle = "#222f31";
  ctx.beginPath();
  ctx.arc(-width * 0.28, height * 0.46, height * 0.19, 0, Math.PI * 2);
  ctx.arc(width * 0.28, height * 0.46, height * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCityForeground(ctx, metrics) {
  const vignette = ctx.createRadialGradient(
    metrics.width * 0.5,
    metrics.height * 0.42,
    metrics.width * 0.2,
    metrics.width * 0.5,
    metrics.height * 0.5,
    metrics.width * 0.76
  );
  vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
  vignette.addColorStop(1, "rgba(33, 55, 49, 0.14)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, metrics.width, metrics.height);
}

function getCityPlotAt(x, y) {
  return CITY_PLOTS.find((plot) => plot.x === x && plot.y === y);
}

function getCityPlotId(plot) {
  return `${plot.x}:${plot.y}`;
}

function getCityPlotById(plotId) {
  return CITY_PLOTS.find((plot) => getCityPlotId(plot) === plotId) || null;
}

function isBuildableCityPlot(plot) {
  return Boolean(plot) && !CITY_PUBLIC_ZONES.has(plot.zone);
}

function getPropertyAtPlot(plotId) {
  return state.properties.find((property) => property.plotId === plotId) || null;
}

function getAvailableBuildPlots() {
  return CITY_PLOTS.filter((plot) => isBuildableCityPlot(plot) && !getPropertyAtPlot(getCityPlotId(plot)));
}

function migratePropertyPlots(properties) {
  const assignedPlotIds = new Set();
  const fallbackPlots = [
    ...CITY_PLOTS.filter(isBuildableCityPlot),
    ...CITY_PLOTS.filter((plot) => !isBuildableCityPlot(plot))
  ];

  properties.forEach((property) => {
    const existingPlot = getCityPlotById(property.plotId);
    if (existingPlot && !assignedPlotIds.has(property.plotId)) {
      assignedPlotIds.add(property.plotId);
      property.locationName = property.locationName || existingPlot.name;
      return;
    }

    const fallbackPlot = fallbackPlots.find((plot) => !assignedPlotIds.has(getCityPlotId(plot)));
    if (!fallbackPlot) {
      property.plotId = null;
      return;
    }

    property.plotId = getCityPlotId(fallbackPlot);
    property.locationName = fallbackPlot.name;
    assignedPlotIds.add(property.plotId);
  });
}

function getNearbyCityPlots(plot, maxDistance = 2) {
  return CITY_PLOTS
    .map((candidate) => ({
      plot: candidate,
      distance: Math.abs(candidate.x - plot.x) + Math.abs(candidate.y - plot.y)
    }))
    .filter((item) => item.distance > 0 && item.distance <= maxDistance);
}

function getPlotEvaluation(plotOrId, typeKey, excludedPropertyId = null) {
  const plot = typeof plotOrId === "string" ? getCityPlotById(plotOrId) : plotOrId;
  if (!plot || !typeKey) {
    return getNeutralPlotEvaluation();
  }

  const profile = CITY_ZONE_PROFILES[plot.zone] || CITY_ZONE_PROFILES.residential;
  const propertyTypeLabel = { housing: "жилья", office: "офиса", retail: "ритейла" }[typeKey];
  let demandScore = profile.baseDemand;
  const zoneIncomeBonus = profile.incomeBonus[typeKey] || 0;
  let incomeBonus = zoneIncomeBonus;
  let expenseBonus = profile.expenseBonus || 0;
  let reputationEffect = profile.reputationEffect || 0;
  const reasons = [`${profile.label}: для ${propertyTypeLabel} доход ${formatSignedPercent(zoneIncomeBonus)}.`];
  const nearbyPlots = getNearbyCityPlots(plot);
  const adjacentRoads = [
    [plot.x - 1, plot.y],
    [plot.x + 1, plot.y],
    [plot.x, plot.y - 1],
    [plot.x, plot.y + 1]
  ].filter(([x, y]) => CITY_ROAD_KEYS.has(`${x}:${y}`)).length;

  if (adjacentRoads) {
    const roadDemandBonus = Math.min(adjacentRoads, 3) * 2;
    const roadIncomeBonus = Math.min(adjacentRoads, 2) * 0.01;
    demandScore += roadDemandBonus;
    incomeBonus += roadIncomeBonus;
    reasons.push(`Дороги: ${adjacentRoads} примык., поток +${roadDemandBonus}, доход ${formatSignedPercent(roadIncomeBonus)}.`);
  } else {
    incomeBonus -= 0.05;
    reasons.push("Нет прямого доступа к дороге: доход -5%.");
  }

  let parkCount = 0;
  let parkDemandBonus = 0;
  let parkIncomeBonus = 0;
  let parkReputationBonus = 0;
  let promenadeCount = 0;
  let promenadeDemandBonus = 0;
  let promenadeIncomeBonus = 0;
  let promenadeReputationBonus = 0;

  nearbyPlots.forEach(({ plot: nearbyPlot, distance }) => {
    if (nearbyPlot.zone === "park") {
      parkCount += 1;
      parkDemandBonus += distance === 1 ? 7 : 4;
      parkReputationBonus += distance === 1 ? 2 : 1;
      parkIncomeBonus += getPublicSpaceIncomeBonus("park", typeKey, distance);
    }

    if (nearbyPlot.zone === "waterfront") {
      promenadeCount += 1;
      promenadeDemandBonus += distance === 1 ? 4 : 2;
      promenadeReputationBonus += distance === 1 ? 1 : 0;
      promenadeIncomeBonus += getPublicSpaceIncomeBonus("waterfront", typeKey, distance);
    }
  });

  demandScore += parkDemandBonus + promenadeDemandBonus;
  reputationEffect += parkReputationBonus + promenadeReputationBonus;
  incomeBonus += parkIncomeBonus + promenadeIncomeBonus;

  if (parkCount) {
    reasons.push(`Парки рядом: ${parkCount}, поток +${parkDemandBonus}, доход ${formatSignedPercent(parkIncomeBonus)}, репутация +${parkReputationBonus}.`);
  }
  if (promenadeCount) {
    reasons.push(`Променады рядом: ${promenadeCount}, поток +${promenadeDemandBonus}, доход ${formatSignedPercent(promenadeIncomeBonus)}, репутация +${promenadeReputationBonus}.`);
  }

  const nearbyActiveProperties = getActiveProperties()
    .filter((property) => property.id !== excludedPropertyId)
    .map((property) => ({
      property,
      plot: getCityPlotById(property.plotId)
    }))
    .filter((item) => item.plot)
    .map((item) => ({
      ...item,
      distance: Math.abs(item.plot.x - plot.x) + Math.abs(item.plot.y - plot.y)
    }))
    .filter((item) => item.distance > 0 && item.distance <= 2);

  nearbyActiveProperties.forEach(({ property, distance }) => {
    const nearbyType = getPropertyTypeKey(property);
    demandScore += distance === 1 ? 2 : 1;

    if (nearbyType === "housing") {
      incomeBonus += typeKey === "retail" ? 0.035 : typeKey === "housing" ? 0.012 : 0;
    }
    if (nearbyType === "office") {
      incomeBonus += typeKey === "office" ? 0.025 : typeKey === "retail" ? 0.02 : typeKey === "housing" ? -0.01 : 0;
    }
    if (nearbyType === "retail") {
      incomeBonus += typeKey === "office" ? 0.01 : typeKey === "housing" ? -0.01 : -0.005;
    }
  });

  if (nearbyActiveProperties.length) {
    reasons.push(`Соседние объекты: ${nearbyActiveProperties.length}, их аудитория влияет на поток и доход.`);
  }

  const sameTypeNeighbors = nearbyActiveProperties.filter((item) => getPropertyTypeKey(item.property) === typeKey).length;
  if (sameTypeNeighbors > 2) {
    const overDensity = sameTypeNeighbors - 2;
    demandScore -= overDensity * 2;
    incomeBonus -= overDensity * 0.025;
    expenseBonus += overDensity * 0.01;
    reputationEffect -= overDensity;
    reasons.push("Плотная однотипная застройка: растёт конкуренция.");
  }

  const demand = clamp(Math.round(demandScore), 30, 96);
  const incomeMultiplier = clampDecimal(1 + incomeBonus, 0.78, 1.38);
  const expenseMultiplier = clampDecimal(1 + expenseBonus, 0.94, 1.16);
  const saleMultiplier = clampDecimal(0.9 + (demand - 50) / 250, 0.84, 1.15);
  const localReputationEffect = clamp(Math.round(reputationEffect), -2, 4);
  const demandEffect = clamp(Math.round((demand - 58) / 12), -2, 3);
  const rating = clamp(Math.round(demand + (incomeMultiplier - 1) * 65 + localReputationEffect * 2), 0, 100);

  return {
    plotId: getCityPlotId(plot),
    plotName: plot.name,
    zone: plot.zone,
    zoneLabel: profile.label,
    demandScore: demand,
    rating,
    incomeMultiplier,
    expenseMultiplier,
    saleMultiplier,
    reputationEffect: localReputationEffect,
    demandEffect,
    reasons: [...new Set(reasons)].slice(0, 6)
  };
}

function getPublicSpaceIncomeBonus(zone, typeKey, distance) {
  const distanceMultiplier = distance === 1 ? 1 : 0.5;

  if (zone === "park") {
    const parkBonus = typeKey === "housing" ? 0.05 : typeKey === "retail" ? 0.02 : 0.01;
    return parkBonus * distanceMultiplier;
  }

  const promenadeBonus = typeKey === "housing" ? 0.035 : 0.015;
  return promenadeBonus * distanceMultiplier;
}

function getNeutralPlotEvaluation() {
  return {
    plotId: null,
    plotName: "Участок не задан",
    zone: "unknown",
    zoneLabel: "Без района",
    demandScore: 50,
    rating: 50,
    incomeMultiplier: 1,
    expenseMultiplier: 1,
    saleMultiplier: 1,
    reputationEffect: 0,
    demandEffect: 0,
    reasons: ["Для объекта не задан участок."]
  };
}

function getPropertyLocationEvaluation(property) {
  return property.plotId
    ? getPlotEvaluation(property.plotId, getPropertyTypeKey(property), property.id)
    : getNeutralPlotEvaluation();
}

function getBestPlotForType(typeKey) {
  const config = PROPERTY_TYPES[typeKey];
  if (!config) {
    return null;
  }

  return getAvailableBuildPlots()
    .map((plot) => {
      const evaluation = getPlotEvaluation(plot, typeKey);
      return {
        plot,
        plotId: getCityPlotId(plot),
        evaluation,
        projectedNetIncome: calculateProjectedNetIncome(config, 1, evaluation)
      };
    })
    .sort((left, right) => right.projectedNetIncome - left.projectedNetIncome || right.evaluation.rating - left.evaluation.rating)[0] || null;
}

function getPortfolioLocationScore(activeProperties = getActiveProperties()) {
  if (!activeProperties.length) {
    return 60;
  }

  const total = activeProperties.reduce((sum, property) => sum + getPropertyLocationEvaluation(property).rating, 0);
  return total / activeProperties.length;
}

function isRoadTile(x, y) {
  return CITY_ROAD_KEYS.has(`${x}:${y}`);
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
    cityHoveredPlotId = null;
    return;
  }

  const plotId = getCityPlotId(hit.plot);
  cityHoveredPlotId = plotId;
  const canPlaceBuilding = pendingBuildType && !hit.property && isBuildableCityPlot(hit.plot);
  elements.cityCanvas.style.cursor = canPlaceBuilding ? "crosshair" : "pointer";
  const tooltipContent = getCityTooltipContent(hit);

  elements.cityTooltip.innerHTML = tooltipContent;
  elements.cityTooltip.hidden = false;

  const tooltipWidth = elements.cityTooltip.offsetWidth || 280;
  const tooltipHeight = elements.cityTooltip.offsetHeight || 180;
  elements.cityTooltip.style.left = `${Math.max(12, Math.min(point.x + 18, rect.width - tooltipWidth - 12))}px`;
  elements.cityTooltip.style.top = `${Math.max(12, Math.min(point.y - 20, rect.height - tooltipHeight - 12))}px`;
}

function handleCityCanvasClick(event) {
  if (!pendingBuildType) {
    return;
  }

  const rect = elements.cityCanvas.getBoundingClientRect();
  const point = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  const hit = [...cityHitAreas].reverse().find((area) => pointInPolygon(point, area.polygon));
  if (!hit) {
    return;
  }

  if (!isBuildableCityPlot(hit.plot)) {
    showToast("Это общественная зона. Она повышает привлекательность соседних участков, но застраивать её нельзя.", "warning");
    return;
  }

  if (hit.property) {
    showToast("Участок уже занят. Выберите свободную площадку.", "warning");
    return;
  }

  const typeKey = pendingBuildType;
  const plotId = getCityPlotId(hit.plot);
  cityHoveredPlotId = null;
  performAction(() => buildProperty(typeKey, plotId));
}

function getCityTooltipContent(hit) {
  const plotId = getCityPlotId(hit.plot);
  const profile = CITY_ZONE_PROFILES[hit.plot.zone] || CITY_ZONE_PROFILES.residential;

  if (hit.property) {
    const evaluation = getPropertyLocationEvaluation(hit.property);
    return `
      <strong>${escapeHtml(hit.property.name)}</strong>
      <span>${escapeHtml(hit.plot.name)} • ${escapeHtml(profile.label)}</span>
      <div class="city-tooltip__metrics">
        <b>Поток района ${evaluation.demandScore}/100</b>
        <b>Доход ${escapeHtml(formatSignedPercent(evaluation.incomeMultiplier - 1))}</b>
      </div>
      <small>Уровень ${hit.property.level} • ${hit.property.status === "active" ? "активен" : "продан"}</small>
    `;
  }

  if (!isBuildableCityPlot(hit.plot)) {
    return `
      <strong>${escapeHtml(hit.plot.name)}</strong>
      <span>${escapeHtml(profile.label)}. Общественная зона: строить здесь нельзя, но она повышает привлекательность участков рядом.</span>
    `;
  }

  if (!pendingBuildType) {
    return `
      <strong>${escapeHtml(hit.plot.name)}</strong>
      <span>${escapeHtml(profile.label)}. Свободный участок для будущей застройки.</span>
    `;
  }

  const evaluation = getPlotEvaluation(hit.plot, pendingBuildType);
  return `
    <strong>${escapeHtml(hit.plot.name)}</strong>
    <span>${escapeHtml(evaluation.zoneLabel)} • рейтинг ${evaluation.rating}/100</span>
    <div class="city-tooltip__metrics">
      <b>Поток ${evaluation.demandScore}/100</b>
      <b>Доход ${escapeHtml(formatSignedPercent(evaluation.incomeMultiplier - 1))}</b>
      <b>Репутация ${escapeHtml(formatSignedNumber(evaluation.reputationEffect))}</b>
      <b>Рынок ${escapeHtml(formatSignedNumber(evaluation.demandEffect))}</b>
    </div>
    <small>${evaluation.reasons.map(escapeHtml).join(" ")}</small>
    <em>Нажмите, чтобы построить здесь.</em>
  `;
}

function hideCityTooltip() {
  if (elements.cityTooltip) {
    elements.cityTooltip.hidden = true;
  }
  cityHoveredPlotId = null;
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

function insetPolygon(points, factor) {
  const center = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x / points.length,
      y: accumulator.y + point.y / points.length
    }),
    { x: 0, y: 0 }
  );

  return points.map((point) => ({
    x: center.x + (point.x - center.x) * factor,
    y: center.y + (point.y - center.y) * factor
  }));
}

function createPolygonGradient(ctx, points, topColor, bottomColor) {
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y));
  const gradient = ctx.createLinearGradient(0, top, 0, bottom);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  return gradient;
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
