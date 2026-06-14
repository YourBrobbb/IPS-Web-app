// Toast messages, LocalStorage persistence and small formatting/math helpers. Source: script.js lines 3850-3949.

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

function clampDecimal(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function formatSignedPercent(value) {
  const percent = Math.round(value * 100);
  return `${percent > 0 ? "+" : ""}${percent}%`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
