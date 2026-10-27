import React, { lazy } from 'react';
import { isFullPageCalendarView } from '../../context/CalendarContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LazyBoundary from '../common/LazyBoundary';

const CalendarHeader = lazy(() => import('../calendar/CalendarHeader'));
const CalendarGrid = lazy(() => import('../calendar/CalendarGrid'));
const WeeklyView = lazy(() => import('../calendar/WeeklyView'));
const DailyView = lazy(() => import('../calendar/DailyView'));
const YearlyView = lazy(() => import('../calendar/YearlyView'));
const ManagePlantsPage = lazy(() => import('../forms/ManagePlantsPage'));
const ManageTodoPage = lazy(() => import('../forms/ManageTodoPage'));
const VegetableGuideView = lazy(() => import('../guide/VegetableGuideView'));
const DiseaseGuideView = lazy(() => import('../guide/DiseaseGuideView'));
const AccountSettings = lazy(() => import('../settings/AccountSettings'));

function viewLabel(currentView, t) {
  switch (currentView) {
    case 'guide':
      return t('layout.vegetableGuide');
    case 'disease-guide':
      return t('layout.diseaseGuide');
    case 'settings':
      return t('settings.title');
    case 'manage-plants':
      return t('layout.plantManagement');
    case 'manage-todo':
      return t('layout.todoManagement');
    default:
      return t('layout.calendarView');
  }
}

function MainView({ currentView, isMobile, currentMonth, fallback, onError }) {
  const { t } = useTranslation();
  const showMonthGrid = currentView === 'month' || (currentView === 'year' && !isMobile);

  let content;
  if (currentView === 'guide') {
    content = (
      <LazyBoundary name="VegetableGuideView" fallback={fallback} onError={onError}>
        <VegetableGuideView />
      </LazyBoundary>
    );
  } else if (currentView === 'disease-guide') {
    content = (
      <LazyBoundary name="DiseaseGuideView" fallback={fallback} onError={onError}>
        <DiseaseGuideView />
      </LazyBoundary>
    );
  } else if (currentView === 'settings') {
    content = (
      <LazyBoundary name="AccountSettings" fallback={fallback} onError={onError}>
        <AccountSettings />
      </LazyBoundary>
    );
  } else if (currentView === 'manage-plants') {
    content = (
      <LazyBoundary name="ManagePlantsPage" fallback={fallback} onError={onError}>
        <ManagePlantsPage />
      </LazyBoundary>
    );
  } else if (currentView === 'manage-todo') {
    content = (
      <LazyBoundary name="ManageTodoPage" fallback={fallback} onError={onError}>
        <ManageTodoPage />
      </LazyBoundary>
    );
  } else if (currentView === 'year' && isMobile) {
    content = (
      <LazyBoundary name="YearlyView" fallback={fallback} onError={onError}>
        <YearlyView />
      </LazyBoundary>
    );
  } else if (showMonthGrid) {
    content = (
      <>
        <LazyBoundary name="CalendarHeader" fallback={fallback} onError={onError}>
          <CalendarHeader />
        </LazyBoundary>
        <LazyBoundary name="CalendarGrid" fallback={fallback} onError={onError}>
          <CalendarGrid month={currentMonth} />
        </LazyBoundary>
      </>
    );
  } else if (currentView === 'week') {
    content = (
      <LazyBoundary name="WeeklyView" fallback={fallback} onError={onError}>
        <WeeklyView />
      </LazyBoundary>
    );
  } else {
    content = (
      <LazyBoundary name="DailyView" fallback={fallback} onError={onError}>
        <DailyView />
      </LazyBoundary>
    );
  }

  return (
    <section
      className={`flex-grow-1 d-flex flex-column${currentView === 'daily' ? ' calendar-section-daily' : ''}`}
      style={{
        minHeight: 0,
        overflow: isFullPageCalendarView(currentView) ? 'auto' : 'hidden',
      }}
      aria-label={viewLabel(currentView, t)}
    >
      {content}
    </section>
  );
}

export default MainView;
