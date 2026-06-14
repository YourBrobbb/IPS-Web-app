// Game constants, property definitions, event pool and city map data. Source: script.js lines 1-256.
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

const CITY_PUBLIC_ZONES = new Set(["park", "waterfront"]);

const CITY_ZONE_PROFILES = {
  residential: {
    label: "Жилой район",
    baseDemand: 62,
    reputationEffect: 1,
    expenseBonus: 0,
    incomeBonus: { housing: 0.1, office: -0.06, retail: 0.04 }
  },
  business: {
    label: "Деловой район",
    baseDemand: 61,
    reputationEffect: 0,
    expenseBonus: 0.02,
    incomeBonus: { housing: -0.08, office: 0.14, retail: 0.06 }
  },
  commerce: {
    label: "Торговый район",
    baseDemand: 68,
    reputationEffect: 0,
    expenseBonus: 0.015,
    incomeBonus: { housing: -0.05, office: 0.04, retail: 0.16 }
  },
  park: {
    label: "Городской парк",
    baseDemand: 76,
    reputationEffect: 0,
    expenseBonus: 0,
    incomeBonus: { housing: 0, office: 0, retail: 0 }
  },
  waterfront: {
    label: "Городской променад",
    baseDemand: 72,
    reputationEffect: 0,
    expenseBonus: 0,
    incomeBonus: { housing: 0, office: 0, retail: 0 }
  }
};

const CITY_ROADS = [
  ...Array.from({ length: CITY_GRID.columns }, (_, x) => ({ x, y: 3 })),
  ...Array.from({ length: CITY_GRID.columns }, (_, x) => ({ x, y: 6 })),
  ...Array.from({ length: CITY_GRID.rows }, (_, y) => ({ x: 2, y })),
  ...Array.from({ length: CITY_GRID.rows }, (_, y) => ({ x: 5, y }))
];

const CITY_ROAD_KEYS = new Set(CITY_ROADS.map((road) => `${road.x}:${road.y}`));

const CITY_TRAFFIC_ROUTES = [
  {
    color: "#df5b4f",
    speed: 0.000032,
    offset: 0,
    size: 0.9,
    points: [{ x: 0.5, y: 3.5 }, { x: 8.5, y: 3.5 }]
  },
  {
    color: "#e7b84a",
    speed: 0.000027,
    offset: 0.32,
    size: 0.82,
    points: [{ x: 8.5, y: 6.5 }, { x: 0.5, y: 6.5 }]
  },
  {
    color: "#4b83cf",
    speed: 0.000029,
    offset: 0.58,
    size: 0.86,
    points: [{ x: 2.5, y: 0.5 }, { x: 2.5, y: 7.5 }]
  },
  {
    color: "#f6f0df",
    speed: 0.000024,
    offset: 0.77,
    size: 0.74,
    points: [{ x: 5.5, y: 7.5 }, { x: 5.5, y: 0.5 }]
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
