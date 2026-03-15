import { describe, expect, it } from "vitest";
import { getSleepWindowStatus } from "./sleepSchedule";

function expectLocalDateParts(date, { year, month, day, hours, minutes }) {
  expect(date).toBeTruthy();
  expect(date.getFullYear()).toBe(year);
  expect(date.getMonth()).toBe(month - 1);
  expect(date.getDate()).toBe(day);
  expect(date.getHours()).toBe(hours);
  expect(date.getMinutes()).toBe(minutes);
}

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
});
