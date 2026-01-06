import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AccountSettings from '../settings/AccountSettings';
import './UserMenu.css';

function UserMenu() {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
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

  // Get user initials for avatar
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
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
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
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-menu-name">
              {currentUser?.displayName || 'User'}
            </div>
            <div className="user-menu-email">{currentUser?.email}</div>
          </div>

          <div className="user-menu-divider" />

          <button 
            className="user-menu-item" 
            onClick={() => {
              setShowSettings(true);
              setIsOpen(false);
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.9333 10C12.8443 10.2029 12.8146 10.4266 12.8476 10.6457C12.8807 10.8647 12.9751 11.0701 13.12 11.2387L13.1533 11.28C13.2672 11.4129 13.3542 11.5676 13.4092 11.7352C13.4642 11.9027 13.4861 12.0799 13.4735 12.2559C13.4609 12.432 13.4142 12.6035 13.3363 12.7609C13.2584 12.9183 13.1508 13.0583 13.02 13.1733C12.8891 13.2883 12.7375 13.3762 12.5736 13.4318C12.4097 13.4874 12.2367 13.5097 12.0643 13.4973C11.892 13.485 11.724 13.4382 11.5696 13.3597C11.4151 13.2813 11.2773 13.1728 11.1647 13.04L11.1227 13C10.9541 12.8551 10.7487 12.7607 10.5296 12.7276C10.3106 12.6946 10.0869 12.7243 9.884 12.8133C9.68393 12.8991 9.51093 13.0394 9.38302 13.2187C9.2551 13.398 9.17744 13.6095 9.15733 13.83V14C9.15733 14.3536 9.01685 14.6928 8.76679 14.9428C8.51674 15.1929 8.1776 15.3333 7.824 15.3333C7.4704 15.3333 7.13126 15.1929 6.88121 14.9428C6.63115 14.6928 6.49067 14.3536 6.49067 14V13.9467C6.46451 13.718 6.37708 13.5007 6.23801 13.3183C6.09893 13.1359 5.91339 12.9948 5.70133 12.9093C5.49843 12.8203 5.27471 12.7906 5.05565 12.8237C4.8366 12.8567 4.63123 12.9511 4.46267 13.096L4.42067 13.1293C4.28774 13.2432 4.13304 13.3302 3.96546 13.3852C3.79789 13.4402 3.62073 13.4621 3.44469 13.4495C3.26864 13.4369 3.09714 13.3902 2.93974 13.3123C2.78234 13.2344 2.64232 13.1268 2.52733 12.996C2.41235 12.8651 2.32446 12.7135 2.26887 12.5496C2.21329 12.3857 2.19104 12.2127 2.20366 12.0403C2.21628 11.868 2.26351 11.7 2.34199 11.5456C2.42046 11.3912 2.52892 11.2533 2.66067 11.1407L2.7 11.0987C2.84488 10.9301 2.93925 10.7247 2.97231 10.5057C3.00537 10.2866 2.97585 10.0629 2.88667 9.86C2.80089 9.65993 2.66061 9.48693 2.48132 9.35902C2.30202 9.2311 2.09052 9.15344 1.87 9.13333H1.69333C1.33974 9.13333 1.0006 8.99286 0.750542 8.7428C0.500488 8.49275 0.360001 8.15362 0.360001 7.8C0.360001 7.4464 0.500488 7.10726 0.750542 6.85721C1.0006 6.60715 1.33974 6.46667 1.69333 6.46667H1.74667C1.97536 6.44051 2.19263 6.35308 2.37502 6.214C2.55742 6.07493 2.69856 5.88939 2.784 5.67733C2.87318 5.47443 2.9027 5.25071 2.86964 5.03165C2.83658 4.8126 2.74221 4.60723 2.59733 4.43867L2.564 4.39667C2.45014 4.26374 2.36314 4.10904 2.30813 3.94146C2.25312 3.77389 2.23122 3.59673 2.2438 3.42069C2.25639 3.24464 2.30317 3.07314 2.38106 2.91574C2.45896 2.75834 2.56652 2.61832 2.69733 2.50333C2.82815 2.38835 2.97982 2.30046 3.14369 2.24487C3.30757 2.18929 3.48073 2.16704 3.65277 2.17966C3.82482 2.19228 3.99281 2.23951 4.14721 2.31799C4.30161 2.39646 4.43948 2.50492 4.552 2.63667L4.594 2.67C4.76256 2.81488 4.96793 2.90925 5.18698 2.94231C5.40604 2.97537 5.62976 2.94585 5.83 2.85667H5.884C6.08407 2.77089 6.25707 2.63061 6.38498 2.45132C6.5129 2.27202 6.59056 2.06052 6.61067 1.84V1.66333C6.61067 1.30974 6.75115 0.970601 7.00121 0.720545C7.25126 0.470489 7.5904 0.330002 7.944 0.330002C8.2976 0.330002 8.63674 0.470489 8.88679 0.720545C9.13685 0.970601 9.27733 1.30974 9.27733 1.66333V1.71667C9.29744 1.93719 9.3751 2.14869 9.50302 2.32798C9.63093 2.50728 9.80393 2.64756 10.004 2.73333C10.2043 2.82251 10.428 2.85203 10.6471 2.81897C10.8661 2.78591 11.0715 2.69154 11.24 2.54667L11.282 2.51333C11.4149 2.39947 11.5696 2.31247 11.7372 2.25746C11.9048 2.20245 12.0819 2.18055 12.258 2.19313C12.434 2.20571 12.6055 2.25249 12.7629 2.33039C12.9203 2.40829 13.0603 2.51585 13.1753 2.64667C13.2903 2.77748 13.3782 2.92915 13.4338 3.09302C13.4894 3.2569 13.5116 3.43006 13.499 3.60211C13.4864 3.77415 13.4391 3.94215 13.3607 4.09654C13.2822 4.25094 13.1737 4.38881 13.042 4.50133L13 4.54333C12.8551 4.71189 12.7608 4.91726 12.7277 5.13631C12.6946 5.35537 12.7241 5.57908 12.8133 5.78V5.834C12.8991 6.03407 13.0394 6.20707 13.2187 6.33498C13.398 6.4629 13.6095 6.54056 13.83 6.56067H14C14.3536 6.56067 14.6927 6.70115 14.9428 6.95121C15.1929 7.20126 15.3333 7.5404 15.3333 7.894C15.3333 8.2476 15.1929 8.58674 14.9428 8.83679C14.6927 9.08685 14.3536 9.22733 14 9.22733H13.9467C13.7262 9.24744 13.5147 9.3251 13.3354 9.45302C13.1561 9.58093 13.0158 9.75393 12.93 9.954V10C12.93 10 12.93 10.042 12.9333 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Account Settings
          </button>

          <button className="user-menu-item" onClick={handleLogout}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.6667 11.3333L14 8L10.6667 4.66667"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 8H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign Out
          </button>
        </div>
      )}

      {/* Account Settings Modal */}
      {showSettings && (
        <AccountSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default UserMenu;

