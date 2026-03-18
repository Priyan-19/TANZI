function buildDateAtMinutes(baseDate, totalMinutes) {
  const next = new Date(baseDate);
  next.setHours(0, 0, 0, 0);
  next.setMinutes(totalMinutes);
  return next;
}

/**
 * Parses a "HH:MM" 24-hour string into total minutes from midnight.
 * Handles the edge case where an HTML <input type="time"> might return "12:00"
 * for both midnight-zone and noon based on the user's system locale.
 * In this app, all time values are treated strictly as 24h. "00:00" = midnight.
 */
export function parseClockTime(value) {
  if (!value) return 0;
  const [rawHours, rawMinutes] = String(value).split(":");
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

/**
 * Converts a display-format time string to a guaranteed 24h "HH:MM" string.
 * 
 * FIXES THE "12:00 AM = noon" BUG:
 * This function handles values like "12:00 AM" (00:00), "12:00 PM" (12:00),
 * and standard 24h "HH:MM" strings.
 *
 * @param {string} value - Time string like "22:00", "12:00 AM", or "7:00 PM"
 * @returns {string} - Normalized "HH:MM" string (24h)
 */
export function normalizeTimeString(value) {
  if (!value) return "00:00";
  const str = String(value).trim();
  
  // 1. Try to match 12h format first (e.g. "12:00 AM", "07:00 pm", "5:30PM")
  const match12 = str.match(/^(\d{1,2}):(\d{2})(?:\s*:(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[4].toLowerCase();

    if (meridiem === "am") {
      if (hours === 12) hours = 0; // 12 AM -> 00
    } else {
      if (hours !== 12) hours += 12; // 1 PM -> 13, 12 PM -> 12
    }
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  // 2. Fallback: parse as 24h format "HH:MM"
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?:\s*:(\d{2}))?$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    hours = (hours === 24) ? 0 : hours % 24;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return "00:00";
}

/**
 * Formats a 24h "HH:MM" string into a user-friendly 12h "hh:mm AM/PM" string.
 */
export function formatClockTime(value) {
  if (!value) return "12:00 AM";
  const [h, m] = value.split(":").map(n => parseInt(n, 10));
  if (isNaN(h) || isNaN(m)) return "12:00 AM";

  const meridiem = h >= 12 ? "PM" : "AM";
  let displayHours = h % 12;
  if (displayHours === 0) displayHours = 12;
  
  return `${displayHours}:${String(m).padStart(2, "0")} ${meridiem}`;
}

function getWindowBounds(schedule, now) {
  const startMinutes = parseClockTime(normalizeTimeString(schedule?.start));
  const endMinutes = parseClockTime(normalizeTimeString(schedule?.end));
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

/**
 * Checks if a specific Date object falls within the provided sleep schedule.
 */
export function isDateInSleepWindow(date, schedule) {
  if (!schedule?.start || !schedule?.end) return false;
  const status = getSleepWindowStatus(schedule, date);
  return status.isInSleepWindow;
}
