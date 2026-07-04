// Calendar components (month/week/day/year views, event chips, day strip).
// Populated during calendar localization.
const calendar = {
  en: {
    // Navigation
    'calendar.prevMonth': 'Previous month',
    'calendar.nextMonth': 'Next month',
    'calendar.prevWeek': 'Previous week',
    'calendar.nextWeek': 'Next week',
    'calendar.prevYear': 'Previous year',
    'calendar.nextYear': 'Next year',
    'calendar.goToToday': 'Go to today',
    'calendar.today': 'Today',

    // Views / grids
    'calendar.monthViewLabel': 'Calendar month view',
    'calendar.yearViewLabel': 'Year view',
    'calendar.noCalendarData': 'No calendar data available',
    'calendar.noEvents': 'No events',
    'calendar.deleteEvent': 'Delete event',

    // Day count indicators (month grid)
    'calendar.notDoneTapToView': '{count} not done — tap to view',
    'calendar.doneTapToView': '{count} done — tap to view',

    // Daily events panel
    'calendar.noTodosForDay': 'No to-dos scheduled for this day',
    'calendar.todosCount': "To-Do's ({count})",
    'calendar.selectAll': 'Select all',
    'calendar.move': 'Move',
    'calendar.bulkEdit': 'Bulk edit',
    'calendar.addEvent': 'Add Event',
    'calendar.selectEventAria': 'Select {name}',
    'calendar.eventFallback': 'event',

    // Complete / restore to-do
    'calendar.markAsTodo': 'Mark as to-do',
    'calendar.markComplete': 'Mark complete',
    'calendar.couldNotRestoreTodo': 'Could not restore to-do.',
    'calendar.couldNotMarkComplete': 'Could not mark complete.',

    // Bulk edit modals
    'calendar.moveEventsTitleSingular': 'Move {count} event',
    'calendar.moveEventsTitlePlural': 'Move {count} events',
    'calendar.moving': 'Moving…',
    'calendar.newDate': 'New date',
    'calendar.deleteEventsTitle': 'Delete events',
    'calendar.deleteEventsConfirmSingular': "Delete {count} event? This can't be undone.",
    'calendar.deleteEventsConfirmPlural': "Delete {count} events? This can't be undone.",
    'calendar.deleteAll': 'Delete all',
    'calendar.moveFailed': 'Failed to move events. Please try again.',
    'calendar.deleteFailed': 'Failed to delete some events. Please try again.',

    // Delete confirm modal
    'calendar.deleteEventTitle': 'Delete Event',
    'calendar.deleteEventConfirm': 'Delete "{name}"?',
    'calendar.deleteCannotUndo': "This action can't be undone.",

    // Labels / category filter
    'calendar.filterByCategory': 'Filter by Category',
    'calendar.checkAllCategories': 'Check all categories',
    'calendar.selectAllFilterCategories': 'Select all filter categories',
    'calendar.selectAllCategories': 'Select all',
    'calendar.uncheckAllCategories': 'Uncheck all categories',
    'calendar.uncheckAllFilterCategories': 'Uncheck all filter categories',
    'calendar.clearAll': 'Clear all',
    'calendar.selectCategoriesToFilter': 'Select categories to filter',
    'calendar.allCategoriesSelected': 'All categories selected',
    'calendar.categoriesSelectedSingular': '{count} category selected',
    'calendar.categoriesSelectedPlural': '{count} categories selected',

    // Weekly summary modal
    'calendar.weekAhead': 'Your week ahead',
    'calendar.noTasksInWindow': 'No tasks in this window.',
    'calendar.overdue': 'Overdue',
    'calendar.weekTasksCountSingular': '{count} task',
    'calendar.weekTasksCountPlural': '{count} tasks',
  },
  lt: {
    // Navigation
    'calendar.prevMonth': 'Ankstesnis mėnuo',
    'calendar.nextMonth': 'Kitas mėnuo',
    'calendar.prevWeek': 'Ankstesnė savaitė',
    'calendar.nextWeek': 'Kita savaitė',
    'calendar.prevYear': 'Ankstesni metai',
    'calendar.nextYear': 'Kiti metai',
    'calendar.goToToday': 'Eiti į šiandieną',
    'calendar.today': 'Šiandien',

    // Views / grids
    'calendar.monthViewLabel': 'Kalendoriaus mėnesio rodinys',
    'calendar.yearViewLabel': 'Metų rodinys',
    'calendar.noCalendarData': 'Nėra kalendoriaus duomenų',
    'calendar.noEvents': 'Nėra įvykių',
    'calendar.deleteEvent': 'Ištrinti įvykį',

    // Day count indicators (month grid)
    'calendar.notDoneTapToView': '{count} neatlikta — bakstelėkite peržiūrėti',
    'calendar.doneTapToView': '{count} atlikta — bakstelėkite peržiūrėti',

    // Daily events panel
    'calendar.noTodosForDay': 'Šiai dienai nėra suplanuotų darbų',
    'calendar.todosCount': 'Darbai ({count})',
    'calendar.selectAll': 'Pažymėti visus',
    'calendar.move': 'Perkelti',
    'calendar.bulkEdit': 'Redaguoti grupę',
    'calendar.addEvent': 'Pridėti įvykį',
    'calendar.selectEventAria': 'Pasirinkti {name}',
    'calendar.eventFallback': 'įvykį',

    // Complete / restore to-do
    'calendar.markAsTodo': 'Pažymėti kaip darbą',
    'calendar.markComplete': 'Pažymėti kaip atliktą',
    'calendar.couldNotRestoreTodo': 'Nepavyko atkurti darbo.',
    'calendar.couldNotMarkComplete': 'Nepavyko pažymėti kaip atlikto.',

    // Bulk edit modals
    'calendar.moveEventsTitleSingular': 'Perkelti {count} įvykį',
    'calendar.moveEventsTitlePlural': 'Perkelti {count} įvykius',
    'calendar.moving': 'Perkeliama…',
    'calendar.newDate': 'Nauja data',
    'calendar.deleteEventsTitle': 'Ištrinti įvykius',
    'calendar.deleteEventsConfirmSingular': 'Ištrinti {count} įvykį? To negalima atšaukti.',
    'calendar.deleteEventsConfirmPlural': 'Ištrinti {count} įvykius? To negalima atšaukti.',
    'calendar.deleteAll': 'Ištrinti visus',
    'calendar.moveFailed': 'Nepavyko perkelti įvykių. Bandykite dar kartą.',
    'calendar.deleteFailed': 'Nepavyko ištrinti kai kurių įvykių. Bandykite dar kartą.',

    // Delete confirm modal
    'calendar.deleteEventTitle': 'Ištrinti įvykį',
    'calendar.deleteEventConfirm': 'Ištrinti „{name}“?',
    'calendar.deleteCannotUndo': 'Šio veiksmo negalima atšaukti.',

    // Labels / category filter
    'calendar.filterByCategory': 'Filtruoti pagal kategoriją',
    'calendar.checkAllCategories': 'Pažymėti visas kategorijas',
    'calendar.selectAllFilterCategories': 'Pažymėti visas filtro kategorijas',
    'calendar.selectAllCategories': 'Pažymėti visas',
    'calendar.uncheckAllCategories': 'Atžymėti visas kategorijas',
    'calendar.uncheckAllFilterCategories': 'Atžymėti visas filtro kategorijas',
    'calendar.clearAll': 'Išvalyti visas',
    'calendar.selectCategoriesToFilter': 'Pasirinkite kategorijas filtravimui',
    'calendar.allCategoriesSelected': 'Pasirinktos visos kategorijos',
    'calendar.categoriesSelectedSingular': 'Pasirinkta {count} kategorija',
    'calendar.categoriesSelectedPlural': 'Pasirinktos {count} kategorijos',

    // Weekly summary modal
    'calendar.weekAhead': 'Ateinanti savaitė',
    'calendar.noTasksInWindow': 'Šiuo laikotarpiu nėra darbų.',
    'calendar.overdue': 'Pavėluota',
    'calendar.weekTasksCountSingular': '{count} darbas',
    'calendar.weekTasksCountPlural': '{count} darbai',
  },
};

export default calendar;
