// Storage abstraction. Every call is async and returns a Promise, even though
// the current adapter is synchronous localStorage under the hood. That's
// deliberate: it means a future adapter (IndexedDB, or a fetch()-based sync
// backend) can be dropped in without touching any call site in app.js.

const PREFIX = 'timeledger:';
const SCHEMA_VERSION = 1;

function readRaw(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[store] read failed for', key, err);
    return null;
  }
}

function writeRaw(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('[store] write failed for', key, err);
    return false;
  }
}

function emptyDay(dateKey) {
  return { date: dateKey, hours: new Array(24).fill(null), notes: '' };
}

export const store = {
  /** @returns {Promise<{date:string, hours:(string|null)[], notes:string}>} */
  async getDay(dateKey) {
    const record = readRaw('day:' + dateKey);
    if (!record) return emptyDay(dateKey);
    return {
      date: dateKey,
      hours: Array.isArray(record.hours) && record.hours.length === 24
        ? record.hours
        : new Array(24).fill(null),
      notes: typeof record.notes === 'string' ? record.notes : '',
    };
  },

  /** @returns {Promise<boolean>} */
  async setDay(dateKey, record) {
    return writeRaw('day:' + dateKey, {
      date: dateKey,
      hours: record.hours,
      notes: record.notes,
    });
  },

  /** Fetch several days at once (used by history/weekly views). */
  async getDays(dateKeys) {
    const out = {};
    for (const key of dateKeys) out[key] = await this.getDay(key);
    return out;
  },

  /** @returns {Promise<Array<{id:string,text:string,category:string,done:boolean,note:string}>>} */
  async getTasks() {
    const tasks = readRaw('tasks');
    return Array.isArray(tasks) ? tasks : [];
  },

  /** @returns {Promise<boolean>} */
  async setTasks(tasks) {
    return writeRaw('tasks', tasks);
  },

  async getSchemaVersion() {
    return readRaw('schema-version') || SCHEMA_VERSION;
  },
};

writeRaw('schema-version', SCHEMA_VERSION);
