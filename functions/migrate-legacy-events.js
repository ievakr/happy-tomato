/**
 * One-time admin script: assign or delete legacy events missing userId.
 * Client apps can no longer read/update/delete these (see firestore.rules).
 *
 * Usage (from functions/):
 *   node migrate-legacy-events.js --dry-run
 *   node migrate-legacy-events.js --assign <firebaseAuthUid>
 *   node migrate-legacy-events.js --delete
 *
 * Requires serviceAccountKey.json (Firebase Console → Service accounts).
 */

const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const BATCH_SIZE = 500;

/**
 * Parse CLI flags for dry-run, assign, or delete.
 * @param {string[]} argv - process.argv
 * @return {Object} Parsed mode and optional userId
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes("--dry-run")) {
    return {mode: "dry-run"};
  }
  if (args.includes("--delete")) {
    return {mode: "delete"};
  }
  const assignIdx = args.indexOf("--assign");
  if (assignIdx !== -1 && args[assignIdx + 1]) {
    return {mode: "assign", userId: String(args[assignIdx + 1]).trim()};
  }
  return {mode: "help"};
}

/**
 * Events in Firestore with missing or empty userId.
 * @return {Promise<Array>} Legacy event document snapshots
 */
async function listLegacyEventDocs() {
  const snap = await db.collection("events").get();
  return snap.docs.filter((d) => {
    const data = d.data();
    const uid = data.userId;
    return !uid || typeof uid !== "string" || uid.trim() === "";
  });
}

/**
 * Run Firestore writes in batches of BATCH_SIZE.
 * @param {Array} docs - Document snapshots to process
 * @param {Function} buildBatch - Adds ops to a WriteBatch per doc
 * @return {Promise<number>} Number of documents processed
 */
async function commitBatches(docs, buildBatch) {
  let count = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((docSnap) => buildBatch(batch, docSnap));
    await batch.commit();
    count += chunk.length;
  }
  return count;
}

/**
 * Entry point: list legacy events and assign, delete, or dry-run.
 * @return {Promise<void>}
 */
async function main() {
  const opts = parseArgs(process.argv);

  if (opts.mode === "help") {
    console.log(
        "Usage:\n" +
        "  node migrate-legacy-events.js --dry-run\n" +
        "  node migrate-legacy-events.js --assign <firebaseAuthUid>\n" +
        "  node migrate-legacy-events.js --delete",
    );
    process.exit(1);
  }

  const legacy = await listLegacyEventDocs();
  console.log(`Found ${legacy.length} legacy event(s) without userId.`);

  if (legacy.length === 0) {
    return;
  }

  if (opts.mode === "dry-run") {
    legacy.slice(0, 20).forEach((d) => {
      const {day, title} = d.data();
      console.log(`  ${d.id}  day=${day}  title=${title || "(no title)"}`);
    });
    if (legacy.length > 20) {
      console.log(`  … and ${legacy.length - 20} more`);
    }
    return;
  }

  if (opts.mode === "assign") {
    const n = await commitBatches(legacy, (batch, docSnap) => {
      batch.update(docSnap.ref, {userId: opts.userId});
    });
    console.log(`Assigned userId=${opts.userId} to ${n} event(s).`);
    return;
  }

  if (opts.mode === "delete") {
    const n = await commitBatches(legacy, (batch, docSnap) => {
      batch.delete(docSnap.ref);
    });
    console.log(`Deleted ${n} legacy event(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
