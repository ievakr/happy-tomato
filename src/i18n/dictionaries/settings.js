// Settings screens (account settings, push notifications, event migration).
const settings = {
  en: {
    // Modal + tabs
    'settings.title': 'Settings',
    'settings.tab.account': 'Account',
    'settings.tab.notifications': 'Notifications',

    // Account information
    'settings.accountInformation': 'Account Information',
    'settings.name': 'Name',
    'settings.namePlaceholder': 'Your name',
    'settings.profileUpdated': 'Profile updated.',
    'settings.profileUpdateFailed': 'Failed to update profile',

    // Account management / deletion
    'settings.accountManagement': 'Account Management',
    'settings.deleteDescription': 'Permanently delete your account and all associated data.',
    'settings.deleteAccount': 'Delete Account',
    'settings.warning': 'Warning:',
    'settings.cannotUndo': "This action can't be undone.",
    'settings.deleteBullet1': 'Permanently delete all your events and data',
    'settings.deleteBullet2': 'Remove your account from the system',
    'settings.deleteBullet3': 'Log you out immediately',
    'settings.enterPasswordConfirm': 'Enter your password to confirm',
    'settings.passwordPlaceholder': 'Your password',
    'settings.googleReauthNotice': "You'll be asked to sign in with Google to confirm deletion.",
    'settings.deleting': 'Deleting...',
    'settings.deleteMyAccount': 'Delete My Account',
    'settings.enterPasswordError': 'Please enter your password to confirm deletion',
    'settings.incorrectPassword': 'Incorrect password. Please try again.',
    'settings.requiresRecentLogin':
      'For security reasons, please log out and log back in before deleting your account.',
    'settings.allowPopups': 'Please allow popups to reauthenticate with Google.',
    'settings.deleteFailed': 'Failed to delete account: {message}',

    // Notifications (account settings tab)
    'settings.pushNotifications': 'Push notifications',
    'settings.enablePush': 'Enable push notifications',
    'settings.dailyRemindersOverdue': 'Daily reminders (today + overdue)',
    'settings.advanceReminders': 'Advance reminders',
    'settings.weeklySummary': 'Weekly summary',
    'settings.todayReminder': 'Today reminder',
    'settings.time': 'Time',
    'settings.advanceReminder': 'Advance reminder',
    'settings.daysBeforeDue': 'Days before due',
    'settings.dayOfWeek': 'Day of week',
    'settings.notificationsSaved': 'Notification settings saved.',

    // Push notification settings modal
    'settings.pushSettingsTitle': 'Push Notification Settings',
    'settings.pushServiceStatus': 'Push service status',
    'settings.ready': 'Ready',
    'settings.configRequired': 'Configuration required',
    'settings.iosAndroidApp': 'iOS / Android app',
    'settings.webPushNotConfigured': 'Web push not fully configured',
    'settings.pushEnabledFor': 'Push is enabled for this {buildType} build (FCM).',
    'settings.buildNative': 'native',
    'settings.buildWeb': 'web',

    // TODO summary
    'settings.currentTodos': 'Current TODOs',
    'settings.overdue': 'Overdue',
    'settings.dueToday': 'Due Today',
    'settings.inDays': 'In {days} Days',
    'settings.upcoming': 'Upcoming',

    // Push settings form
    'settings.enablePushHelp':
      'Browser reminders for your garden TODOs (allow notifications when prompted)',
    'settings.account': 'Account',
    'settings.signInToSync': 'Sign in to sync reminders',
    'settings.accountSyncHelp': 'Preferences sync to Firestore using your account email',
    'settings.dailyReminder': 'Daily reminder',
    'settings.dailyReminderHelp': 'Push at your chosen time with pending TODOs (today and overdue)',
    'settings.todayReminderTime': 'Today reminder time',
    'settings.todayReminderTimeHelp1':
      "When to send today's and overdue tasks reminder (uses your device timezone, saved with your account). This is separate from",
    'settings.todayReminderTimeHelp2':
      'below — if you only changed one, the other can still fire at a different hour.',
    'settings.advancedSettings': 'Advanced Settings',
    'settings.advanceRemindersHelp': 'Push a few days before TODOs are due',
    'settings.howManyDaysAdvance': 'How many days in advance?',
    'settings.advanceDaysHelp': 'Send reminders {days} day(s) before TODOs are due',
    'settings.advanceReminderTime': 'Advance reminder time',
    'settings.advanceReminderTimeHelp':
      'Time of day for the advance notice (independent from today reminder)',
    'settings.weeklySummaryHelp': 'A "week ahead" push on a weekday you choose',
    'settings.weeklySummaryTime': 'Weekly summary time',
    'settings.weeklySummaryTimeHelp': 'When to send your week-ahead summary',
    'settings.remindDueToday': 'Remind me of TODOs due today',
    'settings.remindOverdue': 'Remind me of overdue TODOs',
    'settings.autoSyncActive': 'Auto-Sync Active',
    'settings.autoSyncHelp':
      'Settings automatically sync across all devices every 30 seconds. No manual action needed!',
    'settings.saveSettings': 'Save Settings',
    'settings.signInToEnablePush': 'Sign in to enable push notifications',

    // Weekdays
    'settings.weekday.monday': 'Monday',
    'settings.weekday.tuesday': 'Tuesday',
    'settings.weekday.wednesday': 'Wednesday',
    'settings.weekday.thursday': 'Thursday',
    'settings.weekday.friday': 'Friday',
    'settings.weekday.saturday': 'Saturday',
    'settings.weekday.sunday': 'Sunday',
  },
  lt: {
    // Modal + tabs
    'settings.title': 'Nustatymai',
    'settings.tab.account': 'Paskyra',
    'settings.tab.notifications': 'Pranešimai',

    // Account information
    'settings.accountInformation': 'Paskyros informacija',
    'settings.name': 'Vardas',
    'settings.namePlaceholder': 'Jūsų vardas',
    'settings.profileUpdated': 'Profilis atnaujintas.',
    'settings.profileUpdateFailed': 'Nepavyko atnaujinti profilio',

    // Account management / deletion
    'settings.accountManagement': 'Paskyros valdymas',
    'settings.deleteDescription': 'Visam laikui ištrinti savo paskyrą ir visus susijusius duomenis.',
    'settings.deleteAccount': 'Ištrinti paskyrą',
    'settings.warning': 'Įspėjimas:',
    'settings.cannotUndo': 'Šio veiksmo nebus galima atšaukti.',
    'settings.deleteBullet1': 'Visam laikui ištrinti visus jūsų įvykius ir duomenis',
    'settings.deleteBullet2': 'Pašalinti jūsų paskyrą iš sistemos',
    'settings.deleteBullet3': 'Nedelsiant jus atjungti',
    'settings.enterPasswordConfirm': 'Įveskite slaptažodį patvirtinimui',
    'settings.passwordPlaceholder': 'Jūsų slaptažodis',
    'settings.googleReauthNotice':
      'Norint patvirtinti ištrynimą, būsite paprašyti prisijungti su „Google“.',
    'settings.deleting': 'Trinama...',
    'settings.deleteMyAccount': 'Ištrinti mano paskyrą',
    'settings.enterPasswordError': 'Įveskite slaptažodį, kad patvirtintumėte ištrynimą',
    'settings.incorrectPassword': 'Neteisingas slaptažodis. Bandykite dar kartą.',
    'settings.requiresRecentLogin':
      'Saugumo sumetimais prieš ištrindami paskyrą atsijunkite ir prisijunkite iš naujo.',
    'settings.allowPopups':
      'Leiskite iškylančiuosius langus, kad galėtumėte iš naujo autentifikuotis su „Google“.',
    'settings.deleteFailed': 'Nepavyko ištrinti paskyros: {message}',

    // Notifications (account settings tab)
    'settings.pushNotifications': 'Tiesioginiai pranešimai',
    'settings.enablePush': 'Įjungti tiesioginius pranešimus',
    'settings.dailyRemindersOverdue': 'Kasdieniai priminimai (šiandien + pradelsti)',
    'settings.advanceReminders': 'Išankstiniai priminimai',
    'settings.weeklySummary': 'Savaitinė santrauka',
    'settings.todayReminder': 'Šiandienos priminimas',
    'settings.time': 'Laikas',
    'settings.advanceReminder': 'Išankstinis priminimas',
    'settings.daysBeforeDue': 'Dienos iki termino',
    'settings.dayOfWeek': 'Savaitės diena',
    'settings.notificationsSaved': 'Pranešimų nustatymai išsaugoti.',

    // Push notification settings modal
    'settings.pushSettingsTitle': 'Tiesioginių pranešimų nustatymai',
    'settings.pushServiceStatus': 'Tiesioginių pranešimų būsena',
    'settings.ready': 'Paruošta',
    'settings.configRequired': 'Reikalinga konfigūracija',
    'settings.iosAndroidApp': 'iOS / Android programėlė',
    'settings.webPushNotConfigured': 'Žiniatinklio tiesioginiai pranešimai nevisiškai sukonfigūruoti',
    'settings.pushEnabledFor': 'Tiesioginiai pranešimai įjungti šioje {buildType} versijoje (FCM).',
    'settings.buildNative': 'mobiliojoje',
    'settings.buildWeb': 'žiniatinklio',

    // TODO summary
    'settings.currentTodos': 'Dabartinės užduotys',
    'settings.overdue': 'Pradelsta',
    'settings.dueToday': 'Terminas šiandien',
    'settings.inDays': 'Po {days} d.',
    'settings.upcoming': 'Būsimos',

    // Push settings form
    'settings.enablePushHelp':
      'Naršyklės priminimai apie jūsų sodo užduotis (kai bus paprašyta, leiskite pranešimus)',
    'settings.account': 'Paskyra',
    'settings.signInToSync': 'Prisijunkite, kad sinchronizuotumėte priminimus',
    'settings.accountSyncHelp':
      'Nustatymai sinchronizuojami su „Firestore“ naudojant jūsų paskyros el. paštą',
    'settings.dailyReminder': 'Kasdienis priminimas',
    'settings.dailyReminderHelp':
      'Pranešimas jūsų pasirinktu laiku su laukiančiomis užduotimis (šiandienos ir pradelstomis)',
    'settings.todayReminderTime': 'Šiandienos priminimo laikas',
    'settings.todayReminderTimeHelp1':
      'Kada siųsti šiandienos ir pradelstų užduočių priminimą (naudoja jūsų įrenginio laiko juostą, išsaugoma su jūsų paskyra). Tai atskira nuo',
    'settings.todayReminderTimeHelp2':
      'žemiau — jei pakeitėte tik vieną, kitas vis tiek gali suveikti kitą valandą.',
    'settings.advancedSettings': 'Papildomi nustatymai',
    'settings.advanceRemindersHelp': 'Pranešimas likus kelioms dienoms iki užduočių termino',
    'settings.howManyDaysAdvance': 'Kiek dienų iš anksto?',
    'settings.advanceDaysHelp':
      'Siųsti priminimus likus {days} d. iki užduočių termino',
    'settings.advanceReminderTime': 'Išankstinio priminimo laikas',
    'settings.advanceReminderTimeHelp':
      'Paros laikas išankstiniam pranešimui (nepriklauso nuo šiandienos priminimo)',
    'settings.weeklySummaryHelp': 'Pranešimas „savaitė į priekį“ jūsų pasirinktą savaitės dieną',
    'settings.weeklySummaryTime': 'Savaitinės santraukos laikas',
    'settings.weeklySummaryTimeHelp': 'Kada siųsti savaitės į priekį santrauką',
    'settings.remindDueToday': 'Priminti apie užduotis, kurių terminas šiandien',
    'settings.remindOverdue': 'Priminti apie pradelstas užduotis',
    'settings.autoSyncActive': 'Automatinis sinchronizavimas aktyvus',
    'settings.autoSyncHelp':
      'Nustatymai automatiškai sinchronizuojami visuose įrenginiuose kas 30 sekundžių. Rankinių veiksmų nereikia!',
    'settings.saveSettings': 'Išsaugoti nustatymus',
    'settings.signInToEnablePush': 'Prisijunkite, kad įjungtumėte tiesioginius pranešimus',

    // Weekdays
    'settings.weekday.monday': 'Pirmadienis',
    'settings.weekday.tuesday': 'Antradienis',
    'settings.weekday.wednesday': 'Trečiadienis',
    'settings.weekday.thursday': 'Ketvirtadienis',
    'settings.weekday.friday': 'Penktadienis',
    'settings.weekday.saturday': 'Šeštadienis',
    'settings.weekday.sunday': 'Sekmadienis',
  },
};

export default settings;
