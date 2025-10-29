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
 * Format TODO list for email
 * @param {Array} todos - Array of TODO objects
 * @param {boolean} isAdvanceReminder - Whether this is an advance reminder
 * @param {number} advanceDays - Number of days in advance (if applicable)
 * @return {string} Formatted TODO list string
 */
function formatTodoList(todos, isAdvanceReminder = false, advanceDays = 0) {
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
      statusText = ` - Coming up in ${advanceDays} day${advanceDays !== 1 ? "s" : ""}`;
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
 * @return {Promise<boolean>} Success status
 */
async function sendEmail(userEmail, userName, todos, reminderType) {
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
  const todoListHtml = formatTodoList(todos, isAdvanceReminder, daysAhead)
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
          formatTodoList(todos, isAdvanceReminder, daysAhead) +
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
