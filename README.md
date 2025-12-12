# ShieldAI – TFGBV Detection Chrome Extension

A Chrome extension that detects Technology-Facilitated Gender-Based Violence (TFGBV) in text and generates downloadable evidence reports.

---

## Demo Video
[![Watch the Demo](https://img.shields.io/badge/▶-Watch%20on%20YouTube-red?style=for-the-badge)](https://youtu.be/00aQsbEvpR4?si=UEyYdhzP7IO5ioUB)

---

## Overview

ShieldAI is a browser extension that analyzes text for signs of Technology-Facilitated Gender-Based Violence (TFGBV).  
It identifies harassment, threats, coercion, emotional manipulation, sexual exploitation, and doxxing attempts.

ShieldAI works in two modes:
- Offline: built-in local classifier
- Online: optional AI model integration (GPT-4o mini, Gemini 1.5, etc.)

---

## Why ShieldAI Is Needed

Many users can see a harmful message but still do not understand:
- That it is digital abuse
- The severity of the behavior
- Hidden manipulation or coercion
- Whether it counts as a threat
- That evidence is required for reporting

ShieldAI provides:
- Clear classification of the message
- The reasons why it is harmful
- A severity score
- A downloadable JSON evidence report

This helps users recognize abuse early and act safely.

---

## Key Features

- Detects TFGBV in any text
- Classifies messages as Safe, Uncertain, or Abusive
- Provides a severity score (0.0–1.0)
- Lists reasons for classification
- Downloadable JSON evidence report
- Works offline using a local classifier
- Supports online AI models (optional)
- Privacy-first design (manual text input only)

---

## Installation

1. Download or clone this repository.  
2. Open Google Chrome and go to:


chrome://extensions/


3. Enable "Developer Mode".  
4. Click "Load Unpacked".  
5. Select the project folder.

---

## Project Structure
shieldai/
| cocept note

│ manifest.json

│ background.js

│ popup.html

│ popup.js

│ popup.css

│ README.md

└── icons/

    ├── icon16.png
    ├── icon48.png
    └── icon128.png

---

## How to Use

1. Copy any text message you want to analyze.  
2. Open the ShieldAI extension.  
3. Paste the text into the input box.  
4. Click "Analyze".  
5. View the classification, score, and reasons.  
6. Click "Download Report" to save a JSON evidence file.

---

## Example

Input:
You are so stupid, nobody wants you online.


Output:
- Label: Abusive
- Score: 0.45
- Reasons: insult, emotional abuse

---

## Impact

ShieldAI supports safer online spaces by helping users:
- Understand harmful digital behavior
- Recognize manipulation, coercion, and threats
- Document incidents with downloadable reports

It can be used by individuals, schools, NGOs, safety groups, and anyone affected by TFGBV.

---

## License

MIT License

---

## Developer

Amanuel Alemu Zewdu  
Cyber Shield – Hack for Change
