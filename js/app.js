import { store } from './store.js';
import { pad, dateKey, dayAbbr, lastNDays } from './dates.js';
import { CATS, CAT_KEYS, countHours } from './categories.js';

const today = new Date();
const todayKey = dateKey(today);

let dayHours = new Array(24).fill(null);
let dayNotes = '';
let activeStamp = 'sleep';
let tasks = [];
const expandedTasks = new Set();

function debounce(fn, wait) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

async function saveDay() {
  await store.setDay(todayKey, { hours: dayHours, notes: dayNotes });
  // Today's hours feed both the sleep history strip and the weekly balance
  // view, so keep them in sync instead of only reflecting load-time state.
  renderHistory();
  renderWeekly();
}

function showTaskError(msg) {
  const el = document.getElementById('task-err');
  el.textContent = msg;
  el.style.display = 'block';
}
function clearTaskError() {
  document.getElementById('task-err').style.display = 'none';
}

// ---------- Stamps ----------

function renderStamps() {
  const row = document.getElementById('stamp-row');
  row.innerHTML = '';
  CAT_KEYS.forEach((key) => {
    const c = CATS[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stamp' + (activeStamp === key ? ' active' : '');
    btn.innerHTML = '<span class="dot" style="background:' + c.color + '"></span>' + c.label;
    btn.onclick = () => { activeStamp = key; renderStamps(); };
    row.appendChild(btn);
  });
  const eraser = document.createElement('button');
  eraser.type = 'button';
  eraser.className = 'stamp erase' + (activeStamp === null ? ' active' : '');
  eraser.innerHTML = '<span class="dot" style="background:var(--free)"></span>Clear';
  eraser.onclick = () => { activeStamp = null; renderStamps(); };
  row.appendChild(eraser);
}

// ---------- Hour timeline (with mouse drag-paint) ----------

function hourFillContent(h) {
  const value = dayHours[h];
  if (value) {
    const c = CATS[value];
    return { bg: c.color, fg: c.text, label: c.label };
  }
  return { bg: 'var(--free)', fg: 'var(--free-text)', label: 'Free' };
}

function updateHourRow(h) {
  const fill = document.querySelector('.hour-row[data-hour="' + h + '"] .h-fill');
  if (!fill) return;
  const { bg, fg, label } = hourFillContent(h);
  fill.style.background = bg;
  fill.style.color = fg;
  fill.textContent = label;
  fill.classList.toggle('filled', !!dayHours[h]);
}

function applyHour(h, value) {
  if (dayHours[h] !== value) {
    dayHours[h] = value;
    updateHourRow(h);
    renderTotals();
  }
}

let mouseDrag = null; // { value }

function renderTimeline() {
  const tl = document.getElementById('timeline');
  tl.innerHTML = '';
  for (let h = 0; h < 24; h++) {
    const row = document.createElement('div');
    row.className = 'hour-row';
    row.dataset.hour = String(h);

    const label = document.createElement('div');
    label.className = 'h-label';
    label.textContent = pad(h) + ':00';

    const fill = document.createElement('div');
    const { bg, fg, label: fillLabel } = hourFillContent(h);
    fill.className = 'h-fill' + (dayHours[h] ? ' filled' : '');
    fill.style.background = bg;
    fill.style.color = fg;
    fill.textContent = fillLabel;

    row.appendChild(label);
    row.appendChild(fill);

    row.addEventListener('pointerdown', (e) => {
      const toggled = dayHours[h] === activeStamp ? null : activeStamp;
      applyHour(h, toggled);
      if (e.pointerType === 'mouse') {
        mouseDrag = { value: toggled, lastHour: h };
      }
    });

    tl.appendChild(row);
  }
}

// Fill every hour between the last sampled position and the current one —
// pointermove doesn't fire once per row crossed, especially on a fast drag,
// so without interpolation a quick swipe leaves gaps.
window.addEventListener('pointermove', (e) => {
  if (!mouseDrag) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const row = el && el.closest ? el.closest('.hour-row') : null;
  if (!row) return;
  const h = Number(row.dataset.hour);
  if (h === mouseDrag.lastHour) return;
  const [from, to] = h > mouseDrag.lastHour ? [mouseDrag.lastHour, h] : [h, mouseDrag.lastHour];
  for (let i = from; i <= to; i++) applyHour(i, mouseDrag.value);
  mouseDrag.lastHour = h;
});

window.addEventListener('pointerup', () => {
  if (mouseDrag) { mouseDrag = null; saveDay(); }
});
window.addEventListener('pointercancel', () => {
  if (mouseDrag) { mouseDrag = null; saveDay(); }
});

// A plain tap/click always saves immediately too (drag-release also saves).
document.addEventListener('pointerup', (e) => {
  if (e.target.closest && e.target.closest('.hour-row')) saveDay();
});

// ---------- Totals / balance bar ----------

function renderTotals() {
  const { counts, free } = countHours(dayHours);
  renderBalanceBar(document.getElementById('totals-bar'), counts, free);

  const legend = document.getElementById('legend');
  legend.innerHTML = '';
  CAT_KEYS.concat(['free']).forEach((key) => {
    const isFree = key === 'free';
    const c = isFree ? { label: 'Free', color: 'var(--free)' } : CATS[key];
    const val = isFree ? free : counts[key];
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = '<span class="sw" style="background:' + c.color + '"></span>' + c.label + ' ' + val + 'h';
    legend.appendChild(item);
  });
}

function renderBalanceBar(barEl, counts, free) {
  barEl.innerHTML = '';
  CAT_KEYS.forEach((key) => {
    if (counts[key] > 0) {
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.style.background = CATS[key].color;
      seg.style.width = (counts[key] / 24 * 100) + '%';
      barEl.appendChild(seg);
    }
  });
  if (free > 0) {
    const seg = document.createElement('div');
    seg.className = 'seg';
    seg.style.background = 'var(--free)';
    seg.style.width = (free / 24 * 100) + '%';
    barEl.appendChild(seg);
  }
}

// ---------- Notes ----------

const notesBox = document.getElementById('notes-box');
const notesHint = document.getElementById('notes-save-hint');

const persistNotes = debounce(async () => {
  await saveDay();
  notesHint.textContent = 'Saved';
  setTimeout(() => { if (notesHint.textContent === 'Saved') notesHint.innerHTML = '&nbsp;'; }, 1500);
}, 500);

notesBox.addEventListener('input', () => {
  dayNotes = notesBox.value;
  notesHint.textContent = 'Saving…';
  persistNotes();
});

// ---------- Tasks ----------

function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  if (tasks.length === 0) {
    const li = document.createElement('div');
    li.className = 'empty-note';
    li.textContent = 'No tasks yet. Add what you need to get done.';
    list.appendChild(li);
    return;
  }
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = task.done ? 'done' : '';

    const row = document.createElement('div');
    row.className = 't-row';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!task.done;
    cb.onchange = () => { task.done = cb.checked; renderTasks(); persistTasks(); };

    const text = document.createElement('span');
    text.className = 't-text';
    text.textContent = task.text;

    const tag = document.createElement('span');
    tag.className = 't-tag';
    const c = CATS[task.category] || CATS.work;
    tag.style.background = c.color;
    tag.style.color = c.text;
    tag.textContent = c.label;

    const noteToggle = document.createElement('button');
    noteToggle.type = 'button';
    noteToggle.className = 't-note-toggle';
    noteToggle.setAttribute('aria-label', 'Toggle note');
    noteToggle.textContent = task.note ? '✎' : '+note';
    noteToggle.onclick = () => {
      if (expandedTasks.has(task.id)) expandedTasks.delete(task.id);
      else expandedTasks.add(task.id);
      renderTasks();
    };

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 't-del';
    del.setAttribute('aria-label', 'Delete task');
    del.textContent = '×';
    del.onclick = () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      expandedTasks.delete(task.id);
      renderTasks();
      persistTasks();
    };

    row.appendChild(cb);
    row.appendChild(text);
    row.appendChild(tag);
    row.appendChild(noteToggle);
    row.appendChild(del);
    li.appendChild(row);

    if (expandedTasks.has(task.id)) {
      const noteBox = document.createElement('textarea');
      noteBox.className = 't-note-box';
      noteBox.placeholder = 'Add a short note for this task…';
      noteBox.value = task.note || '';
      const persistNote = debounce(() => persistTasks(), 500);
      noteBox.addEventListener('input', () => {
        task.note = noteBox.value;
        persistNote();
      });
      li.appendChild(noteBox);
    }

    list.appendChild(li);
  });
}

async function persistTasks() {
  const ok = await store.setTasks(tasks);
  if (!ok) showTaskError('Could not save your tasks. Try again.');
}

function addTask() {
  clearTaskError();
  const input = document.getElementById('task-input');
  const cat = document.getElementById('task-cat').value;
  const text = input.value.trim();
  if (!text) {
    showTaskError('Enter a task first.');
    return;
  }
  tasks.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), text, category: cat, done: false, note: '' });
  input.value = '';
  renderTasks();
  persistTasks();
}

document.getElementById('task-add').onclick = addTask;
document.getElementById('task-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

document.getElementById('clear-day').onclick = () => {
  dayHours = new Array(24).fill(null);
  renderTimeline();
  renderTotals();
  saveDay();
};

// ---------- Sleep history strip (last 7 days) ----------

async function renderHistory() {
  const strip = document.getElementById('history-strip');
  const days = lastNDays(7, today);
  const keys = days.map(dateKey);
  const records = await store.getDays(keys);

  strip.innerHTML = '';
  const maxH = 80;
  days.forEach((d) => {
    const key = dateKey(d);
    const sleepCount = records[key].hours.filter((v) => v === 'sleep').length;

    const col = document.createElement('div');
    col.className = 'hist-col';
    const val = document.createElement('div');
    val.className = 'hist-val';
    val.textContent = sleepCount + 'h';
    const bar = document.createElement('div');
    bar.className = 'hist-bar';
    bar.style.height = Math.max(2, Math.round((sleepCount / 12) * maxH)) + 'px';
    const label = document.createElement('div');
    const isToday = key === todayKey;
    label.className = 'hist-day' + (isToday ? ' today' : '');
    label.textContent = dayAbbr(d);
    col.appendChild(val);
    col.appendChild(bar);
    col.appendChild(label);
    strip.appendChild(col);
  });
}

// ---------- Weekly balance view (last 7 days) ----------

async function renderWeekly() {
  const wrap = document.getElementById('weekly-strip');
  const days = lastNDays(7, today);
  const keys = days.map(dateKey);
  const records = await store.getDays(keys);

  wrap.innerHTML = '';
  days.forEach((d) => {
    const key = dateKey(d);
    const { counts, free } = countHours(records[key].hours);
    const isToday = key === todayKey;

    const row = document.createElement('div');
    row.className = 'week-row';

    const label = document.createElement('div');
    label.className = 'week-label' + (isToday ? ' today' : '');
    label.textContent = dayAbbr(d) + ' ' + pad(d.getMonth() + 1) + '/' + pad(d.getDate());

    const bar = document.createElement('div');
    bar.className = 'totals-bar week-bar';
    renderBalanceBar(bar, counts, free);

    row.appendChild(label);
    row.appendChild(bar);
    wrap.appendChild(row);
  });
}

// ---------- Init ----------

async function init() {
  document.getElementById('today-date').textContent =
    today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const record = await store.getDay(todayKey);
  dayHours = record.hours;
  dayNotes = record.notes;
  tasks = await store.getTasks();

  renderStamps();
  renderTimeline();
  renderTotals();
  renderTasks();
  notesBox.value = dayNotes;
  await renderHistory();
  await renderWeekly();
}

init();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}
