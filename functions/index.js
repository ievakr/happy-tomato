const functions = require("firebase-functions");
const admin = require("firebase-admin");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

// Set default timezone to Europe/Vilnius
dayjs.tz.setDefault("Europe/Vilnius");

admin.initializeApp();

/**
 * Fetch user's plants and build plantId -> displayName map
 * @param {string} userId - User ID
 * @return {Promise<Object>} Map of plantId to display name
 */
async function getPlantIdToDisplayName(userId) {
  if (!userId) return {};
  const plantsSnap = await admin.firestore()
      .collection("plants")
      .where("userId", "==", userId)
      .get();
  const map = {};
  plantsSnap.docs.forEach((d) => {
    const p = d.data();
    const name = p.variety ?
      `${p.category} - ${p.variety}` :
      (p.category || p.name || d.id);
    map[d.id] = name;
  });
  return map;
}

/**
 * Get TODOs that are due today or overdue
 * @param {Array} events - Array of event objects
 * @return {Array} Filtered array of due/overdue TODOs
 */
function getDueAndOverdueTodos(events) {
  const today = dayjs.tz(new Date(), "Europe/Vilnius").startOf("day");

  return events.filter((evt) => {
    // Check if it's a TODO
    const isTodoEvent = evt.isRecurringTodo ||
                       (typeof evt.title === "string" &&
                        evt.title.startsWith("TO DO:")) ||
                       (typeof evt.toDo === "string" &&
                        evt.toDo.startsWith("TO DO:"));

    if (!isTodoEvent || evt.completed) return false;

    const eventDate = dayjs.tz(evt.day, "Europe/Vilnius").startOf("day");

    // Include if due today or overdue
    return eventDate.isSameOrBefore(today, "day");
  });
}

/**
 * Get TODOs for the week ahead (Monday through Sunday)
 * Used for weekly summary email sent on Sunday/Monday
 * @param {Array} events - Array of event objects
 * @return {Object} { overdue: [], byDay: { 'YYYY-MM-DD': [] } }
 */
function getTodosForWeekAhead(events) {
  const now = dayjs.tz(new Date(), "Europe/Vilnius");
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

    const eventDate = dayjs.tz(evt.day, "Europe/Vilnius").startOf("day");

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
    todo.labels.map((id) => plantIdToDisplayName[id] || id).join(", ") :
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
 * Send web push to all registered devices for userId
 * @param {string} userId - Firebase Auth UID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} dataPayload - Stringifiable data for the client
 * @return {Promise<boolean>} Whether at least one push succeeded
 */
async function sendWebPushToUser(userId, title, body, dataPayload = {}) {
  const tokens = await getFcmTokensForUser(userId);
  if (tokens.length === 0) {
    return false;
  }

  const dataStrings = {};
  for (const [k, v] of Object.entries(dataPayload)) {
    dataStrings[String(k)] = v == null ? "" : String(v);
  }

  const message = {
    tokens,
    notification: {title, body},
    webpush: {
      fcmOptions: {link: PUSH_LINK},
    },
    data: dataStrings,
  };

  const res = await admin.messaging().sendEachForMulticast(message);
  const invalid = [];
  res.responses.forEach((r, i) => {
    if (!r.success && r.error) {
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
  return res.successCount > 0;
}

/**
 * Build short title/body for a TODO reminder push
 * @param {Array} todos - TODO events
 * @param {string} reminderType - Title line
 * @param {Object} plantIdToDisplayName - Plant id to label
 * @return {{title: string, body: string}}
 */
function buildTodoReminderPush(todos, reminderType, plantIdToDisplayName = {}) {
  const title = reminderType || "Happy Tomato";
  const n = todos.length;
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
 * @return {Array} Filtered array of TODOs due in X days
 */
function getTodosInAdvance(events, days) {
  const targetDate = dayjs.tz(new Date(), "Europe/Vilnius")
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

    const eventDate = dayjs.tz(evt.day, "Europe/Vilnius").startOf("day");
    return eventDate.isSame(targetDate, "day");
  });
}

/**
 * Callable Cloud Function: Send TODO reminder as web push
 * @param {Object} data - { todos, reminderType }
 * @param {Object} context - Firebase call context
 * @return {Promise<{success: boolean}>}
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
  const {title, body} = buildTodoReminderPush(
      todos, reminderTypeStr, plantIdToDisplayName);
  const success = await sendWebPushToUser(userId, title, body, {
    kind: "todo_reminder",
  });

  return {success};
};
exports.sendTodoReminderPush =
  functions.https.onCall(sendTodoReminderPushHandler);

/**
 * Callable Cloud Function: Send weekly summary as web push
 * @param {Object} context - Firebase call context (auth)
 * @return {Promise<{success: boolean}>}
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

  const weekData = getTodosForWeekAhead(userEvents);
  const totalCount = weekData.overdue.length +
    Object.values(weekData.byDay).reduce((sum, arr) => sum + arr.length, 0);

  if (totalCount === 0) {
    return {success: true};
  }

  const title = "Your week ahead";
  const body = `You have ${totalCount} garden task${
    totalCount !== 1 ? "s" : ""} this week. Open the app to view them.`;
  const success = await sendWebPushToUser(userId, title, body, {
    kind: "weekly_summary",
  });

  return {success};
};
exports.sendWeeklySummaryPush =
  functions.https.onCall(sendWeeklySummaryPushHandler);

/**
 * Cloud Function: Send Daily Reminders
 * Runs every hour and checks if it's time to send reminders
 */
exports.sendDailyReminders = functions.pubsub
    .schedule("0 * * * *") // Every hour at minute 0
    .timeZone("Europe/Vilnius") // Change to your timezone
    .onRun(async (context) => {
      console.log("🔍 Checking for daily reminders to send...");

      const now = dayjs.tz(new Date(), "Europe/Vilnius");
      const currentHour = now.hour();

      console.log(
          `⏰ Current time in Vilnius: ` +
          `${now.format("YYYY-MM-DD HH:mm:ss")} (Hour: ${currentHour})`,
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

          // Parse reminder time
          const [reminderHour] =
            prefs.reminderTime.split(":").map(Number);

          // Check if it's time to send (within the current hour)
          if (currentHour !== reminderHour) {
            console.log(`Not time yet for ${prefs.userEmail} ` +
              `(wants ${prefs.reminderTime}, ` +
              `now is ${currentHour}:00)`);
            continue;
          }

          // Check if we already sent today
          const lastSent = prefs.lastAutoReminderSent ?
            dayjs.tz(
                prefs.lastAutoReminderSent.toDate(),
                "Europe/Vilnius",
            ) : null;
          if (lastSent && lastSent.isSame(now, "day")) {
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

          console.log(
              `Found ${userEvents.length} events for ${prefs.userEmail}`,
          );

          // Get due/overdue TODOs
          const dueTodos = getDueAndOverdueTodos(userEvents);

          if (dueTodos.length === 0) {
            console.log(`No due TODOs for ${prefs.userEmail}`);
            continue;
          }

          console.log(`🔔 Sending daily push to ${prefs.userEmail} ` +
            `(${dueTodos.length} TODOs)`);

          const plantIdToDisplayName =
            await getPlantIdToDisplayName(userId);
          const {title, body} = buildTodoReminderPush(
              dueTodos,
              "Daily Garden Reminder",
              plantIdToDisplayName,
          );
          const success = await sendWebPushToUser(userId, title, body, {
            kind: "daily_reminder",
          });

          if (success) {
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
    .schedule("0 * * * *") // Every hour at :00
    .timeZone("Europe/Vilnius") // Change to your timezone
    .onRun(async (context) => {
      console.log("🔍 Checking for advance reminders to send...");

      const now = dayjs.tz(new Date(), "Europe/Vilnius");
      const currentHour = now.hour();

      console.log(
          `⏰ Current time in Vilnius: ` +
          `${now.format("YYYY-MM-DD HH:mm:ss")} (Hour: ${currentHour})`,
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

          console.log(
              `\n👤 Checking user: ${prefs.userEmail}`,
          );
          console.log(
              `   Settings: advanceDays=${prefs.advanceDays || 3}, ` +
              `reminderTime=${prefs.reminderTime}`,
          );

          // Parse reminder time
          const [reminderHour] =
            prefs.reminderTime.split(":").map(Number);

          // Check if it's time to send (within the current hour)
          if (currentHour !== reminderHour) {
            console.log(
                `   ⏰ Not time yet (wants ${reminderHour}:00, ` +
                `now is ${currentHour}:00)`,
            );
            continue;
          }

          console.log(`   ✅ It's the right hour!`);

          // Check if we already sent today
          const lastSent = prefs.lastAutoAdvanceReminderSent ?
            dayjs.tz(
                prefs.lastAutoAdvanceReminderSent.toDate(),
                "Europe/Vilnius",
            ) : null;
          if (lastSent && lastSent.isSame(now, "day")) {
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

          console.log(
              `Found ${userEvents.length} events for ${prefs.userEmail}`,
          );

          // Get advance TODOs
          const advanceDays = prefs.advanceDays || 3;
          const targetDate = dayjs.tz(new Date(), "Europe/Vilnius")
              .add(advanceDays, "days")
              .startOf("day");

          console.log(
              `   🎯 Looking for TODOs on ${targetDate.format("YYYY-MM-DD")} ` +
              `(${advanceDays} days from now)`,
          );

          const advanceTodos = getTodosInAdvance(userEvents, advanceDays);

          if (advanceTodos.length === 0) {
            console.log(
                `   ⚠️  No TODOs found for ${targetDate.format("YYYY-MM-DD")}`,
            );

            // Show all TODO dates for debugging
            const allTodos = userEvents.filter((evt) => {
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
                const date = dayjs.tz(todo.day, "Europe/Vilnius")
                    .format("YYYY-MM-DD");
                todoDates.add(date);
              });
              [...todoDates].sort().forEach((date) => {
                const count = allTodos.filter((t) =>
                  dayjs.tz(t.day, "Europe/Vilnius")
                      .format("YYYY-MM-DD") === date,
                ).length;
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

          const plantIdToDisplayName =
            await getPlantIdToDisplayName(userId);
          const {title, body} = buildTodoReminderPush(
              advanceTodos,
              `${advanceDays}-Day Advance Garden Reminder`,
              plantIdToDisplayName,
          );
          const success = await sendWebPushToUser(userId, title, body, {
            kind: "advance_reminder",
          });

          if (success) {
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
 * Runs every hour on Sunday and Monday; sends "here's your week ahead" email
 */
exports.sendWeeklySummary = functions.pubsub
    .schedule("0 * * * *") // Every hour at :00
    .timeZone("Europe/Vilnius")
    .onRun(async (context) => {
      console.log("🔍 Checking for weekly summary to send...");

      const now = dayjs.tz(new Date(), "Europe/Vilnius");
      const dayOfWeek = now.day(); // 0=Sun, 1=Mon, ...
      const currentHour = now.hour();

      // Only run on Sunday or Monday
      if (dayOfWeek !== 0 && dayOfWeek !== 1) {
        console.log(
            `Not Sunday/Monday (day=${dayOfWeek}), skipping weekly summary`,
        );
        return null;
      }

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

          const weeklyTime = prefs.weeklySummaryTime || "08:00";
          const [summaryHour] = weeklyTime.split(":").map(Number);

          if (currentHour !== summaryHour) {
            continue;
          }

          // Only send once per week
          const lastSent = prefs.lastWeeklySummarySent ?
            dayjs.tz(
                prefs.lastWeeklySummarySent.toDate(),
                "Europe/Vilnius",
            ) : null;
          if (lastSent) {
            const thisWeekStart = now.day() === 0 ?
              now.add(1, "day").startOf("day") :
              now.startOf("week").add(1, "day");
            const lastSentWeekStart = lastSent.day() === 0 ?
              lastSent.add(1, "day").startOf("day") :
              lastSent.startOf("week").add(1, "day");
            if (thisWeekStart.isSame(lastSentWeekStart, "day")) {
              console.log(
                  `Already sent weekly summary to ${prefs.userEmail} this week`,
              );
              continue;
            }
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

          const weekData = getTodosForWeekAhead(userEvents);
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
          const success = await sendWebPushToUser(userId, title, body, {
            kind: "weekly_summary",
          });

          if (success) {
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
