import { buzzwords } from './buzzwords.js';

const output = document.getElementById('slop-output');
const sparkline = document.getElementById('sparkline');
const mode = document.getElementById('parody-mode');
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let busy = false;

function renderMeaninglessChart() {
  // ארבע בניות מלאות; רק האחרונה נשארת. אין קשר לנתוני המשתמש.
  for (let pass = 0; pass < (mode.checked ? 4 : 1); pass++) {
    sparkline.replaceChildren();
    for (let index = 0; index < 64; index++) {
      const bar = document.createElement('i');
      bar.style.height = (10 + Math.random() * 40) + 'px';
      sparkline.appendChild(bar);
    }
  }
}

const answers = {
  synergy: 'הסינרגיה הועצמה ב־∞%. שום דבר לא השתנה.',
  insight: 'תובנה מהפכנית: ביום יש 24 שעות. נסו לשתות מים.',
  cloud: 'האווירה סונכרנה עם הענן הדמיוני. הנתונים עדיין כאן.',
  upgrade: 'ברכות! שודרגתם לאותה גרסה בדיוק. לא חויבתם.',
  assistant: 'העוזר ממליץ לקחת הפסקה מהעוזר.',
  demo: 'זה כל הדמו. נוצץ, נכון?',
};

async function doUselessThing(button, tool) {
  if (busy) return;
  busy = true;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'מעצים…';
  try {
    // עותקים ומיונים חוזרים של קטלוג מנופח; נשאר מקומי ומוגבל.
    let catalog = buzzwords;
    for (let pass = 0; pass < (mode.checked ? 8 : 1); pass++) {
      catalog = JSON.parse(JSON.stringify(catalog)).sort((a, b) => a.localeCompare(b, 'he'));
    }
    const steps = ['מאתחל את העתיד…', 'מיישר את הסגול…', 'מחשב ' + catalog[0] + '…'];
    for (const step of steps) {
      output.textContent = step;
      if (mode.checked) await wait(650);
    }
    renderMeaninglessChart();
    output.textContent = answers[tool];
    if (tool === 'demo' || tool === 'assistant') output.scrollIntoView({behavior: 'smooth', block: 'center'});
  } finally {
    button.disabled = false;
    button.textContent = original;
    busy = false;
  }
}

for (const button of document.querySelectorAll('.useless-action')) {
  button.addEventListener('click', () => doUselessThing(button, button.dataset.tool));
}
const demo = document.getElementById('demo-button');
demo.addEventListener('click', () => doUselessThing(demo, 'demo'));
renderMeaninglessChart();
