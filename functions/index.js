const functions = require("firebase-functions");
const admin = require("firebase-admin");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const isoWeek = require("dayjs/plugin/isoWeek");

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);

// Set default timezone to Europe/Vilnius
dayjs.tz.setDefault("Europe/Vilnius");

admin.initializeApp();

/** Match cron step: functions run every REMINDER_CRON_MINUTES minutes */
const REMINDER_CRON_MINUTES = 5;

const DEFAULT_REMINDER_TZ = "Europe/Vilnius";

/**
 * IANA zone from user prefs (client syncs via Intl) or project default
 * @param {Object} prefs - emailPreferences document
 * @return {string}
 */
function getReminderIanaTimeZone(prefs) {
  const raw = prefs && typeof prefs.reminderTimeZone === "string" &&
    prefs.reminderTimeZone.trim();
  if (!raw || raw.length < 2 || raw.length > 100) {
    return DEFAULT_REMINDER_TZ;
  }
  if (!/^[A-Za-z0-9_+\-/]+$/.test(raw)) {
    return DEFAULT_REMINDER_TZ;
  }
  const probe = dayjs.tz("2020-06-15 12:00:00", raw);
  return probe.isValid() ? raw : DEFAULT_REMINDER_TZ;
}

/**
 * True if now is in [scheduled, scheduled + REMINDER_CRON_MINUTES) today (tz).
 * @param {dayjs.Dayjs} now - TZ-aware in the caller's zone
 * @param {string} timeStr - "HH:mm"
 * @return {boolean}
 */
function isInReminderSendWindow(now, timeStr) {
  if (!timeStr || typeof timeStr !== "string") {
    return false;
  }
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || "0", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return false;
  }
  const scheduled = now.clone()
      .startOf("day")
      .hour(h)
      .minute(m)
      .second(0)
      .millisecond(0);
  const end = scheduled.add(REMINDER_CRON_MINUTES, "minute");
  return !now.isBefore(scheduled) && now.isBefore(end);
}

/**
 * Normalize event.day from Firestore (Timestamp, Date, millis, ISO) to
 * start-of-day in the given timezone.
 * @param {*} value - Raw day field from an event document
 * @param {string} tz - IANA timezone
 * @return {dayjs.Dayjs|null} Start of calendar day in tz, or null if invalid
 */
function eventDayToStartInTz(value, tz) {
  if (value == null) {
    return null;
  }
  let d;
  if (typeof value.toDate === "function") {
    d = value.toDate();
  } else if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    d = new Date(value.seconds * 1000 +
      Math.floor((value.nanoseconds || 0) / 1e6));
  } else if (value instanceof Date) {
    d = value;
  } else if (typeof value === "number") {
    d = new Date(value);
  } else {
    d = new Date(value);
  }
  if (!d || Number.isNaN(d.getTime())) {
    return null;
  }
  return dayjs.tz(d, tz).startOf("day");
}

/**
 * Fetch user's plants: display names + categories (calendar filter parity).
 * @param {string} userId - User ID
 * @return {Promise<{plantIdToDisplayName: Object, plantIdToCategory: Object}>}
 */
async function getPlantMapsForUser(userId) {
  if (!userId) {
    return {plantIdToDisplayName: {}, plantIdToCategory: {}};
  }
  const plantsSnap = await admin.firestore()
      .collection("plants")
      .where("userId", "==", userId)
      .get();
  const plantIdToDisplayName = {};
  const plantIdToCategory = {};
  plantsSnap.docs.forEach((d) => {
    const p = d.data();
    plantIdToCategory[d.id] = p.category || null;
    const name = p.variety ?
      `${p.category} - ${p.variety}` :
      (p.category || p.name || d.id);
    plantIdToDisplayName[d.id] = name;
  });
  return {plantIdToDisplayName, plantIdToCategory};
}

/**
 * Fetch user's plants and build plantId -> displayName map
 * @param {string} userId - User ID
 * @return {Promise<Object>} Map of plantId to display name
 */
async function getPlantIdToDisplayName(userId) {
  const {plantIdToDisplayName} = await getPlantMapsForUser(userId);
  return plantIdToDisplayName;
}

/**
 * Same rules as client filteredEvents: unlabeled events always show; labeled
 * events only if their plant category is checked in the sidebar.
 * @param {Array} events - User events
 * @param {Object} plantIdToCategory - plantId -> category string
 * @param {Array|null|undefined} includedCategories - from emailPreferences;
 *     null/undefined = no filter (include all)
 * @return {Array} Visible events for reminders
 */
function filterEventsForReminderCalendar(
    events,
    plantIdToCategory,
    includedCategories,
) {
  if (includedCategories == null || !Array.isArray(includedCategories)) {
    return events;
  }
  const allow = new Set(includedCategories);
  return events.filter((evt) => {
    if (!evt.labels || evt.labels.length === 0) {
      return true;
    }
    return evt.labels.some((plantId) => {
      const cat = plantIdToCategory[plantId];
      return cat != null && allow.has(cat);
    });
  });
}

/**
 * Get TODOs that are due today or overdue
 * @param {Array} events - Array of event objects
 * @param {string} [ianaTimeZone=DEFAULT_REMINDER_TZ] - IANA time zone
 * @return {Array} Filtered array of due/overdue TODOs
 */
function getDueAndOverdueTodos(events, ianaTimeZone = DEFAULT_REMINDER_TZ) {
  const today = dayjs.tz(new Date(), ianaTimeZone).startOf("day");

  return events.filter((evt) => {
    // Check if it's a TODO
    const isTodoEvent = evt.isRecurringTodo ||
                       (typeof evt.title === "string" &&
                        evt.title.startsWith("TO DO:")) ||
                       (typeof evt.toDo === "string" &&
                        evt.toDo.startsWith("TO DO:"));

    if (!isTodoEvent || evt.completed) return false;

    const eventDate = eventDayToStartInTz(evt.day, ianaTimeZone);
    if (!eventDate) return false;

    // Include if due today or overdue
    return eventDate.isSameOrBefore(today, "day");
  });
}

/**
 * Get TODOs for the week ahead (Monday through Sunday)
 * Used for weekly summary email sent on Sunday/Monday
 * @param {Array} events - Array of event objects
 * @param {string} [ianaTimeZone=DEFAULT_REMINDER_TZ] - IANA time zone
 * @return {Object} { overdue: [], byDay: { 'YYYY-MM-DD': [] } }
 */
function getTodosForWeekAhead(events, ianaTimeZone = DEFAULT_REMINDER_TZ) {
  const now = dayjs.tz(new Date(), ianaTimeZone);
  const today = now.startOf("day");

  // Week ahead: if Sunday, next Mon-Sun; if Monday, this Mon-Sun
  const dayOfWeek = now.day(); // 0=Sun, 1=Mon, ...
  const weekStart = dayOfWeek === 0 ?
    today.add(1, "day") : // Sunday -> Monday
    today.startOf("week").add(1, "day"); // Monday = start of "week" in dayjs
  const weekEnd = weekStart.add(6, "days");

  const overdue = [];
  const byDay = {};

  for (let d = weekStart;
    d.isSameOrBefore(weekEnd, "day");
    d = d.add(1, "day")) {
    byDay[d.format("YYYY-MM-DD")] = [];
  }

  events.forEach((evt) => {
    const isTodoEvent = evt.isRecurringTodo ||
                       (typeof evt.title === "string" &&
                        evt.title.startsWith("TO DO:")) ||
                       (typeof evt.toDo === "string" &&
                        evt.toDo.startsWith("TO DO:"));

    if (!isTodoEvent || evt.completed) return;

    const eventDate = eventDayToStartInTz(evt.day, ianaTimeZone);
    if (!eventDate) return;

    if (eventDate.isBefore(today, "day")) {
      overdue.push(evt);
    } else if (!eventDate.isAfter(weekEnd, "day")) {
      const key = eventDate.format("YYYY-MM-DD");
      if (byDay[key]) {
        byDay[key].push(evt);
      }
    }
  });

  return {overdue, byDay, weekStart, weekEnd};
}

/**
 * Heuristic: value looks like an opaque id (e.g. Firestore document id).
 * @param {string} s - Candidate string
 * @return {boolean} True if string matches opaque-id pattern
 */
function labelLooksLikeOpaqueId(s) {
  if (typeof s !== "string") {
    return false;
  }
  const t = s.trim();
  if (t.length < 12 || /\s/.test(t)) {
    return false;
  }
  return /^[A-Za-z0-9_-]+$/.test(t);
}

/**
 * Resolve a plant label id to a human-readable name for push copy.
 * @param {string} rawId - Label id from the event
 * @param {Object} plantIdToDisplayName - Map of plant ID to display name
 * @return {string} Label to show in the notification body
 */
function formatPlantLabel(rawId, plantIdToDisplayName) {
  const id = String(rawId);
  const mapped = plantIdToDisplayName[id];
  if (mapped && mapped !== id) {
    return mapped;
  }
  if (!mapped && labelLooksLikeOpaqueId(id)) {
    return "Plant";
  }
  return mapped || id;
}

/**
 * Format a single TODO for display
 * @param {Object} todo - TODO object
 * @param {Object} plantIdToDisplayName - Map of plant ID to display name
 * @return {string} Formatted line
 */
function formatTodoLine(todo, plantIdToDisplayName = {}) {
  let actionName = "";
  if (todo.actions && todo.actions.length > 0) {
    actionName = todo.actions.join(", ");
  } else if (todo.toDo) {
    const todoText = Array.isArray(todo.toDo) ?
      todo.toDo.join(", ") : todo.toDo;
    actionName = todoText.replace(/^TO DO:\s*/i, "");
  } else if (todo.title) {
    actionName = todo.title.replace(/^TO DO:\s*/i, "");
  }

  const plantLabels = todo.labels && todo.labels.length > 0 ?
    todo.labels.map((lid) => formatPlantLabel(lid, plantIdToDisplayName))
        .join(", ") :
    "";

  let line = actionName || "Unnamed TODO";
  if (plantLabels) {
    line += ` (${plantLabels})`;
  }
  return line;
}

/**
 * Collect FCM registration tokens for a user from emailPreferences docs
 * @param {string} userId - Firebase Auth UID
 * @return {Promise<string[]>}
 */
async function getFcmTokensForUser(userId) {
  const snap = await admin.firestore()
      .collection("emailPreferences")
      .where("userId", "==", userId)
      .limit(20)
      .get();
  const tokens = new Set();
  snap.docs.forEach((d) => {
    const arr = d.data().fcmTokens;
    if (Array.isArray(arr)) {
      arr.forEach((t) => {
        if (typeof t === "string" && t.length > 0) tokens.add(t);
      });
    }
  });
  return [...tokens];
}

/**
 * Remove invalid FCM tokens from preference docs for this user
 * @param {string} userId - Firebase Auth UID
 * @param {string[]} invalidTokens - Tokens to remove
 * @return {Promise<void>}
 */
async function removeInvalidFcmTokens(userId, invalidTokens) {
  if (!invalidTokens.length) return;
  const snap = await admin.firestore()
      .collection("emailPreferences")
      .where("userId", "==", userId)
      .limit(20)
      .get();
  const batch = admin.firestore().batch();
  let writes = 0;
  snap.docs.forEach((d) => {
    const cur = d.data().fcmTokens || [];
    const next = cur.filter((t) => !invalidTokens.includes(t));
    if (next.length !== cur.length) {
      batch.update(d.ref, {fcmTokens: next});
      writes++;
    }
  });
  if (writes > 0) await batch.commit();
}

const PUSH_LINK = "https://happytomato-c4fed.web.app";

/**
 * Calendar day (YYYY-MM-DD) in the user's IANA zone for deep links
 * @param {number} offsetDays - Days after today (0 = today)
 * @param {string} ianaTimeZone - IANA zone
 * @return {string}
 */
function openDayInTz(offsetDays = 0, ianaTimeZone = DEFAULT_REMINDER_TZ) {
  return dayjs.tz(new Date(), ianaTimeZone)
      .startOf("day")
      .add(offsetDays, "day")
      .format("YYYY-MM-DD");
}

/**
 * Target calendar day for callable todo pushes from reminderType.
 * @param {string} reminderTypeStr
 * @param {string} ianaTimeZone
 * @return {string} YYYY-MM-DD
 */
function openDayForCallableReminder(
    reminderTypeStr, ianaTimeZone = DEFAULT_REMINDER_TZ,
) {
  const rt = typeof reminderTypeStr === "string" ? reminderTypeStr.trim() : "";
  if (rt === "Daily Garden Reminder") {
    return openDayInTz(0, ianaTimeZone);
  }
  const advanceMatch = /^(\d+)-Day Advance Garden Reminder$/.exec(rt);
  if (advanceMatch) {
    return openDayInTz(parseInt(advanceMatch[1], 10), ianaTimeZone);
  }
  return openDayInTz(0, ianaTimeZone);
}

/**
 * Send web push to all registered devices for userId
 * @param {string} userId - Firebase Auth UID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} dataPayload - Stringifiable data for the client
 * @return {Promise<Object>} Result with ok flag and optional reason or detail.
 */
async function sendWebPushToUser(userId, title, body, dataPayload = {}) {
  const tokens = await getFcmTokensForUser(userId);
  if (tokens.length === 0) {
    return {ok: false, reason: "no_fcm_tokens"};
  }

  const dataStrings = {};
  for (const [k, v] of Object.entries(dataPayload)) {
    dataStrings[String(k)] = v == null ? "" : String(v);
  }

  const openDayStr = dataStrings.openDay || "";
  const isWeeklySummary = dataStrings.kind === "weekly_summary";
  let webLink = `${PUSH_LINK}/`;
  if (openDayStr || isWeeklySummary) {
    const u = new URL(`${PUSH_LINK}/`);
    if (openDayStr) {
      u.searchParams.set("day", openDayStr);
    }
    if (isWeeklySummary) {
      u.searchParams.set("weeklySummary", "1");
    }
    webLink = u.toString();
  }

  const apnsPayload = {
    aps: {
      alert: {title, body},
      sound: "default",
    },
  };
  if (openDayStr) {
    apnsPayload.openDay = openDayStr;
  }

  const message = {
    tokens,
    notification: {title, body},
    data: dataStrings,
    android: {
      priority: "high",
      notification: {title, body},
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: apnsPayload,
    },
    webpush: {
      fcmOptions: {link: webLink},
      notification: {title, body},
    },
  };

  const res = await admin.messaging().sendEachForMulticast(message);
  const invalid = [];
  let firstErrorDetail = null;
  res.responses.forEach((r, i) => {
    if (!r.success && r.error) {
      if (!firstErrorDetail) {
        firstErrorDetail = `${r.error.code}: ${r.error.message}`;
      }
      const c = r.error.code;
      if (c === "messaging/invalid-registration-token" ||
          c === "messaging/registration-token-not-registered") {
        invalid.push(tokens[i]);
      }
    }
  });
  if (invalid.length) {
    await removeInvalidFcmTokens(userId, invalid);
  }
  if (res.successCount > 0) {
    return {ok: true};
  }
  return {
    ok: false,
    reason: "delivery_failed",
    detail: firstErrorDetail || "no_successful_deliveries",
  };
}

/**
 * Build title/body for a TODO reminder push
 * @param {Array} todos - TODO events (for daily: due today and/or overdue)
 * @param {string} reminderType - Kind (e.g. Daily Garden Reminder)
 * @param {Object} plantIdToDisplayName - Plant id to label
 * @param {Object} [options] - Extra options
 * @param {string} [options.timeZone] - IANA zone (daily copy split)
 * @return {{title: string, body: string}} Title and body
 */
function buildTodoReminderPush(
    todos, reminderType, plantIdToDisplayName = {}, options = {},
) {
  const n = todos.length;
  const taskWord = n === 1 ? "task" : "tasks";
  const rt = typeof reminderType === "string" ? reminderType.trim() : "";
  const tz = options.timeZone || DEFAULT_REMINDER_TZ;

  if (rt === "Daily Garden Reminder") {
    const today = dayjs.tz(new Date(), tz).startOf("day");
    let dueToday = 0;
    let overdue = 0;
    for (const t of todos) {
      const d = eventDayToStartInTz(t.day, tz);
      if (!d) continue;
      if (d.isBefore(today, "day")) overdue++;
      else dueToday++;
    }
    if (overdue > 0 && dueToday > 0) {
      const b =
        "You have " + dueToday + " due today and " + overdue + " " +
        "overdue. Open the app to view them.";
      return {title: "Your garden tasks", body: b};
    }
    if (overdue > 0) {
      const b =
        "You have " + overdue + " overdue " + taskWord + ". " +
        "Open the app to view them.";
      return {title: "Overdue garden tasks", body: b};
    }
    return {
      title: "Your today's tasks",
      body: "You have " + n + " " + taskWord + " today. " +
        "Open the app to view them.",
    };
  }

  const advanceMatch = /^(\d+)-Day Advance Garden Reminder$/.exec(rt);
  if (advanceMatch) {
    const advanceDays = parseInt(advanceMatch[1], 10);
    if (advanceDays === 1) {
      return {
        title: "Your tomorrow's tasks",
        body: `You have ${n} ${taskWord} tomorrow. Open the app to view them.`,
      };
    }
    return {
      title: `Your tasks in ${advanceDays} days`,
      body:
        `You have ${n} ${taskWord} in ${advanceDays} days. ` +
        `Open the app to view them.`,
    };
  }

  // Test push and other custom types: compact list in body
  const title = rt || "Happy Tomato";
  const parts = todos.slice(0, 3).map((t) =>
    formatTodoLine(t, plantIdToDisplayName));
  let body = parts.join(" · ");
  if (n > 3) body += ` (+${n - 3} more)`;
  if (!body) body = `${n} garden task(s) — open the app for details.`;
  if (body.length > 220) body = body.slice(0, 217) + "...";
  return {title, body};
}

/**
 * Get TODOs due in X days (for advance reminders)
 * @param {Array} events - Array of event objects
 * @param {number} days - Number of days in advance
 * @param {string} [ianaTimeZone=DEFAULT_REMINDER_TZ] - IANA time zone
 * @return {Array} Filtered array of TODOs due in X days
 */
function getTodosInAdvance(events, days, ianaTimeZone = DEFAULT_REMINDER_TZ) {
  const targetDate = dayjs.tz(new Date(), ianaTimeZone)
      .add(days, "days")
      .startOf("day");

  console.log(
      `🔍 Looking for TODOs due on ${targetDate.format("YYYY-MM-DD")} ` +
      `(${days} days from now)`,
  );

  return events.filter((evt) => {
    const isTodoEvent = evt.isRecurringTodo ||
                       (typeof evt.title === "string" &&
                        evt.title.startsWith("TO DO:")) ||
                       (typeof evt.toDo === "string" &&
                        evt.toDo.startsWith("TO DO:"));

    if (!isTodoEvent || evt.completed) return false;

    const eventDate = eventDayToStartInTz(evt.day, ianaTimeZone);
    if (!eventDate) return false;
    return eventDate.isSame(targetDate, "day");
  });
}

/**
 * Callable Cloud Function: Send TODO reminder as web push
 * @param {Object} data - { todos, reminderType }
 * @param {Object} context - Firebase call context
 * @return {Promise<Object>} success flag; on failure includes failureReason.
 */
const sendTodoReminderPushHandler = async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send reminder pushes",
    );
  }

  const {todos, reminderType} = data || {};
  const userId = context.auth.uid;

  if (!todos || !Array.isArray(todos) || todos.length === 0) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "todos array with at least one item required",
    );
  }

  const reminderTypeStr =
    typeof reminderType === "string" && reminderType.trim() ?
      reminderType.trim() :
      "TODO Reminder";

  const plantIdToDisplayName = await getPlantIdToDisplayName(userId);
  const prefSnap = await admin.firestore()
      .collection("emailPreferences")
      .where("userId", "==", userId)
      .limit(1)
      .get();
  const tz = prefSnap.empty ?
    DEFAULT_REMINDER_TZ :
    getReminderIanaTimeZone(prefSnap.docs[0].data());

  const {title, body} = buildTodoReminderPush(
      todos, reminderTypeStr, plantIdToDisplayName, {timeZone: tz},
  );
  const result = await sendWebPushToUser(userId, title, body, {
    kind: "todo_reminder",
    openDay: openDayForCallableReminder(reminderTypeStr, tz),
  });

  if (result.ok) {
    return {success: true};
  }
  return {
    success: false,
    failureReason: result.reason,
    failureDetail: result.detail,
  };
};
exports.sendTodoReminderPush =
  functions.https.onCall(sendTodoReminderPushHandler);

/**
 * Callable Cloud Function: Send weekly summary as web push
 * @param {Object} _data - Callable request payload (unused)
 * @param {Object} context - Firebase call context (auth)
 * @return {Promise<{success: boolean, sent: (boolean|undefined)}>}
 */
const sendWeeklySummaryPushHandler = async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send weekly summary push",
    );
  }

  const userId = context.auth.uid;

  const eventsSnapshot = await admin.firestore()
      .collection("events")
      .where("userId", "==", userId)
      .get();

  const userEvents = eventsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const prefsSnap = await admin.firestore()
      .collection("emailPreferences")
      .where("userId", "==", userId)
      .limit(10)
      .get();
  let includedCategories = null;
  for (const d of prefsSnap.docs) {
    const v = d.data().reminderIncludedCategories;
    if (Array.isArray(v)) {
      includedCategories = v;
      break;
    }
  }

  const {plantIdToCategory} = await getPlantMapsForUser(userId);
  const visibleEvents = filterEventsForReminderCalendar(
      userEvents,
      plantIdToCategory,
      includedCategories,
  );

  const weekTz = prefsSnap.empty ?
    DEFAULT_REMINDER_TZ :
    getReminderIanaTimeZone(prefsSnap.docs[0].data());
  const weekData = getTodosForWeekAhead(visibleEvents, weekTz);
  const totalCount = weekData.overdue.length +
    Object.values(weekData.byDay).reduce((sum, arr) => sum + arr.length, 0);

  if (totalCount === 0) {
    return {success: true, sent: false};
  }

  const title = "Your week ahead";
  const body = `You have ${totalCount} garden task${
      totalCount !== 1 ? "s" : ""} this week. Open the app to view them.`;
  const result = await sendWebPushToUser(userId, title, body, {
    kind: "weekly_summary",
    openDay: openDayInTz(0, weekTz),
  });

  return {success: result.ok, sent: result.ok};
};
exports.sendWeeklySummaryPush =
  functions.https.onCall(sendWeeklySummaryPushHandler);

/**
 * Cloud Function: Send Daily Reminders
 * Runs every REMINDER_CRON_MINUTES; sends in a short window after user time
 */
exports.sendDailyReminders = functions.pubsub
    .schedule(`*/${REMINDER_CRON_MINUTES} * * * *`)
    .timeZone("Europe/Vilnius") // Change to your timezone
    .onRun(async (context) => {
      console.log("🔍 Checking for daily reminders to send...");

      const now = dayjs.tz(new Date(), "Europe/Vilnius");

      console.log(
          `⏰ Current time in Vilnius: ${now.format("YYYY-MM-DD HH:mm:ss")}`,
      );

      try {
        // Get all email preferences
        const prefsSnapshot = await admin.firestore()
            .collection("emailPreferences")
            .where("enabled", "==", true)
            .where("dailyReminder", "==", true)
            .get();

        if (prefsSnapshot.empty) {
          console.log("No users with daily reminders enabled");
          return null;
        }

        // Process each user
        for (const prefDoc of prefsSnapshot.docs) {
          const prefs = prefDoc.data();
          const userId = prefs.userId;
          const tz = getReminderIanaTimeZone(prefs);
          const userNow = dayjs.tz(new Date(), tz);

          const dailyTime =
            (typeof prefs.dailyReminderTime === "string" &&
              prefs.dailyReminderTime.trim()) ?
              prefs.dailyReminderTime.trim() :
              (prefs.reminderTime || "09:00");

          if (!isInReminderSendWindow(userNow, dailyTime)) {
            continue;
          }

          // Check if we already sent today
          const lastSent = prefs.lastAutoReminderSent ?
            dayjs.tz(
                prefs.lastAutoReminderSent.toDate(),
                tz,
            ) : null;
          if (lastSent && lastSent.isSame(userNow, "day")) {
            console.log(
                `Already sent daily reminder to ${prefs.userEmail} today ` +
                `(last sent: ${lastSent.format("YYYY-MM-DD HH:mm")})`,
            );
            continue;
          }

          if (!userId) {
            console.log(
                `No userId stored for ${prefs.userEmail}. ` +
                `Ask user to re-save notification settings.`,
            );
            continue;
          }

          // Get user's events by userId
          const eventsSnapshot = await admin.firestore()
              .collection("events")
              .where("userId", "==", userId)
              .get();

          const userEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const {plantIdToDisplayName, plantIdToCategory} =
            await getPlantMapsForUser(userId);
          const included = Array.isArray(prefs.reminderIncludedCategories) ?
            prefs.reminderIncludedCategories : null;
          const visibleEvents = filterEventsForReminderCalendar(
              userEvents,
              plantIdToCategory,
              included,
          );

          console.log(
              `Found ${userEvents.length} events for ${prefs.userEmail} ` +
              `(${visibleEvents.length} visible for reminders)`,
          );

          // Due/overdue TODOs: same calendar day as the app
          const dueTodos = getDueAndOverdueTodos(visibleEvents, tz);

          if (dueTodos.length === 0) {
            console.log(`No due TODOs for ${prefs.userEmail}`);
            continue;
          }

          console.log(`🔔 Sending daily push to ${prefs.userEmail} ` +
            `(${dueTodos.length} TODOs)`);
          const {title, body} = buildTodoReminderPush(
              dueTodos,
              "Daily Garden Reminder",
              plantIdToDisplayName,
              {timeZone: tz},
          );
          const result = await sendWebPushToUser(userId, title, body, {
            kind: "daily_reminder",
            openDay: openDayInTz(0, tz),
          });

          if (result.ok) {
            // Update last sent timestamp
            await admin.firestore()
                .collection("emailPreferences")
                .doc(prefDoc.id)
                .update({
                  lastAutoReminderSent: admin.firestore
                      .FieldValue.serverTimestamp(),
                });
          }
        }

        console.log("✅ Daily reminder check complete");
        return null;
      } catch (error) {
        console.error("❌ Error in sendDailyReminders:", error);
        return null;
      }
    });

/**
 * Cloud Function: Send Advance Reminders
 * Runs every hour and checks if it's time to send advance reminders
 */
exports.sendAdvanceReminders = functions.pubsub
    .schedule(`*/${REMINDER_CRON_MINUTES} * * * *`)
    .timeZone("Europe/Vilnius") // Change to your timezone
    .onRun(async (context) => {
      console.log("🔍 Checking for advance reminders to send...");

      const now = dayjs.tz(new Date(), "Europe/Vilnius");

      console.log(
          `⏰ Current time in Vilnius: ${now.format("YYYY-MM-DD HH:mm:ss")}`,
      );

      try {
        // Get all email preferences with advance reminders enabled
        const prefsSnapshot = await admin.firestore()
            .collection("emailPreferences")
            .where("enabled", "==", true)
            .where("advanceReminders", "==", true)
            .get();

        if (prefsSnapshot.empty) {
          console.log("No users with advance reminders enabled");
          return null;
        }

        // Process each user
        for (const prefDoc of prefsSnapshot.docs) {
          const prefs = prefDoc.data();
          const userId = prefs.userId;
          const tz = getReminderIanaTimeZone(prefs);
          const userNow = dayjs.tz(new Date(), tz);

          console.log(
              `\n👤 Checking user: ${prefs.userEmail}`,
          );
          const advanceTime =
            (typeof prefs.advanceReminderTime === "string" &&
              prefs.advanceReminderTime.trim()) ?
              prefs.advanceReminderTime.trim() :
              (prefs.reminderTime || "09:00");

          console.log(
              `   Settings: advanceDays=${prefs.advanceDays || 3}, ` +
              `advanceReminderTime=${advanceTime}`,
          );

          if (!isInReminderSendWindow(userNow, advanceTime)) {
            console.log(`   ⏰ Not in advance reminder send window`);
            continue;
          }

          console.log(`   ✅ In advance reminder send window`);

          // Check if we already sent today
          const lastSent = prefs.lastAutoAdvanceReminderSent ?
            dayjs.tz(
                prefs.lastAutoAdvanceReminderSent.toDate(),
                tz,
            ) : null;
          if (lastSent && lastSent.isSame(userNow, "day")) {
            console.log(
                `   ⚠️  Already sent advance reminder today ` +
                `(last sent: ${lastSent.format("YYYY-MM-DD HH:mm")})`,
            );
            continue;
          }

          if (lastSent) {
            console.log(
                `   ✅ Last sent: ${lastSent.format("YYYY-MM-DD HH:mm")} ` +
                `(not today)`,
            );
          } else {
            console.log(`   ✅ Never sent before`);
          }

          if (!userId) {
            console.log(
                `   ⚠️  No userId stored for ${prefs.userEmail}. ` +
                `Ask user to re-save notification settings.`,
            );
            continue;
          }

          // Get user's events by userId
          const eventsSnapshot = await admin.firestore()
              .collection("events")
              .where("userId", "==", userId)
              .get();

          const userEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const {plantIdToDisplayName, plantIdToCategory} =
            await getPlantMapsForUser(userId);
          const included = Array.isArray(prefs.reminderIncludedCategories) ?
            prefs.reminderIncludedCategories : null;
          const visibleEvents = filterEventsForReminderCalendar(
              userEvents,
              plantIdToCategory,
              included,
          );

          console.log(
              `Found ${userEvents.length} events for ${prefs.userEmail} ` +
              `(${visibleEvents.length} visible for reminders)`,
          );

          // Get advance TODOs
          const advanceDays = prefs.advanceDays || 3;
          const targetDate = dayjs.tz(new Date(), tz)
              .add(advanceDays, "days")
              .startOf("day");

          console.log(
              `   🎯 Looking for TODOs on ${targetDate.format("YYYY-MM-DD")} ` +
              `(${advanceDays} days from now)`,
          );

          const advanceTodos = getTodosInAdvance(
              visibleEvents, advanceDays, tz,
          );

          if (advanceTodos.length === 0) {
            console.log(
                `   ⚠️  No TODOs found for ${targetDate.format("YYYY-MM-DD")}`,
            );

            // Show all TODO dates for debugging
            const allTodos = visibleEvents.filter((evt) => {
              const isTodoEvent = evt.isRecurringTodo ||
                (typeof evt.title === "string" &&
                 evt.title.startsWith("TO DO:")) ||
                (typeof evt.toDo === "string" &&
                 evt.toDo.startsWith("TO DO:"));
              return isTodoEvent && !evt.completed;
            });

            if (allTodos.length > 0) {
              console.log(`   📋 All TODO dates:`);
              const todoDates = new Set();
              allTodos.forEach((todo) => {
                const d0 = eventDayToStartInTz(todo.day, tz);
                if (d0) todoDates.add(d0.format("YYYY-MM-DD"));
              });
              [...todoDates].sort().forEach((date) => {
                const count = allTodos.filter((t) => {
                  const d0 = eventDayToStartInTz(t.day, tz);
                  return d0 && d0.format("YYYY-MM-DD") === date;
                }).length;
                console.log(`      ${date}: ${count} TODO(s)`);
              });
            } else {
              console.log(`   📋 No TODOs at all for this user`);
            }
            continue;
          }

          console.log(
              `   ✅ Found ${advanceTodos.length} TODO(s) for target date`,
          );
          console.log(
              `🔔 Sending ${advanceDays}-day advance push to ` +
              `${prefs.userEmail}`,
          );

          const {title, body} = buildTodoReminderPush(
              advanceTodos,
              `${advanceDays}-Day Advance Garden Reminder`,
              plantIdToDisplayName,
          );
          const result = await sendWebPushToUser(userId, title, body, {
            kind: "advance_reminder",
            openDay: openDayInTz(advanceDays, tz),
          });

          if (result.ok) {
            // Update last sent timestamp
            await admin.firestore()
                .collection("emailPreferences")
                .doc(prefDoc.id)
                .update({
                  lastAutoAdvanceReminderSent: admin.firestore
                      .FieldValue.serverTimestamp(),
                });
          }
        }

        console.log("✅ Advance reminder check complete");
        return null;
      } catch (error) {
        console.error("❌ Error in sendAdvanceReminders:", error);
        return null;
      }
    });

/**
 * Cloud Function: Send Weekly Summary
 * Runs on the user's chosen weekday and time; sends week-ahead push
 */
exports.sendWeeklySummary = functions.pubsub
    .schedule(`*/${REMINDER_CRON_MINUTES} * * * *`)
    .timeZone("Europe/Vilnius")
    .onRun(async (context) => {
      console.log("🔍 Checking for weekly summary to send...");

      try {
        const prefsSnapshot = await admin.firestore()
            .collection("emailPreferences")
            .where("enabled", "==", true)
            .where("weeklySummary", "==", true)
            .get();

        if (prefsSnapshot.empty) {
          console.log("No users with weekly summary enabled");
          return null;
        }

        for (const prefDoc of prefsSnapshot.docs) {
          const prefs = prefDoc.data();
          const userId = prefs.userId;
          const tz = getReminderIanaTimeZone(prefs);
          const userNow = dayjs.tz(new Date(), tz);

          let summaryDow = parseInt(prefs.weeklySummaryDay, 10);
          if (Number.isNaN(summaryDow) || summaryDow < 0 || summaryDow > 6) {
            summaryDow = 1;
          }

          if (userNow.day() !== summaryDow) {
            continue;
          }

          const weeklyTime = prefs.weeklySummaryTime || "08:00";
          if (!isInReminderSendWindow(userNow, weeklyTime)) {
            continue;
          }

          const lastSent = prefs.lastWeeklySummarySent ?
            dayjs.tz(
                prefs.lastWeeklySummarySent.toDate(),
                tz,
            ) : null;
          if (lastSent && lastSent.isSame(userNow, "isoWeek")) {
            console.log(
                `Already sent weekly summary to ${prefs.userEmail} ` +
                `this ISO week`,
            );
            continue;
          }

          if (!userId) {
            console.log(
                `No userId for ${prefs.userEmail}, skipping weekly summary`,
            );
            continue;
          }

          const eventsSnapshot = await admin.firestore()
              .collection("events")
              .where("userId", "==", userId)
              .get();

          const userEvents = eventsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const {plantIdToCategory} = await getPlantMapsForUser(userId);
          const included = Array.isArray(prefs.reminderIncludedCategories) ?
            prefs.reminderIncludedCategories : null;
          const visibleEvents = filterEventsForReminderCalendar(
              userEvents,
              plantIdToCategory,
              included,
          );

          const weekData = getTodosForWeekAhead(visibleEvents, tz);
          const totalCount = weekData.overdue.length +
            Object.values(weekData.byDay).reduce(
                (sum, arr) => sum + arr.length, 0);

          if (totalCount === 0) {
            console.log(`No TODOs for week ahead for ${prefs.userEmail}`);
            continue;
          }

          console.log(
              `🔔 Sending weekly summary push to ${prefs.userEmail} ` +
              `(${totalCount} tasks)`,
          );

          const title = "Your week ahead";
          const body = `You have ${totalCount} garden task${
            totalCount !== 1 ? "s" : ""} this week. Open the app to view them.`;
          const result = await sendWebPushToUser(userId, title, body, {
            kind: "weekly_summary",
            openDay: openDayInTz(0, tz),
          });

          if (result.ok) {
            await admin.firestore()
                .collection("emailPreferences")
                .doc(prefDoc.id)
                .update({
                  lastWeeklySummarySent: admin.firestore
                      .FieldValue.serverTimestamp(),
                });
          }
        }

        console.log("✅ Weekly summary check complete");
        return null;
      } catch (error) {
        console.error("❌ Error in sendWeeklySummary:", error);
        return null;
      }
    });
