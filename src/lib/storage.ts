// src/storage.ts
export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Session {
  id: string;
  start: string; // ISO
  end: string; // ISO
  durationSec: number;
}

export interface UnfinishedSession {
  start: string; // ISO
  lastActive: string; // ISO
}

export interface StudyData {
  sessions: Session[];
  unfinished: UnfinishedSession | null;
}

export interface LockInData {
  tasks: Task[];
  study: StudyData;
}

const STORAGE_KEY = "LockInData";

// Default initial data
function defaultData(): LockInData {
  return {
    tasks: [],
    study: {
      sessions: [],
      unfinished: null,
    },
  };
}

// Low-level load/save
function loadData(): LockInData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LockInData>;
      // Validate and merge defaults
      const base = defaultData();

      // Tasks
      if (Array.isArray(parsed.tasks)) {
        base.tasks = parsed.tasks.map((item) => ({
          id: String(item.id),
          text: String(item.text),
          done: Boolean(item.done),
          createdAt: String(item.createdAt),
          updatedAt: String(item.updatedAt),
        }));
      }

      // Study
      if (parsed.study) {
        const sd = parsed.study as Partial<StudyData>;
        if (Array.isArray(sd.sessions)) {
          base.study.sessions = sd.sessions.map((s) => ({
            id: String(s.id),
            start: String(s.start),
            end: String(s.end),
            durationSec: Number(s.durationSec),
          }));
        }
        if (sd.unfinished && typeof sd.unfinished === "object") {
          const u = sd.unfinished as Partial<UnfinishedSession>;
          if (u.start && u.lastActive) {
            base.study.unfinished = {
              start: String(u.start),
              lastActive: String(u.lastActive),
            };
          }
        }
      }

      return base;
    }
  } catch {
    console.warn("Failed to parse LockInData from localStorage, resetting.");
  }
  const def = defaultData();
  saveData(def);
  return def;
}

function saveData(data: LockInData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error("Failed to save LockInData to localStorage.");
  }
}

// -------- Task CRUD --------

export function getTasks(): Task[] {
  return loadData().tasks;
}

export function addTask(text: string): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: crypto.randomUUID(),
    text,
    done: false,
    createdAt: now,
    updatedAt: now,
  };
  const data = loadData();
  data.tasks.unshift(task);
  saveData(data);
  return task;
}

export function updateTask(
  id: string,
  updates: Partial<Pick<Task, "text" | "done">>
): Task | null {
  const data = loadData();
  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const task = data.tasks[idx];
  let changed = false;
  if (updates.text !== undefined && updates.text !== task.text) {
    task.text = updates.text;
    changed = true;
  }
  if (updates.done !== undefined && updates.done !== task.done) {
    task.done = updates.done;
    changed = true;
  }
  if (changed) {
    task.updatedAt = new Date().toISOString();
    // Move to front
    data.tasks.splice(idx, 1);
    data.tasks.unshift(task);
    saveData(data);
  }
  return task;
}

export function deleteTask(id: string): boolean {
  const data = loadData();
  const filtered = data.tasks.filter((t) => t.id !== id);
  if (filtered.length !== data.tasks.length) {
    data.tasks = filtered;
    saveData(data);
    return true;
  }
  return false;
}

export function clearCompletedTasks(): void {
  const data = loadData();
  data.tasks = data.tasks.filter((t) => !t.done);
  saveData(data);
}

// -------- Study Session CRUD & Unfinished --------

export function getSessions(): Session[] {
  return loadData().study.sessions;
}

export function addSession(startISO: string, endISO: string): Session {
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);
  let durationSec = Math.floor(
    (endDate.getTime() - startDate.getTime()) / 1000
  );
  if (durationSec < 0) durationSec = 0;
  const session: Session = {
    id: crypto.randomUUID(),
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    durationSec,
  };
  const data = loadData();
  data.study.sessions.unshift(session);
  saveData(data);
  return session;
}

export function updateSession(
  id: string,
  updates: Partial<Pick<Session, "start" | "end">>
): Session | null {
  const data = loadData();
  const idx = data.study.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const sess = data.study.sessions[idx];
  let startDate = new Date(sess.start);
  let endDate = new Date(sess.end);
  if (updates.start) startDate = new Date(updates.start);
  if (updates.end) endDate = new Date(updates.end);
  let durationSec = Math.floor(
    (endDate.getTime() - startDate.getTime()) / 1000
  );
  if (durationSec < 0) durationSec = 0;
  const updated: Session = {
    id: sess.id,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    durationSec,
  };
  data.study.sessions.splice(idx, 1);
  data.study.sessions.unshift(updated);
  saveData(data);
  return updated;
}

export function deleteSession(id: string): boolean {
  const data = loadData();
  const filtered = data.study.sessions.filter((s) => s.id !== id);
  if (filtered.length !== data.study.sessions.length) {
    data.study.sessions = filtered;
    saveData(data);
    return true;
  }
  return false;
}

// Unfinished session: for timer logic to persist start/lastActive
export function getUnfinishedSession(): UnfinishedSession | null {
  return loadData().study.unfinished;
}

export function setUnfinishedSession(startISO: string): UnfinishedSession {
  const nowISO = new Date().toISOString();
  const unfinished: UnfinishedSession = { start: startISO, lastActive: nowISO };
  const data = loadData();
  data.study.unfinished = unfinished;
  saveData(data);
  return unfinished;
}

export function updateLastActive(): void {
  const data = loadData();
  if (data.study.unfinished) {
    data.study.unfinished.lastActive = new Date().toISOString();
    saveData(data);
  }
}

export function clearUnfinishedSession(): void {
  const data = loadData();
  if (data.study.unfinished) {
    data.study.unfinished = null;
    saveData(data);
  }
}

// -------- Aggregates --------

// Daily totals for a month: returns map day (1-based) to total seconds
export function dailyTotalsForMonth(
  year: number,
  month: number
): Record<number, number> {
  // month: 1-12
  const totals: Record<number, number> = {};
  const sessions = getSessions();
  sessions.forEach((s) => {
    const d = new Date(s.start);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate();
      totals[day] = (totals[day] || 0) + s.durationSec;
    }
  });
  return totals;
}

// Average daily study seconds for a month
export function averageDailyForMonth(year: number, month: number): number {
  const totals = dailyTotalsForMonth(year, month);
  // number of days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const sumSec = Object.values(totals).reduce((a, b) => a + b, 0);
  return sumSec / daysInMonth;
}

// Monthly totals for a year: returns map month (1-12) to total seconds
export function monthlyTotalsForYear(year: number): Record<number, number> {
  const totals: Record<number, number> = {};
  const sessions = getSessions();
  sessions.forEach((s) => {
    const d = new Date(s.start);
    if (d.getFullYear() === year) {
      const m = d.getMonth() + 1;
      totals[m] = (totals[m] || 0) + s.durationSec;
    }
  });
  return totals;
}

// Average daily study seconds over the year
export function averageDailyForYear(year: number): number {
  const monthly = monthlyTotalsForYear(year);
  const sumSec = Object.values(monthly).reduce((a, b) => a + b, 0);
  // days in year
  const isLeap = new Date(year, 1, 29).getDate() === 29;
  const days = isLeap ? 366 : 365;
  return sumSec / days;
}
