function buildDateAtMinutes(baseDate, totalMinutes) {
  const next = new Date(baseDate);
  next.setHours(0, 0, 0, 0);
  next.setMinutes(totalMinutes);
  return next;
}

export function parseClockTime(value) {
  const [rawHours, rawMinutes] = String(value || "00:00").split(":");
  const hours = Number.parseInt(rawHours, 10);
  const minutes = Number.parseInt(rawMinutes, 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return 0;
  }

  return (hours * 60) + minutes;
}

function getWindowBounds(schedule, now) {
  const startMinutes = parseClockTime(schedule?.start);
  const endMinutes = parseClockTime(schedule?.end);
  const currentMinutes = (now.getHours() * 60) + now.getMinutes();
  const crossesMidnight = endMinutes < startMinutes;

  if (startMinutes === endMinutes) {
    return {
      startMinutes,
      endMinutes,
      crossesMidnight,
      windowStartAt: null,
      windowEndAt: null,
      isInSleepWindow: false,
    };
  }

  if (!crossesMidnight) {
    const windowStartAt = buildDateAtMinutes(now, startMinutes);
    const windowEndAt = buildDateAtMinutes(now, endMinutes);

    if (currentMinutes >= endMinutes) {
      windowStartAt.setDate(windowStartAt.getDate() + 1);
      windowEndAt.setDate(windowEndAt.getDate() + 1);
    }

    return {
      startMinutes,
      endMinutes,
      crossesMidnight,
      windowStartAt,
      windowEndAt,
      isInSleepWindow:
        currentMinutes >= startMinutes && currentMinutes < endMinutes,
    };
  }

  if (currentMinutes >= startMinutes) {
    const windowStartAt = buildDateAtMinutes(now, startMinutes);
    const windowEndAt = buildDateAtMinutes(now, endMinutes);
    windowEndAt.setDate(windowEndAt.getDate() + 1);

    return {
      startMinutes,
      endMinutes,
      crossesMidnight,
      windowStartAt,
      windowEndAt,
      isInSleepWindow: true,
    };
  }

  if (currentMinutes < endMinutes) {
    const windowStartAt = buildDateAtMinutes(now, startMinutes);
    const windowEndAt = buildDateAtMinutes(now, endMinutes);
    windowStartAt.setDate(windowStartAt.getDate() - 1);

    return {
      startMinutes,
      endMinutes,
      crossesMidnight,
      windowStartAt,
      windowEndAt,
      isInSleepWindow: true,
    };
  }

  const windowStartAt = buildDateAtMinutes(now, startMinutes);
  const windowEndAt = buildDateAtMinutes(now, endMinutes);
  windowEndAt.setDate(windowEndAt.getDate() + 1);

  return {
    startMinutes,
    endMinutes,
    crossesMidnight,
    windowStartAt,
    windowEndAt,
    isInSleepWindow: false,
  };
}

// Returns whether the current time falls inside the sleep window and the next
// boundary where the effective sleep state should change.
export function getSleepWindowStatus(schedule, now = new Date()) {
  const {
    crossesMidnight,
    windowStartAt,
    windowEndAt,
    isInSleepWindow,
  } = getWindowBounds(schedule, now);

  if (!windowStartAt || !windowEndAt) {
    return {
      crossesMidnight,
      isInSleepWindow: false,
      nextBoundaryAt: null,
      windowStartAt: null,
      windowEndAt: null,
    };
  }

  return {
    crossesMidnight,
    isInSleepWindow,
    nextBoundaryAt: isInSleepWindow ? windowEndAt : windowStartAt,
    windowStartAt,
    windowEndAt,
  };
}
