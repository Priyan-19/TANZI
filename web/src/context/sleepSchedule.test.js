import { describe, expect, it } from "vitest";
import { getSleepWindowStatus, normalizeTimeString, parseClockTime } from "./sleepSchedule";

function expectLocalDateParts(date, { year, month, day, hours, minutes }) {
  expect(date).toBeTruthy();
  expect(date.getFullYear()).toBe(year);
  expect(date.getMonth()).toBe(month - 1);
  expect(date.getDate()).toBe(day);
  expect(date.getHours()).toBe(hours);
  expect(date.getMinutes()).toBe(minutes);
}

// ─── normalizeTimeString Tests ────────────────────────────────────────────────

describe("normalizeTimeString", () => {
  it("leaves 24h strings unchanged", () => {
    expect(normalizeTimeString("22:00")).toBe("22:00");
    expect(normalizeTimeString("07:00")).toBe("07:00");
    expect(normalizeTimeString("00:00")).toBe("00:00");
  });

  it("converts 12:xx AM to 00:xx (midnight zone) — the critical bug fix", () => {
    expect(normalizeTimeString("12:00 AM")).toBe("00:00");
    expect(normalizeTimeString("12:30 am")).toBe("00:30");
  });

  it("converts 12:xx PM to 12:xx (noon)", () => {
    expect(normalizeTimeString("12:00 PM")).toBe("12:00");
    expect(normalizeTimeString("12:30 pm")).toBe("12:30");
  });

  it("converts 1:xx PM to 13:xx", () => {
    expect(normalizeTimeString("1:00 PM")).toBe("13:00");
    expect(normalizeTimeString("11:59 pm")).toBe("23:59");
  });

  it("converts 1:xx AM to 01:xx", () => {
    expect(normalizeTimeString("1:00 AM")).toBe("01:00");
  });

  it("handles edge case of empty/null input", () => {
    expect(normalizeTimeString("")).toBe("00:00");
    expect(normalizeTimeString(null)).toBe("00:00");
    expect(normalizeTimeString(undefined)).toBe("00:00");
  });
});

// ─── parseClockTime Tests ─────────────────────────────────────────────────────

describe("parseClockTime", () => {
  it("parses midnight correctly (00:00 → 0 minutes)", () => {
    expect(parseClockTime("00:00")).toBe(0);
  });

  it("parses noon correctly (12:00 → 720 minutes)", () => {
    expect(parseClockTime("12:00")).toBe(720);
  });

  it("parses 22:00 → 1320 minutes", () => {
    expect(parseClockTime("22:00")).toBe(1320);
  });

  it("parses 07:00 → 420 minutes", () => {
    expect(parseClockTime("07:00")).toBe(420);
  });
});

// ─── getSleepWindowStatus Tests ───────────────────────────────────────────────

describe("getSleepWindowStatus", () => {
  it("keeps a same-day sleep window active until the wake time", () => {
    const status = getSleepWindowStatus(
      { start: "00:00", end: "07:00" },
      new Date("2026-03-15T06:59:00"),
    );

    expect(status.isInSleepWindow).toBe(true);
    expectLocalDateParts(status.nextBoundaryAt, {
      year: 2026,
      month: 3,
      day: 15,
      hours: 7,
      minutes: 0,
    });
  });

  it("turns a same-day sleep window off exactly at the wake time", () => {
    const status = getSleepWindowStatus(
      { start: "00:00", end: "07:00" },
      new Date("2026-03-15T07:00:00"),
    );

    expect(status.isInSleepWindow).toBe(false);
    expectLocalDateParts(status.nextBoundaryAt, {
      year: 2026,
      month: 3,
      day: 16,
      hours: 0,
      minutes: 0,
    });
  });

  it("handles cross-midnight windows before midnight", () => {
    const status = getSleepWindowStatus(
      { start: "22:00", end: "07:00" },
      new Date("2026-03-15T23:30:00"),
    );

    expect(status.isInSleepWindow).toBe(true);
    expectLocalDateParts(status.nextBoundaryAt, {
      year: 2026,
      month: 3,
      day: 16,
      hours: 7,
      minutes: 0,
    });
  });

  it("handles cross-midnight windows after midnight", () => {
    const status = getSleepWindowStatus(
      { start: "22:00", end: "07:00" },
      new Date("2026-03-16T06:30:00"),
    );

    expect(status.isInSleepWindow).toBe(true);
    expectLocalDateParts(status.windowStartAt, {
      year: 2026,
      month: 3,
      day: 15,
      hours: 22,
      minutes: 0,
    });
    expectLocalDateParts(status.windowEndAt, {
      year: 2026,
      month: 3,
      day: 16,
      hours: 7,
      minutes: 0,
    });
    expectLocalDateParts(status.nextBoundaryAt, {
      year: 2026,
      month: 3,
      day: 16,
      hours: 7,
      minutes: 0,
    });
  });

  it("turns a cross-midnight sleep window off exactly at the wake time", () => {
    const status = getSleepWindowStatus(
      { start: "22:00", end: "07:00" },
      new Date("2026-03-16T07:00:00"),
    );

    expect(status.isInSleepWindow).toBe(false);
    expectLocalDateParts(status.nextBoundaryAt, {
      year: 2026,
      month: 3,
      day: 16,
      hours: 22,
      minutes: 0,
    });
  });

  it("returns the next start boundary while outside a cross-midnight window", () => {
    const status = getSleepWindowStatus(
      { start: "22:00", end: "07:00" },
      new Date("2026-03-16T12:00:00"),
    );

    expect(status.isInSleepWindow).toBe(false);
    expectLocalDateParts(status.nextBoundaryAt, {
      year: 2026,
      month: 3,
      day: 16,
      hours: 22,
      minutes: 0,
    });
  });

  // ─── THE KEY MIDNIGHT BUG REGRESSION TESTS ────────────────────────────────

  it("MIDNIGHT BUG: '12:00 AM' start (stored as '00:00') → does NOT trigger at noon", () => {
    // At 12:00 Noon (12:00 / 720 minutes) — should NOT be in sleep window
    const status = getSleepWindowStatus(
      { start: "00:00", end: "07:00" },
      new Date("2026-03-16T12:00:00"),
    );
    expect(status.isInSleepWindow).toBe(false);
  });

  it("MIDNIGHT BUG: '12:00 AM' start correctly activates at midnight (00:01)", () => {
    // At 12:01 AM (midnight + 1 min) — SHOULD be in sleep window
    const status = getSleepWindowStatus(
      { start: "00:00", end: "07:00" },
      new Date("2026-03-16T00:01:00"),
    );
    expect(status.isInSleepWindow).toBe(true);
  });

  it("MIDNIGHT BUG: Cross-midnight '00:00-07:00' is NOT active at 8 AM", () => {
    const status = getSleepWindowStatus(
      { start: "00:00", end: "07:00" },
      new Date("2026-03-16T08:00:00"),
    );
    expect(status.isInSleepWindow).toBe(false);
  });
});
