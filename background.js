// background.js - OpenRouter (optional) + improved local fallback classifier

const OPENROUTER_ENDPOINT = "https://api.openrouter.ai/v1/chat/completions";

// -------------------------
// CALL OPENROUTER (optional)
// -------------------------
async function callOpenRouter(apiKey, model, prompt) {
  const body = {
    model: model,
    messages: [
      {
        role: "system",
        content:
          "You are a safety classifier for technology-facilitated gender-based violence. Return JSON: {label:'safe'|'abusive'|'uncertain', score:0-1, reasons:[..] } only.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.0,
  };

  const resp = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://shieldai-extension",
      "X-Title": "ShieldAI TFGBV Detector",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const assistant = data?.choices?.[0]?.message?.content || "";
  return assistant;
}

// -------------------------
//  IMPROVED LOCAL CLASSIFIER
//  (Runs offline, no API needed)
// -------------------------
function localClassify(text) {
  const t = String(text || "").toLowerCase();

  const insults = [
    "stupid",
    "idiot",
    "dumb",
    "trash",
    "worthless",
    "pathetic",
    "ugly",
    "loser",
    "disgusting",
  ];

  const emotionalAbuse = [
    "nobody wants you",
    "nobody likes you",
    "kill yourself",
    "you don’t matter",
    "you dont matter",
    "you are nothing",
    "you are useless",
    "you are worthless",
  ];

  const sexual = [
    "nudes",
    "porn",
    "photo",
    "video",
    "deepfake",
    "sex",
    "naked",
    "strip",
    "exposed",
  ];

  const threats = [
    "kill you",
    "i will kill",
    "i'll kill",
    "hurt you",
    "bomb",
    "rape",
    "destroy you",
  ];

  const doxx = [
    "address",
    "phone number",
    "location",
    "dox",
    "doxx",
    "expose",
    "leak your info",
    "share your info",
  ];

  const harassmentVerbs = [
    "harass",
    "bully",
    "shame",
    "threaten",
    "stalk",
    "abuse",
    "abusive",
    "intimidate",
  ];

  let reasons = [];

  function matchCount(list) {
    let c = 0;
    for (const w of list) {
      const re = new RegExp(w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
      if (re.test(t)) c++;
    }
    return c;
  }

  const insultCount = matchCount(insults);
  const emotionalCount = matchCount(emotionalAbuse);
  const sexualCount = matchCount(sexual);
  const threatCount = matchCount(threats);
  const doxxCount = matchCount(doxx);
  const harassCount = matchCount(harassmentVerbs);

  if (insultCount) reasons.push(`insult x${insultCount}`);
  if (emotionalCount) reasons.push(`emotional abuse x${emotionalCount}`);
  if (sexualCount) reasons.push(`sexual x${sexualCount}`);
  if (threatCount) reasons.push(`threat x${threatCount}`);
  if (doxxCount) reasons.push(`doxxing x${doxxCount}`);
  if (harassCount) reasons.push(`harassment x${harassCount}`);

  let score =
    insultCount * 0.25 +
    emotionalCount * 0.4 +
    sexualCount * 0.3 +
    threatCount * 0.5 +
    doxxCount * 0.35 +
    harassCount * 0.3;

  if (/\b(kill|rape|bomb)\b/i.test(t)) {
    score = Math.max(score, 0.75);
    if (!reasons.includes("explicit threat")) reasons.push("explicit threat");
  }

  score = Math.min(score, 1);

  let label = "safe";
  if (score >= 0.4) label = "abusive";
  else if (score >= 0.2) label = "uncertain";

  return {
    label,
    score: Number(score.toFixed(2)),
    reasons: reasons.length ? reasons : ["no abuse patterns matched"],
  };
}

// -------------------------
// MESSAGE HANDLER
// -------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "ANALYZE_TEXT") {
        const kv = await chrome.storage.local.get([
          "openrouter_key",
          "openrouter_model",
        ]);
        const apiKey = kv.openrouter_key;
        const model = kv.openrouter_model || "openai/gpt-4o-mini";

        if (apiKey) {
          try {
            const prompt = `Classify the following text for technology-facilitated gender-based violence (TFGBV). ONLY return JSON. Text: """${message.text}"""`;
            const assistant = await callOpenRouter(apiKey, model, prompt);

            let parsed = null;
            try {
              parsed = JSON.parse(assistant);
            } catch (e) {
              const m = assistant.match(/\{[\s\S]*\}/);
              if (m) parsed = JSON.parse(m[0]);
            }

            if (parsed && parsed.label) {
              sendResponse({
                resultRaw: assistant,
                result: parsed,
                usedFallback: false,
              });
              return;
            }
          } catch (err) {
            console.warn("OpenRouter failed, using local:", err);
          }
        }

        const local = localClassify(message.text);
        sendResponse({
          resultRaw: JSON.stringify(local),
          result: local,
          usedFallback: true,
        });
      } else if (message.type === "SAVE_KEY") {
        await chrome.storage.local.set({
          openrouter_key: message.key,
          openrouter_model: message.model || "openai/gpt-4o-mini",
        });
        sendResponse({ ok: true });
      } else if (message.type === "GET_MODEL_KEY") {
        const kv = await chrome.storage.local.get([
          "openrouter_key",
          "openrouter_model",
        ]);
        sendResponse(kv);
      } else {
        sendResponse({ error: "UNKNOWN_COMMAND" });
      }
    } catch (err) {
      console.error("background error", err);
      sendResponse({ error: err.message || String(err) });
    }
  })();
  return true;
});
