/**
 * Diagnostic Script for Advance Reminders
 *
 * This script helps diagnose why advance reminders aren't being sent.
 * Run with: node diagnose-advance-reminders.js
 *
 * Prerequisites:
 * 1. Firebase Admin SDK credentials
 * 2. Service account key JSON file
 */

const admin = require("firebase-admin");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.tz.setDefault("Europe/Vilnius");

// Initialize Firebase Admin
// Download key from: Firebase Console → Project Settings → Service Accounts
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Diagnose advance reminder system
 * @return {Promise<void>}
 */
async function diagnoseAdvanceReminders() {
  console.log("🔍 Diagnosing Advance Reminder System\n");
  console.log("=".repeat(60));

  const now = dayjs.tz(new Date(), "Europe/Vilnius");
  const timeStr = `${now.format("YYYY-MM-DD HH:mm:ss")} (Vilnius)`;
  console.log(`\n⏰ Current Time: ${timeStr}`);
  console.log(`   Hour: ${now.hour()}`);

  try {
    // Get email preferences
    console.log("\n📧 Checking Email Preferences...\n");

    const prefsSnapshot = await db.collection("emailPreferences")
        .where("enabled", "==", true)
        .where("advanceReminders", "==", true)
        .get();

    if (prefsSnapshot.empty) {
      console.log("❌ No users have advance reminders enabled!");
      console.log("\nPossible issues:");
      console.log("  1. advanceReminders field is not set to true");
      console.log("  2. enabled field is not set to true");
      console.log("  3. No email preferences documents exist");
      return;
    }

    const userCount = prefsSnapshot.size;
    console.log(`✅ Found ${userCount} user(s) with advance reminders\n`);

    // Check each user
    for (const prefDoc of prefsSnapshot.docs) {
      const prefs = prefDoc.data();
      const userId = prefDoc.id;

      console.log("-".repeat(60));
      console.log(`\n👤 User: ${prefs.userEmail}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Name: ${prefs.userName || "Not set"}`);

      // Check settings
      console.log("\n⚙️  Settings:");
      console.log(`   Enabled: ${prefs.enabled}`);
      console.log(`   Advance Reminders: ${prefs.advanceReminders}`);
      console.log(`   Advance Days: ${prefs.advanceDays || 3} days`);
      console.log(`   Reminder Time: ${prefs.reminderTime || "Not set"}`);

      // Parse reminder time
      const [reminderHour] = prefs.reminderTime.split(":").map(Number);
      console.log(`   Reminder Hour: ${reminderHour}:00`);
      console.log(`   Current Hour: ${now.hour()}:00`);

      if (now.hour() !== reminderHour) {
        const msg = `Not the right hour yet (waiting for ${reminderHour}:00)`;
        console.log(`   ⚠️  ${msg}`);
      } else {
        console.log(`   ✅ It's the right hour!`);
      }

      // Check last sent
      console.log("\n📅 Last Sent Info:");
      if (prefs.lastAutoAdvanceReminderSent) {
        const lastSent = dayjs.tz(
            prefs.lastAutoAdvanceReminderSent.toDate(),
            "Europe/Vilnius",
        );
        const lastSentStr = lastSent.format("YYYY-MM-DD HH:mm:ss");
        console.log(`   Last Sent: ${lastSentStr}`);
        console.log(`   Same Day as Today: ${lastSent.isSame(now, "day")}`);

        if (lastSent.isSame(now, "day")) {
          console.log(`   ⚠️  Already sent today - will skip`);
        } else {
          console.log(`   ✅ Not sent today yet`);
        }
      } else {
        console.log(`   Never sent before`);
        console.log(`   ✅ Ready to send first reminder`);
      }

      // Get user's events
      console.log("\n📋 Checking Events...");
      const eventsSnapshot = await db.collection("events")
          .where("userId", "==", userId)
          .get();

      console.log(`   Total Events: ${eventsSnapshot.size}`);

      const events = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter TODOs
      const todos = events.filter((evt) => {
        const isTodoEvent = evt.isRecurringTodo ||
          (typeof evt.title === "string" &&
           evt.title.startsWith("TO DO:")) ||
          (typeof evt.toDo === "string" &&
           evt.toDo.startsWith("TO DO:"));
        return isTodoEvent && !evt.completed;
      });

      console.log(`   Total TODOs: ${todos.length}`);

      // Check advance TODOs
      const advanceDays = prefs.advanceDays || 3;
      const targetDate = now.add(advanceDays, "days").startOf("day");

      const targetStr = targetDate.format("YYYY-MM-DD");
      const daysStr = `${advanceDays} days from now`;
      console.log(`\n🎯 Target Date: ${targetStr} (${daysStr})`);

      const advanceTodos = todos.filter((evt) => {
        const eventDate = dayjs.tz(evt.day, "Europe/Vilnius")
            .startOf("day");
        return eventDate.isSame(targetDate, "day");
      });

      console.log(`   TODOs on target date: ${advanceTodos.length}`);

      if (advanceTodos.length > 0) {
        console.log("\n   📝 TODOs found:");
        advanceTodos.forEach((todo, idx) => {
          const title = todo.title || todo.toDo || "Unnamed";
          const date = dayjs.tz(todo.day, "Europe/Vilnius")
              .format("YYYY-MM-DD");
          console.log(`      ${idx + 1}. ${title} (${date})`);
        });
        const todoCount = advanceTodos.length;
        console.log(`\n   ✅ Would send email with ${todoCount} TODO(s)`);
      } else {
        const noTodoMsg = `No TODOs found for ${targetStr}`;
        console.log(`   ⚠️  ${noTodoMsg}`);

        // Show all TODO dates to help debug
        if (todos.length > 0) {
          console.log("\n   All TODO dates:");
          const todoDates = new Set();
          todos.forEach((todo) => {
            const date = dayjs.tz(todo.day, "Europe/Vilnius")
                .format("YYYY-MM-DD");
            todoDates.add(date);
          });
          [...todoDates].sort().forEach((date) => {
            const count = todos.filter((t) =>
              dayjs.tz(t.day, "Europe/Vilnius")
                  .format("YYYY-MM-DD") === date,
            ).length;
            console.log(`      ${date}: ${count} TODO(s)`);
          });
        }
      }

      // Summary
      console.log("\n📊 Summary for this user:");
      const willSend =
        prefs.enabled &&
        prefs.advanceReminders &&
        now.hour() === reminderHour &&
        (!prefs.lastAutoAdvanceReminderSent ||
         !dayjs.tz(
             prefs.lastAutoAdvanceReminderSent.toDate(),
             "Europe/Vilnius",
         ).isSame(now, "day")) &&
        advanceTodos.length > 0;

      if (willSend) {
        console.log("   ✅ WILL SEND REMINDER");
      } else {
        console.log("   ❌ WILL NOT SEND REMINDER");
        console.log("\n   Reasons:");
        if (!prefs.enabled) {
          console.log("      - Email notifications disabled");
        }
        if (!prefs.advanceReminders) {
          console.log("      - Advance reminders disabled");
        }
        if (now.hour() !== reminderHour) {
          console.log("      - Not the right hour");
        }
        if (prefs.lastAutoAdvanceReminderSent &&
            dayjs.tz(
                prefs.lastAutoAdvanceReminderSent.toDate(),
                "Europe/Vilnius",
            ).isSame(now, "day")) {
          console.log("      - Already sent today");
        }
        if (advanceTodos.length === 0) {
          console.log("      - No TODOs on target date");
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Diagnosis complete!");
  } catch (error) {
    console.error("\n❌ Error during diagnosis:", error);
  }

  process.exit(0);
}

// Run diagnosis
diagnoseAdvanceReminders();
