const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
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
 * Format TODO list for email
 * @param {Array} todos - Array of TODO objects
 * @param {boolean} isAdvanceReminder - Whether this is an advance reminder
 * @param {number} advanceDays - Number of days in advance (if applicable)
 * @param {Object} plantIdToDisplayName - Map of plant ID to display name
 * @return {string} Formatted TODO list string
 */
function formatTodoList(
    todos, isAdvanceReminder = false, advanceDays = 0,
    plantIdToDisplayName = {},
) {
  if (!todos || todos.length === 0) {
    return "No TODOs found.";
  }

  return todos.map((todo) => {
    const dueDate = new Date(todo.day).toLocaleDateString();

    // Get action name
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

    // Resolve plant IDs to display names
    const plantLabels = todo.labels && todo.labels.length > 0 ?
      todo.labels.map((id) => plantIdToDisplayName[id] || id).join(", ") :
      "";

    // Determine status relative to today (not advance date)
    const today = new Date();
    const dueDateObj = new Date(todo.day);
    today.setHours(0, 0, 0, 0);
    dueDateObj.setHours(0, 0, 0, 0);

    let statusEmoji = "📝";
    let statusText = "";

    if (isAdvanceReminder) {
      // For advance reminders, show status relative to the advance date
      statusEmoji = "📅";
      const dayWord = advanceDays !== 1 ? "s" : "";
      statusText = ` - Coming up in ${advanceDays} day${dayWord}`;
    } else if (dueDateObj < today) {
      statusEmoji = "⚠️";
      statusText = " - OVERDUE";
    } else if (dueDateObj.getTime() === today.getTime()) {
      statusEmoji = "📅";
      statusText = " - Due Today";
    }

    // Build todo line
    let todoLine = `${statusEmoji} `;
    if (actionName) {
      todoLine += actionName;
      if (plantLabels) {
        todoLine += ` (${plantLabels})`;
      }
    } else {
      todoLine += "Unnamed TODO";
      if (plantLabels) {
        todoLine += ` (${plantLabels})`;
      }
    }

    todoLine += ` - Due: ${dueDate}${statusText}`;
    return todoLine;
  }).join("\n");
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
 * Send weekly summary email (here's your week ahead)
 * @param {string} userEmail - Recipient email
 * @param {string} userName - Recipient name
 * @param {Object} weekData - { overdue, byDay, weekStart, weekEnd }
 * @param {Object} plantIdToDisplayName - Map of plant ID to display name
 * @return {Promise<boolean>} Success status
 */
async function sendWeeklySummaryEmail(userEmail, userName, weekData,
    plantIdToDisplayName = {}) {
  const config = functions.config().sendgrid;
  sgMail.setApiKey(config.api_key);

  const {overdue, byDay, weekStart, weekEnd} = weekData;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const htmlSections = [];
  const textSections = [];

  if (overdue.length > 0) {
    const overdueLines = overdue.map((t) =>
      `⚠️ ${formatTodoLine(t, plantIdToDisplayName)}`,
    );
    htmlSections.push(
        `<p style="margin-bottom: 8px;"><strong>Overdue</strong></p>` +
        `<ul style="list-style: none; padding-left: 0; margin-bottom: 20px;">` +
        overdueLines.map((l) =>
          `<li style="margin: 6px 0;">${l}</li>`).join("") +
        `</ul>`,
    );
    textSections.push("Overdue:\n" + overdueLines.join("\n") + "\n");
  }

  for (let d = weekStart;
    d.isSameOrBefore(weekEnd, "day");
    d = d.add(1, "day")) {
    const key = d.format("YYYY-MM-DD");
    const todos = byDay[key] || [];
    if (todos.length === 0) continue;

    const dayLabel = dayNames[d.day()] + " " + d.format("MMM D");
    const lines = todos.map((t) => formatTodoLine(t, plantIdToDisplayName));

    htmlSections.push(
        `<p style="margin-bottom: 8px;"><strong>${dayLabel}</strong></p>` +
        `<ul style="list-style: none; padding-left: 0; margin-bottom: 20px;">` +
        lines.map((l) => `<li style="margin: 6px 0;">• ${l}</li>`).join("") +
        `</ul>`,
    );
    const textPart = lines.map((l) => `  • ${l}`).join("\n");
    textSections.push(`${dayLabel}:\n` + textPart + "\n");
  }

  const totalCount = overdue.length +
    Object.values(byDay).reduce((sum, arr) => sum + arr.length, 0);

  if (totalCount === 0) {
    return true; // Nothing to send
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; 
    margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; border-radius: 8px; 
      padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #10b981; margin: 0 0 20px 0;">
        📅 Your Week Ahead</h1>
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hi ${userName || "Garden Friend"}! 👋
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
          Here's your garden at a glance for the week:
        </p>
        ${htmlSections.join("")}
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Happy Gardening! 🌻<br>
          <em>Happy Tomato Garden Planner</em>
        </p>
      </div>
      <p style="text-align: center; color: #9ca3af; 
      font-size: 12px; margin-top: 20px;">
        ${new Date().toLocaleDateString()} | 
        <a href="https://happytomato-c4fed.web.app" 
        style="color: #10b981; text-decoration: none;">Open App</a>
      </p>
    </div>
  `;

  const msg = {
    to: userEmail,
    from: {
      email: config.from_email,
      name: "Happy Tomato Garden Planner",
    },
    subject: `Your Week Ahead – ${totalCount} Task${
      totalCount !== 1 ? "s" : ""} for Your Garden`,
    text: `Hi ${userName || "Garden Friend"}!\n\n` +
          "Here's your week ahead:\n\n" +
          textSections.join("\n") +
          "\nHappy Gardening!\n- Happy Tomato Garden Planner",
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Weekly summary sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send weekly summary to ${userEmail}:`, error);
    if (error.response) {
      console.error("SendGrid error details:", error.response.body);
    }
    return false;
  }
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
 * Send email using SendGrid
 * @param {string} userEmail - Recipient email address
 * @param {string} userName - Recipient name
 * @param {Array} todos - Array of TODO objects
 * @param {string} reminderType - Type of reminder being sent
 * @param {Object} plantIdToDisplayName - Map of plant ID to display name
 * @return {Promise<boolean>} Success status
 */
async function sendEmail(userEmail, userName, todos, reminderType,
    plantIdToDisplayName = {}) {
  const config = functions.config().sendgrid;

  // Initialize SendGrid with API key
  sgMail.setApiKey(config.api_key);

  // Determine the context date and message based on reminder type
  let contextDate = new Date();
  let reminderMessage = "";
  let isAdvanceReminder = false;
  let daysAhead = 0;

  if (reminderType.includes("Advance")) {
    // Extract days from reminder type (e.g., "3-Day Advance Garden Reminder")
    const match = reminderType.match(/(\d+)-Day/);
    if (match) {
      isAdvanceReminder = true;
      daysAhead = parseInt(match[1], 10);
      contextDate = new Date();
      contextDate.setDate(contextDate.getDate() + daysAhead);
      reminderMessage = `You have <strong>${todos.length} garden task${
        todos.length !== 1 ? "s" : ""}</strong> coming up in ${daysAhead} day${
        daysAhead !== 1 ? "s" : ""} (${contextDate.toLocaleDateString()}):`;
    }
  } else {
    reminderMessage = `You have <strong>${todos.length} garden task${
      todos.length !== 1 ? "s" : ""}</strong> for today (${
      new Date().toLocaleDateString()}):`;
  }

  // Create email HTML content
  const todoListHtml = formatTodoList(todos, isAdvanceReminder, daysAhead,
      plantIdToDisplayName)
      .split("\n")
      .map((line) => `<li style="margin: 10px 0;">${line}</li>`)
      .join("");

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; 
    margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; border-radius: 8px; 
      padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #10b981; margin: 0 0 20px 0;">
        🌱 ${reminderType}</h1>
        <p style="font-size: 16px; color: #374151; 
        margin-bottom: 20px;">
          Hi ${userName || "Garden Friend"}! 👋
        </p>
        <p style="font-size: 14px; color: #6b7280; 
        margin-bottom: 20px;">
          ${reminderMessage}
        </p>
        <ul style="list-style: none; padding: 0; margin: 20px 0;">
          ${todoListHtml}
        </ul>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Happy Gardening! 🌻<br>
          <em>Happy Tomato Garden Planner</em>
        </p>
      </div>
      <p style="text-align: center; color: #9ca3af; 
      font-size: 12px; margin-top: 20px;">
        ${new Date().toLocaleDateString()} | 
        <a href="https://happytomato-c4fed.web.app" 
        style="color: #10b981; text-decoration: none;">Open App</a>
      </p>
    </div>
  `;

  // Create plain text version with appropriate message
  let plainTextMessage = "";
  if (isAdvanceReminder) {
    plainTextMessage = `You have ${todos.length} garden task${
      todos.length !== 1 ? "s" : ""} coming up in ${daysAhead} day${
      daysAhead !== 1 ? "s" : ""} (${contextDate.toLocaleDateString()})`;
  } else {
    plainTextMessage = `You have ${todos.length} garden task${
      todos.length !== 1 ? "s" : ""} for today (${
      new Date().toLocaleDateString()})`;
  }

  const msg = {
    to: userEmail,
    from: {
      email: config.from_email,
      name: "Happy Tomato Garden Planner",
    },
    subject: `${reminderType} - ${todos.length} Task${
      todos.length !== 1 ? "s" : ""} for Your Garden`,
    text: `Hi ${userName || "Garden Friend"}!\n\n` +
          `${plainTextMessage}:\n\n` +
          formatTodoList(todos, isAdvanceReminder, daysAhead,
              plantIdToDisplayName) +
          `\n\nHappy Gardening!\n- Happy Tomato Garden Planner`,
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${userEmail}:`, error);
    if (error.response) {
      console.error("SendGrid error details:", error.response.body);
    }
    return false;
  }
}

/**
 * Callable Cloud Function: Send TODO reminder email
 * Called by client for test emails and when app is open at reminder time
 * @param {Object} data - Call data (userEmail, userName, todos, reminderType)
 * @param {Object} context - Firebase call context (auth, etc.)
 * @return {Promise<{success: boolean}>}
 */
const sendTodoReminderEmailHandler = async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send reminder emails",
    );
  }

  const {userEmail, userName, todos, reminderType} = data || {};

  if (!userEmail || typeof userEmail !== "string") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "userEmail is required",
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail.trim())) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid email address",
    );
  }

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

  const userNameStr = typeof userName === "string" && userName.trim() ?
    userName.trim() :
    "Garden Friend";

  const plantIdToDisplayName = await getPlantIdToDisplayName(context.auth.uid);
  const success = await sendEmail(
      userEmail.trim(),
      userNameStr,
      todos,
      reminderTypeStr,
      plantIdToDisplayName,
  );

  return {success};
};
exports.sendTodoReminderEmail =
  functions.https.onCall(sendTodoReminderEmailHandler);

/**
 * Callable Cloud Function: Send Weekly Summary email
 * Called by client for test emails and manual "send now"
 * @param {Object} data - Call data (userEmail, userName)
 * @param {Object} context - Firebase call context (auth)
 * @return {Promise<{success: boolean}>}
 */
const sendWeeklySummaryEmailHandler = async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send weekly summary",
    );
  }

  const {userEmail, userName} = data || {};
  const userId = context.auth.uid;

  if (!userEmail || typeof userEmail !== "string") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "userEmail is required",
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail.trim())) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid email address",
    );
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
    Object.values(weekData.byDay).reduce((sum, arr) => sum + arr.length, 0);

  if (totalCount === 0) {
    return {success: true}; // Nothing to send, not an error
  }

  const plantIdToDisplayName = await getPlantIdToDisplayName(userId);
  const success = await sendWeeklySummaryEmail(
      userEmail.trim(),
      (typeof userName === "string" && userName.trim()) ?
        userName.trim() : "Garden Friend",
      weekData,
      plantIdToDisplayName,
  );

  return {success};
};
exports.sendWeeklySummaryEmail =
  functions.https.onCall(sendWeeklySummaryEmailHandler);

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

          console.log(`📧 Sending daily reminder to ${prefs.userEmail} ` +
            `(${dueTodos.length} TODOs)`);

          const plantIdToDisplayName =
            await getPlantIdToDisplayName(userId);
          const success = await sendEmail(
              prefs.userEmail,
              prefs.userName,
              dueTodos,
              "Daily Garden Reminder",
              plantIdToDisplayName,
          );

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
              `📧 Sending ${advanceDays}-day advance reminder to ` +
              `${prefs.userEmail}`,
          );

          const plantIdToDisplayName =
            await getPlantIdToDisplayName(userId);
          const success = await sendEmail(
              prefs.userEmail,
              prefs.userName,
              advanceTodos,
              `${advanceDays}-Day Advance Garden Reminder`,
              plantIdToDisplayName,
          );

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
              `📧 Sending weekly summary to ${prefs.userEmail} ` +
              `(${totalCount} tasks)`,
          );

          const plantIdToDisplayName =
            await getPlantIdToDisplayName(userId);
          const success = await sendWeeklySummaryEmail(
              prefs.userEmail,
              prefs.userName,
              weekData,
              plantIdToDisplayName,
          );

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
