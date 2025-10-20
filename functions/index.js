const functions = require("firebase-functions");
const admin = require("firebase-admin");
const emailjs = require("@emailjs/nodejs");
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
 * Format TODO list for email
 * @param {Array} todos - Array of TODO objects
 * @return {string} Formatted TODO list string
 */
function formatTodoList(todos) {
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

    // Get plant labels
    const plantLabels = todo.labels && todo.labels.length > 0 ?
      todo.labels.join(", ") :
      "";

    // Determine status
    const today = new Date();
    const dueDateObj = new Date(todo.day);
    today.setHours(0, 0, 0, 0);
    dueDateObj.setHours(0, 0, 0, 0);

    let statusEmoji = "📝";
    let statusText = "";

    if (dueDateObj < today) {
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
 * Send email using EmailJS
 * @param {string} userEmail - Recipient email address
 * @param {string} userName - Recipient name
 * @param {Array} todos - Array of TODO objects
 * @param {string} reminderType - Type of reminder being sent
 * @return {Promise<boolean>} Success status
 */
async function sendEmail(userEmail, userName, todos, reminderType) {
  const config = functions.config().emailjs;

  const templateParams = {
    to_email: userEmail,
    to_name: userName || "Garden Friend",
    reminder_type: reminderType,
    todo_count: todos.length,
    todo_list: formatTodoList(todos),
    today_date: new Date().toLocaleDateString(),
    app_name: "Happy Tomato Garden Planner",
  };

  try {
    await emailjs.send(
        config.service_id,
        config.template_id,
        templateParams,
        {
          publicKey: config.public_key,
          privateKey: config.private_key,
        },
    );
    console.log(`✅ Email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${userEmail}:`, error);
    return false;
  }
}

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

        // Get all events
        const eventsSnapshot = await admin.firestore()
            .collection("events")
            .get();

        const events = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`Found ${events.length} events`);

        // Process each user
        for (const prefDoc of prefsSnapshot.docs) {
          const prefs = prefDoc.data();
          const userId = prefDoc.id;

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

          // Get due/overdue TODOs
          const dueTodos = getDueAndOverdueTodos(events);

          if (dueTodos.length === 0) {
            console.log(`No due TODOs for ${prefs.userEmail}`);
            continue;
          }

          console.log(`📧 Sending daily reminder to ${prefs.userEmail} ` +
            `(${dueTodos.length} TODOs)`);

          // Send email
          const success = await sendEmail(
              prefs.userEmail,
              prefs.userName,
              dueTodos,
              "Daily Garden Reminder",
          );

          if (success) {
            // Update last sent timestamp
            await admin.firestore()
                .collection("emailPreferences")
                .doc(userId)
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
    .schedule("0 * * * *") // Every hour at minute 0
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

        // Get all events
        const eventsSnapshot = await admin.firestore()
            .collection("events")
            .get();

        const events = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Process each user
        for (const prefDoc of prefsSnapshot.docs) {
          const prefs = prefDoc.data();
          const userId = prefDoc.id;

          // Parse reminder time
          const [reminderHour] =
            prefs.reminderTime.split(":").map(Number);

          // Check if it's time to send (within the current hour)
          if (currentHour !== reminderHour) {
            continue;
          }

          // Check if we already sent today
          const lastSent = prefs.lastAutoAdvanceReminderSent ?
            dayjs.tz(
                prefs.lastAutoAdvanceReminderSent.toDate(),
                "Europe/Vilnius",
            ) : null;
          if (lastSent && lastSent.isSame(now, "day")) {
            console.log(
                `Already sent advance reminder to ${prefs.userEmail} ` +
                `today (last sent: ${lastSent.format("YYYY-MM-DD HH:mm")})`,
            );
            continue;
          }

          // Get advance TODOs
          const advanceDays = prefs.advanceDays || 3;
          const advanceTodos = getTodosInAdvance(events, advanceDays);

          if (advanceTodos.length === 0) {
            console.log(`No advance TODOs for ${prefs.userEmail}`);
            continue;
          }

          console.log(`📧 Sending ${advanceDays}-day advance reminder to ` +
            `${prefs.userEmail} (${advanceTodos.length} TODOs)`);

          // Send email
          const success = await sendEmail(
              prefs.userEmail,
              prefs.userName,
              advanceTodos,
              `${advanceDays}-Day Advance Garden Reminder`,
          );

          if (success) {
            // Update last sent timestamp
            await admin.firestore()
                .collection("emailPreferences")
                .doc(userId)
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
