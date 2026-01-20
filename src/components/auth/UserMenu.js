import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AccountSettings from '../settings/AccountSettings';
import './UserMenu.css';

function UserMenu() {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef(null);

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

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
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
        aria-label="User menu"
        aria-expanded={isOpen}
        type="button"
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
        <div className="dropdown-menu dropdown-menu-end show shadow-sm user-menu-dropdown">
          <div className="px-3 py-2">
            <div className="fw-semibold">{currentUser?.displayName || 'User'}</div>
            <div className="text-muted small">{currentUser?.email}</div>
          </div>
          <div className="dropdown-divider" />
          <button 
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() => {
              setShowSettings(true);
              setIsOpen(false);
            }}
            type="button"
          >
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>settings</span>
            Account Settings
          </button>
          <button className="dropdown-item d-flex align-items-center gap-2" onClick={handleLogout} type="button">
            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>logout</span>
            Sign Out
          </button>
        </div>
      )}

      {showSettings && (
        <AccountSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default UserMenu;

