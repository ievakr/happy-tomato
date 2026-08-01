import React, { useContext } from 'react';
import Labels from '../calendar/Labels';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useCalendarContext, isFullPageCalendarView } from '../../context/CalendarContext';
import LayoutContext from '../../context/LayoutContext';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import logo from '../../assets/logo.png';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'calendar', icon: 'calendar_month', labelKey: 'layout.calendar', calendar: true },
  { view: 'manage-plants', icon: 'eco', labelKey: 'layout.plantManagement' },
  { view: 'manage-todo', icon: 'edit_note', labelKey: 'layout.todoManagement' },
  { view: 'guide', icon: 'menu_book', labelKey: 'layout.vegetableGuide' },
  { view: 'disease-guide', icon: 'healing', labelKey: 'layout.diseaseGuide' },
  { view: 'settings', icon: 'person', labelKey: 'layout.profile' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { showSidebar, setShowSidebar } = useContext(LayoutContext);
  const { setCurrentView, currentView, goToToday } = useCalendarContext();
  const { isMobile } = useResponsive();

  const goTo = (view) => {
    setCurrentView(view);
    setShowSidebar(false);
  };

  const goToCalendar = () => {
    goToToday();
    setCurrentView(isMobile ? 'daily' : 'month');
    setShowSidebar(false);
  };

  const handleLogout = async () => {
    try {
      setShowSidebar(false);
      await logout();
    } catch {
      // User sees error via UI
    }
  };

  return (
    <>
      {showSidebar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 1040 }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      <aside
        className={`sidebar sidebar--drawer h-100 d-flex flex-column ${
          showSidebar ? 'mobile-sidebar-open' : ''
        }`}
      >
        <div className="sidebar-brand">
          <img src={logo} alt="" className="sidebar-brand-logo" />
          <div className="sidebar-brand-name app-title">Happy Tomato</div>
        </div>

        <nav className="sidebar-nav" aria-label={t('layout.menu')}>
          {NAV_ITEMS.map((item) => {
            const active = item.calendar
              ? !isFullPageCalendarView(currentView)
              : currentView === item.view;
            return (
              <button
                key={item.id || item.view}
                type="button"
                className={`sidebar-nav-item${active ? ' is-active' : ''}`}
                onClick={() => (item.calendar ? goToCalendar() : goTo(item.view))}
                aria-current={active ? 'page' : undefined}
              >
                <span className="material-icons-outlined sidebar-nav-icon">
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-labels flex-grow-1 overflow-auto">
          <Labels
            headerClassName="mb-2"
            contentClassName=""
            sepClassName="sidebar-labels-sep"
          />
        </div>

        <div className="sidebar-footer">
          <LanguageSwitcher variant="corner" />
          <span className="sidebar-footer-sep" aria-hidden />
          <button
            type="button"
            className="sidebar-footer-logout"
            onClick={handleLogout}
          >
            {t('auth.signOut')}
          </button>
        </div>
      </aside>
    </>
  );
}
