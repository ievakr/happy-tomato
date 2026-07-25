import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCalendarContext } from '../../context/CalendarContext';
import { useTranslation } from '../../i18n/LanguageContext';
import './UserMenu.css';

function UserMenu() {
  const { currentUser, logout } = useAuth();
  const { setCurrentView } = useCalendarContext();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDropdownStyle(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current || !dropdownRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = dropdownRef.current.getBoundingClientRect();
      const margin = 8;

      let top = triggerRect.bottom;
      if (top + menuRect.height > window.innerHeight - margin) {
        top = triggerRect.top - menuRect.height;
      }

      let left = triggerRect.right - menuRect.width;
      if (left < margin) {
        left = margin;
      }
      if (left + menuRect.width > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - margin - menuRect.width);
      }

      setDropdownStyle({
        top,
        left
      });
    };

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      // User sees error via UI
    }
  };

  const getInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="dropdown" ref={menuRef}>
      <button
        className="btn p-0 border-0 bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('auth.userMenu')}
        aria-expanded={isOpen}
        type="button"
        ref={triggerRef}
      >
        {currentUser?.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || 'User'}
            className="user-avatar"
          />
        ) : (
          <div className="user-avatar-initials">{getInitials()}</div>
        )}
      </button>

      {isOpen && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow-sm user-menu-dropdown"
          ref={dropdownRef}
          style={dropdownStyle || undefined}
        >
          <div className="px-3 py-2">
            <div className="fw-semibold">{currentUser?.displayName || t('auth.user')}</div>
            <div className="text-muted small">{currentUser?.email}</div>
          </div>
          <div className="dropdown-divider" />
          <button 
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() => {
              setCurrentView('settings');
              setIsOpen(false);
            }}
            type="button"
          >
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>settings</span>
            {t('auth.accountSettings')}
          </button>
          <button className="dropdown-item d-flex align-items-center gap-2" onClick={handleLogout} type="button">
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>logout</span>
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;

