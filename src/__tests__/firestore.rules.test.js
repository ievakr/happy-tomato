/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require('@firebase/rules-unit-testing');
const {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc
} = require('firebase/firestore');

const RULES_PATH = path.join(__dirname, '..', '..', 'firestore.rules');
const PROJECT_ID = 'happy-tomato-rules-test';

let testEnv;

const getAuthedDb = (uid, email = 'user@example.com') =>
  testEnv.authenticatedContext(uid, { email }).firestore();

const getUnauthedDb = () => testEnv.unauthenticatedContext().firestore();

const seedDoc = async (collectionName, docId, data) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, collectionName, docId), data);
  });
};

const seedGardenYearDoc = async (userId, year, data) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, 'gardenPlans', userId, 'years', year), data);
  });
};

beforeAll(async () => {
  const rules = fs.readFileSync(RULES_PATH, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore security rules', () => {
  describe('events', () => {
    test('allows authenticated user to read own event', async () => {
      await seedDoc('events', 'event-own', {
        userId: 'user-1',
        day: '2026-01-15',
        title: 'Water plants'
      });

      const db = getAuthedDb('user-1');
      await assertSucceeds(getDoc(doc(db, 'events', 'event-own')));
    });

    test('denies authenticated user from reading legacy event without userId', async () => {
      await seedDoc('events', 'event-legacy', {
        day: '2026-01-15',
        title: 'Legacy event'
      });

      const db = getAuthedDb('user-1');
      await assertFails(getDoc(doc(db, 'events', 'event-legacy')));
    });

    test('denies authenticated user from reading others events', async () => {
      await seedDoc('events', 'event-other', {
        userId: 'user-2',
        day: '2026-01-15',
        title: 'Not yours'
      });

      const db = getAuthedDb('user-1');
      await assertFails(getDoc(doc(db, 'events', 'event-other')));
    });

    test('denies unauthenticated reads', async () => {
      await seedDoc('events', 'event-unauth', {
        userId: 'user-1',
        day: '2026-01-15',
        title: 'Auth required'
      });

      const db = getUnauthedDb();
      await assertFails(getDoc(doc(db, 'events', 'event-unauth')));
    });

    test('allows create with own userId and string day', async () => {
      const db = getAuthedDb('user-1');
      await assertSucceeds(
        setDoc(doc(db, 'events', 'event-new-1'), {
          userId: 'user-1',
          day: '2026-01-15',
          title: 'New event'
        })
      );
    });

    test('allows create with own userId and numeric day', async () => {
      const db = getAuthedDb('user-1');
      await assertSucceeds(
        setDoc(doc(db, 'events', 'event-new-2'), {
          userId: 'user-1',
          day: 1700000000000,
          title: 'New event'
        })
      );
    });

    test('denies create when userId is missing', async () => {
      const db = getAuthedDb('user-1');
      await assertFails(
        setDoc(doc(db, 'events', 'event-missing-user'), {
          day: '2026-01-15',
          title: 'Invalid'
        })
      );
    });

    test('denies create when userId does not match auth', async () => {
      const db = getAuthedDb('user-1');
      await assertFails(
        setDoc(doc(db, 'events', 'event-wrong-user'), {
          userId: 'user-2',
          day: '2026-01-15',
          title: 'Invalid'
        })
      );
    });

    test('denies create when day is missing', async () => {
      const db = getAuthedDb('user-1');
      await assertFails(
        setDoc(doc(db, 'events', 'event-missing-day'), {
          userId: 'user-1',
          title: 'Invalid'
        })
      );
    });

    test('denies create when day has invalid type', async () => {
      const db = getAuthedDb('user-1');
      await assertFails(
        setDoc(doc(db, 'events', 'event-bad-day'), {
          userId: 'user-1',
          day: true,
          title: 'Invalid'
        })
      );
    });

    test('allows update of own event when userId is unchanged', async () => {
      await seedDoc('events', 'event-update-own', {
        userId: 'user-1',
        day: '2026-01-15',
        title: 'Old title'
      });

      const db = getAuthedDb('user-1');
      await assertSucceeds(
        updateDoc(doc(db, 'events', 'event-update-own'), {
          title: 'Updated title'
        })
      );
    });

    test('denies update that changes userId', async () => {
      await seedDoc('events', 'event-update-change-user', {
        userId: 'user-1',
        day: '2026-01-15',
        title: 'Old title'
      });

      const db = getAuthedDb('user-1');
      await assertFails(
        updateDoc(doc(db, 'events', 'event-update-change-user'), {
          userId: 'user-2',
          title: 'Updated title'
        })
      );
    });

    test('denies update to claim legacy event without userId', async () => {
      await seedDoc('events', 'event-legacy-claim', {
        day: '2026-01-15',
        title: 'Legacy title'
      });

      const db = getAuthedDb('user-1');
      await assertFails(
        updateDoc(doc(db, 'events', 'event-legacy-claim'), {
          userId: 'user-1',
          title: 'Claimed'
        })
      );
    });

    test('denies update to claim legacy event with wrong userId', async () => {
      await seedDoc('events', 'event-legacy-claim-fail', {
        day: '2026-01-15',
        title: 'Legacy title'
      });

      const db = getAuthedDb('user-1');
      await assertFails(
        updateDoc(doc(db, 'events', 'event-legacy-claim-fail'), {
          userId: 'user-2',
          title: 'Invalid claim'
        })
      );
    });

    test('denies update of other users event', async () => {
      await seedDoc('events', 'event-update-other', {
        userId: 'user-2',
        day: '2026-01-15',
        title: 'Other user'
      });

      const db = getAuthedDb('user-1');
      await assertFails(
        updateDoc(doc(db, 'events', 'event-update-other'), {
          title: 'Blocked'
        })
      );
    });

    test('allows delete of own event', async () => {
      await seedDoc('events', 'event-delete-own', {
        userId: 'user-1',
        day: '2026-01-15',
        title: 'Delete me'
      });

      const db = getAuthedDb('user-1');
      await assertSucceeds(deleteDoc(doc(db, 'events', 'event-delete-own')));
    });

    test('denies delete of legacy event without userId', async () => {
      await seedDoc('events', 'event-delete-legacy', {
        day: '2026-01-15',
        title: 'Legacy delete'
      });

      const db = getAuthedDb('user-1');
      await assertFails(deleteDoc(doc(db, 'events', 'event-delete-legacy')));
    });

    test('denies delete of other users event', async () => {
      await seedDoc('events', 'event-delete-other', {
        userId: 'user-2',
        day: '2026-01-15',
        title: 'Not yours'
      });

      const db = getAuthedDb('user-1');
      await assertFails(deleteDoc(doc(db, 'events', 'event-delete-other')));
    });
  });

  describe('emailPreferences', () => {
    test('allows read of legacy preferences without userId when email matches', async () => {
      await seedDoc('emailPreferences', 'pref-legacy', {
        userEmail: 'user@example.com',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertSucceeds(getDoc(doc(db, 'emailPreferences', 'pref-legacy')));
    });

    test('allows update of legacy preferences without userId', async () => {
      await seedDoc('emailPreferences', 'pref-legacy-update', {
        userEmail: 'user@example.com',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertSucceeds(
        updateDoc(doc(db, 'emailPreferences', 'pref-legacy-update'), {
          enabled: false
        })
      );
    });

    test('allows legacy preferences to gain userId on update', async () => {
      await seedDoc('emailPreferences', 'pref-legacy-claim', {
        userEmail: 'user@example.com',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertSucceeds(
        updateDoc(doc(db, 'emailPreferences', 'pref-legacy-claim'), {
          userId: 'user-1'
        })
      );
    });

    test('allows read of own preferences', async () => {
      await seedDoc('emailPreferences', 'pref-own', {
        userEmail: 'user@example.com',
        userId: 'user-1',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertSucceeds(getDoc(doc(db, 'emailPreferences', 'pref-own')));
    });

    test('denies read of other users preferences', async () => {
      await seedDoc('emailPreferences', 'pref-other', {
        userEmail: 'other@example.com',
        userId: 'user-2',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(getDoc(doc(db, 'emailPreferences', 'pref-other')));
    });

    test('denies read when userId does not match auth', async () => {
      await seedDoc('emailPreferences', 'pref-wrong-user', {
        userEmail: 'user@example.com',
        userId: 'user-2',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(getDoc(doc(db, 'emailPreferences', 'pref-wrong-user')));
    });

    test('allows create when userEmail and userId match auth', async () => {
      const db = getAuthedDb('user-1', 'user@example.com');
      await assertSucceeds(
        setDoc(doc(db, 'emailPreferences', 'pref-new'), {
          userEmail: 'user@example.com',
          userId: 'user-1',
          enabled: true
        })
      );
    });

    test('denies create when userEmail does not match auth token', async () => {
      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(
        setDoc(doc(db, 'emailPreferences', 'pref-wrong'), {
          userEmail: 'other@example.com',
          userId: 'user-1',
          enabled: true
        })
      );
    });

    test('denies create when userId does not match auth', async () => {
      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(
        setDoc(doc(db, 'emailPreferences', 'pref-wrong-user'), {
          userEmail: 'user@example.com',
          userId: 'user-2',
          enabled: true
        })
      );
    });

    test('denies create when userEmail is not a string', async () => {
      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(
        setDoc(doc(db, 'emailPreferences', 'pref-bad-type'), {
          userEmail: 123,
          userId: 'user-1',
          enabled: true
        })
      );
    });

    test('denies create when userId is missing', async () => {
      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(
        setDoc(doc(db, 'emailPreferences', 'pref-missing-user'), {
          userEmail: 'user@example.com',
          enabled: true
        })
      );
    });

    test('allows update of own preferences', async () => {
      await seedDoc('emailPreferences', 'pref-update', {
        userEmail: 'user@example.com',
        userId: 'user-1',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertSucceeds(
        updateDoc(doc(db, 'emailPreferences', 'pref-update'), {
          enabled: false
        })
      );
    });

    test('denies update that changes userEmail', async () => {
      await seedDoc('emailPreferences', 'pref-update-email', {
        userEmail: 'user@example.com',
        userId: 'user-1',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(
        updateDoc(doc(db, 'emailPreferences', 'pref-update-email'), {
          userEmail: 'other@example.com'
        })
      );
    });

    test('denies update that changes userId', async () => {
      await seedDoc('emailPreferences', 'pref-update-user', {
        userEmail: 'user@example.com',
        userId: 'user-1',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(
        updateDoc(doc(db, 'emailPreferences', 'pref-update-user'), {
          userId: 'user-2'
        })
      );
    });

    test('denies update of other users preferences', async () => {
      await seedDoc('emailPreferences', 'pref-update-other', {
        userEmail: 'other@example.com',
        userId: 'user-2',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(
        updateDoc(doc(db, 'emailPreferences', 'pref-update-other'), {
          enabled: false
        })
      );
    });

    test('allows delete of own preferences', async () => {
      await seedDoc('emailPreferences', 'pref-delete', {
        userEmail: 'user@example.com',
        userId: 'user-1',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertSucceeds(deleteDoc(doc(db, 'emailPreferences', 'pref-delete')));
    });

    test('denies delete of other users preferences', async () => {
      await seedDoc('emailPreferences', 'pref-delete-other', {
        userEmail: 'other@example.com',
        userId: 'user-2',
        enabled: true
      });

      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(deleteDoc(doc(db, 'emailPreferences', 'pref-delete-other')));
    });
  });

  describe('plants', () => {
    test('allows authenticated user to read own plant', async () => {
      await seedDoc('plants', 'plant-own', {
        userId: 'user-1',
        category: 'Tomato',
        variety: 'Cherry',
        icon: 'tomato'
      });

      const db = getAuthedDb('user-1');
      await assertSucceeds(getDoc(doc(db, 'plants', 'plant-own')));
    });

    test('denies authenticated user from reading others plants', async () => {
      await seedDoc('plants', 'plant-other', {
        userId: 'user-2',
        category: 'Tomato',
        variety: 'Cherry',
        icon: 'tomato'
      });

      const db = getAuthedDb('user-1');
      await assertFails(getDoc(doc(db, 'plants', 'plant-other')));
    });

    test('allows create with own userId', async () => {
      const db = getAuthedDb('user-1');
      await assertSucceeds(
        setDoc(doc(db, 'plants', 'plant-new'), {
          userId: 'user-1',
          category: 'Tomato',
          variety: 'Cherry',
          icon: 'tomato'
        })
      );
    });

    test('denies create when userId does not match auth', async () => {
      const db = getAuthedDb('user-1');
      await assertFails(
        setDoc(doc(db, 'plants', 'plant-wrong-user'), {
          userId: 'user-2',
          category: 'Tomato',
          variety: 'Cherry',
          icon: 'tomato'
        })
      );
    });

    test('allows update of own plant when userId is unchanged', async () => {
      await seedDoc('plants', 'plant-update-own', {
        userId: 'user-1',
        category: 'Tomato',
        variety: 'Cherry',
        icon: 'tomato'
      });

      const db = getAuthedDb('user-1');
      await assertSucceeds(
        updateDoc(doc(db, 'plants', 'plant-update-own'), {
          variety: 'Beefsteak'
        })
      );
    });

    test('denies update that changes userId', async () => {
      await seedDoc('plants', 'plant-update-user', {
        userId: 'user-1',
        category: 'Tomato',
        variety: 'Cherry',
        icon: 'tomato'
      });

      const db = getAuthedDb('user-1');
      await assertFails(
        updateDoc(doc(db, 'plants', 'plant-update-user'), {
          userId: 'user-2'
        })
      );
    });

    test('denies update of other users plant', async () => {
      await seedDoc('plants', 'plant-update-other', {
        userId: 'user-2',
        category: 'Tomato',
        variety: 'Cherry',
        icon: 'tomato'
      });

      const db = getAuthedDb('user-1');
      await assertFails(
        updateDoc(doc(db, 'plants', 'plant-update-other'), {
          variety: 'Blocked'
        })
      );
    });

    test('allows delete of own plant', async () => {
      await seedDoc('plants', 'plant-delete-own', {
        userId: 'user-1',
        category: 'Tomato',
        variety: 'Cherry',
        icon: 'tomato'
      });

      const db = getAuthedDb('user-1');
      await assertSucceeds(deleteDoc(doc(db, 'plants', 'plant-delete-own')));
    });

    test('denies delete of other users plant', async () => {
      await seedDoc('plants', 'plant-delete-other', {
        userId: 'user-2',
        category: 'Tomato',
        variety: 'Cherry',
        icon: 'tomato'
      });

      const db = getAuthedDb('user-1');
      await assertFails(deleteDoc(doc(db, 'plants', 'plant-delete-other')));
    });
  });

  describe('gardenPlans', () => {
    test('allows authenticated user to read own yearly plan', async () => {
      await seedGardenYearDoc('user-1', '2026', {
        year: 2026,
        plotWidthM: 10,
        plotHeightM: 6,
        beds: [],
        updatedAt: new Date().toISOString()
      });

      const db = getAuthedDb('user-1');
      await assertSucceeds(getDoc(doc(db, 'gardenPlans', 'user-1', 'years', '2026')));
    });

    test('denies authenticated user from reading another users plan', async () => {
      await seedGardenYearDoc('user-1', '2026', {
        year: 2026,
        plotWidthM: 10,
        plotHeightM: 6,
        beds: [],
        updatedAt: new Date().toISOString()
      });

      const db = getAuthedDb('user-2');
      await assertFails(getDoc(doc(db, 'gardenPlans', 'user-1', 'years', '2026')));
    });

    test('allows create and update of own yearly plan', async () => {
      const db = getAuthedDb('user-1');
      await assertSucceeds(
        setDoc(doc(db, 'gardenPlans', 'user-1', 'years', '2027'), {
          year: 2027,
          plotWidthM: 8,
          plotHeightM: 5,
          beds: [],
          updatedAt: new Date().toISOString()
        })
      );
      await assertSucceeds(
        updateDoc(doc(db, 'gardenPlans', 'user-1', 'years', '2027'), {
          plotWidthM: 9
        })
      );
    });

    test('denies write to another users garden path', async () => {
      const db = getAuthedDb('user-2');
      await assertFails(
        setDoc(doc(db, 'gardenPlans', 'user-1', 'years', '2028'), {
          year: 2028,
          plotWidthM: 10,
          plotHeightM: 6,
          beds: [],
          updatedAt: new Date().toISOString()
        })
      );
    });

    test('denies unauthenticated access', async () => {
      await seedGardenYearDoc('user-1', '2026', {
        year: 2026,
        plotWidthM: 10,
        plotHeightM: 6,
        beds: [],
        updatedAt: new Date().toISOString()
      });

      const db = getUnauthedDb();
      await assertFails(getDoc(doc(db, 'gardenPlans', 'user-1', 'years', '2026')));
    });
  });

  describe('default deny', () => {
    test('denies access to unknown collections', async () => {
      const db = getAuthedDb('user-1', 'user@example.com');
      await assertFails(getDoc(doc(db, 'privateData', 'doc1')));
      await assertFails(
        setDoc(doc(db, 'privateData', 'doc1'), { value: true })
      );
    });

    test('denies unauthenticated access to unknown collections', async () => {
      const db = getUnauthedDb();
      await assertFails(getDoc(doc(db, 'privateData', 'doc2')));
      await assertFails(
        setDoc(doc(db, 'privateData', 'doc2'), { value: true })
      );
    });
  });
});
