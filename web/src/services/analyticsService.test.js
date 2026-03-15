import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  collectionMock,
  queryMock,
  whereMock,
  getDocsMock,
  setDocMock,
  docMock,
  orderByMock,
  timestampNowMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn((db, name) => ({ db, name })),
  queryMock: vi.fn((...parts) => ({ parts })),
  whereMock: vi.fn((...args) => ({ type: "where", args })),
  getDocsMock: vi.fn(),
  setDocMock: vi.fn(),
  docMock: vi.fn((db, collectionName, id) => ({ db, collectionName, id })),
  orderByMock: vi.fn((...args) => ({ type: "orderBy", args })),
  timestampNowMock: vi.fn(() => ({ seconds: 123, nanoseconds: 0 })),
}));

vi.mock("firebase/firestore", () => ({
  Timestamp: { now: timestampNowMock },
  collection: collectionMock,
  doc: docMock,
  getDocs: getDocsMock,
  orderBy: orderByMock,
  query: queryMock,
  setDoc: setDocMock,
  where: whereMock,
}));

vi.mock("../firebase/config", () => ({
  db: { name: "mock-db" },
}));

import {
  calculateProductivityScore,
  checkAndGenerateAutomatedReports,
  generateDailyReport,
  getWeeklyAnalytics,
} from "./analyticsService";

function makeSnapshot(...rows) {
  return {
    docs: rows.map((data, index) => ({
      id: `doc-${index}`,
      data: () => data,
    })),
  };
}

function createLocalStorageMock() {
  const store = new Map();

  return {
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  globalThis.localStorage = createLocalStorageMock();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("analyticsService", () => {
  it("generates and persists a daily report summary", async () => {
    getDocsMock.mockResolvedValue(
      makeSnapshot(
        { status: "completed" },
        { status: "pending" },
        { status: "completed" },
      ),
    );

    const report = await generateDailyReport("user-1", new Date("2026-03-15T10:00:00Z"));

    expect(report).toEqual({
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
      completionRate: 67,
    });

    expect(setDocMock).toHaveBeenCalledWith(
      { db: { name: "mock-db" }, collectionName: "dailyReports", id: "user-1_2026-03-15" },
      expect.objectContaining({
        userId: "user-1",
        date: "2026-03-15",
        totalTasks: 3,
        completedTasks: 2,
        pendingTasks: 1,
        completionRate: 67,
        updatedAt: { seconds: 123, nanoseconds: 0 },
      }),
    );
  });

  it("fills missing days when building weekly analytics", async () => {
    getDocsMock.mockResolvedValue(
      makeSnapshot(
        { date: "2026-03-16", totalTasks: 3, completedTasks: 2, pendingTasks: 1, completionRate: 67 },
        { date: "2026-03-18", totalTasks: 4, completedTasks: 4, pendingTasks: 0, completionRate: 100 },
      ),
    );

    const week = await getWeeklyAnalytics("user-1", new Date("2026-03-18T10:00:00Z"));

    expect(week).toHaveLength(7);
    expect(week[0]).toMatchObject({
      date: "2026-03-16",
      label: "Mon",
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
      completionRate: 67,
    });
    expect(week[1]).toMatchObject({
      date: "2026-03-17",
      label: "Tue",
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      completionRate: 0,
    });
    expect(week[2]).toMatchObject({
      date: "2026-03-18",
      label: "Wed",
      totalTasks: 4,
      completedTasks: 4,
      pendingTasks: 0,
      completionRate: 100,
    });
  });

  it("averages weekly completion rates into a productivity score", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-18T10:00:00Z"));
    getDocsMock.mockResolvedValue(
      makeSnapshot(
        { date: "2026-03-16", totalTasks: 1, completedTasks: 1, pendingTasks: 0, completionRate: 100 },
        { date: "2026-03-17", totalTasks: 1, completedTasks: 1, pendingTasks: 0, completionRate: 100 },
        { date: "2026-03-18", totalTasks: 1, completedTasks: 0, pendingTasks: 1, completionRate: 0 },
        { date: "2026-03-19", totalTasks: 1, completedTasks: 1, pendingTasks: 0, completionRate: 100 },
        { date: "2026-03-20", totalTasks: 1, completedTasks: 0, pendingTasks: 1, completionRate: 0 },
        { date: "2026-03-21", totalTasks: 1, completedTasks: 1, pendingTasks: 0, completionRate: 100 },
        { date: "2026-03-22", totalTasks: 1, completedTasks: 0, pendingTasks: 1, completionRate: 0 },
      ),
    );

    const score = await calculateProductivityScore("user-1");

    expect(score).toBe(57);
  });

  it("runs the daily automation once per day after 8 AM", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-18T08:15:00"));
    getDocsMock.mockResolvedValue(makeSnapshot());

    const results = await checkAndGenerateAutomatedReports("user-1");

    expect(results).toEqual({
      daily: true,
      weekly: false,
      monthly: false,
    });
    expect(localStorage.getItem("last_daily_gen_user-1")).toBe("2026-03-18");
    expect(setDocMock).toHaveBeenCalledWith(
      { db: { name: "mock-db" }, collectionName: "dailyReports", id: "user-1_2026-03-17" },
      expect.objectContaining({
        userId: "user-1",
        date: "2026-03-17",
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completionRate: 0,
      }),
    );
  });
});
