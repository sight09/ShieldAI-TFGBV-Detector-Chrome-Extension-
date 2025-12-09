// content_script.js
let monitoring = false;

// receive toggle from popup via storage change or message
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes?.shield_monitor) {
    monitoring = !!changes.shield_monitor.newValue;
  }
});

// Helper: analyze selected/typed text
async function analyzeText(text) {
  if (!text || text.trim().length === 0) return;
  chrome.runtime.sendMessage({ type: "ANALYZE_TEXT", text }, (resp) => {
    if (resp?.error) {
      console.warn("ShieldAI analyze error", resp.error);
      return;
    }
    // Show small overlay near active element with result
    let label = "unknown";
    let reasons = [];
    if (resp.result) {
      label = resp.result.label || "uncertain";
      reasons = resp.result.reasons || [];
    } else {
      // fallback to raw string
      label = resp.resultRaw ? "uncertain" : "unknown";
    }
    showBadge(label, reasons.join("; "));
  });
}

// Insert small badge overlay
let badgeEl = null;
function showBadge(label, detail) {
  if (!badgeEl) {
    badgeEl = document.createElement("div");
    badgeEl.style.position = "fixed";
    badgeEl.style.right = "12px";
    badgeEl.style.bottom = "12px";
    badgeEl.style.zIndex = 2147483647;
    badgeEl.style.padding = "8px 12px";
    badgeEl.style.borderRadius = "8px";
    badgeEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
    badgeEl.style.fontFamily = "Arial, sans-serif";
    badgeEl.style.fontSize = "13px";
    badgeEl.style.background = "#fff";
    badgeEl.style.color = "#111";
    document.documentElement.appendChild(badgeEl);
  }
  badgeEl.textContent = `ShieldAI: ${label.toUpperCase()}`;
  if (label === "abusive") {
    badgeEl.style.border = "2px solid #e53935";
  } else if (label === "uncertain") {
    badgeEl.style.border = "2px solid #ffb300";
  } else {
    badgeEl.style.border = "2px solid #43a047";
  }
  // auto-hide after 6s
  setTimeout(() => {
    if (badgeEl) badgeEl.remove();
    badgeEl = null;
  }, 6000);
}

// Watch for form submissions and also ctrl+enter presses
document.addEventListener("submit", (ev) => {
  if (!monitoring) return;
  try {
    const target = ev.target;
    const textareas = target.querySelectorAll("textarea, input[type='text']");
    if (textareas && textareas.length > 0) {
      const val = textareas[textareas.length - 1].value;
      analyzeText(val);
    }
  } catch (err) {}
});

// Also global keydown for Ctrl+Enter while monitoring to analyze typed text
document.addEventListener("keydown", (ev) => {
  if (!monitoring) return;
  if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
    const active = document.activeElement;
    if (active && (active.tagName === "TEXTAREA" || (active.tagName === "INPUT" && active.type === "text"))) {
      analyzeText(active.value);
    }
  }
});

// Also provide a simple context menu-like selection analysis on double-click
document.addEventListener("dblclick", () => {
  if (!monitoring) return;
  const sel = window.getSelection().toString();
  if (sel && sel.trim().length) analyzeText(sel);
});
