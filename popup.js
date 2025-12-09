document.addEventListener("DOMContentLoaded", () => {
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resultBox = document.getElementById("resultBox");
  const inputText = document.getElementById("inputText");
  const modelSelect = document.getElementById("modelSelect");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveKeyBtn = document.getElementById("saveKeyBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  let lastResultData = null;

  chrome.runtime.sendMessage({ type: "GET_MODEL_KEY" }, (res) => {
    if (res?.openrouter_key) apiKeyInput.value = res.openrouter_key;
    if (res?.openrouter_model) modelSelect.value = res.openrouter_model;
  });

  saveKeyBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { type: "SAVE_KEY", key: apiKeyInput.value, model: modelSelect.value },
      () => alert("API Key Saved!")
    );
  });

  analyzeBtn.addEventListener("click", () => {
    const text = inputText.value.trim();
    if (!text.length) return alert("Enter text to analyze.");

    resultBox.textContent = "Analyzing...";

    chrome.runtime.sendMessage({ type: "ANALYZE_TEXT", text }, (response) => {
      if (!response || !response.result) {
        resultBox.textContent = "Error analyzing text.";
        return;
      }
      const result = response.result;
      lastResultData = result;

      let color = "black";
      if (result.label === "abusive") color = "red";
      else if (result.label === "uncertain") color = "orange";
      else color = "green";

      resultBox.innerHTML = `
        <strong style="color:${color}; font-size:16px;">
          Label: ${result.label.toUpperCase()}
        </strong><br>
        <strong>Score:</strong> ${result.score}<br>
        <strong>Reasons:</strong>
        <ul>${result.reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
        <small style="opacity:0.6;">${
          response.usedFallback ? "(Local classifier)" : "(AI model)"
        }</small>
      `;

      downloadBtn.style.display = "block";
    });
  });

  downloadBtn.addEventListener("click", () => {
    if (!lastResultData) return;

    const report = {
      timestamp: new Date().toISOString(),
      analyzedText: inputText.value,
      ...lastResultData,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ShieldAI_Report.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});
