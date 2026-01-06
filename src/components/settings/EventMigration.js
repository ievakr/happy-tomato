import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { migrateEventsToUser, deleteEventsWithoutUser, countEventsWithoutUser } from '../../utils/migrateEvents';
import './EventMigration.css';

/**
 * Component for migrating or cleaning up events without userId
 */
function EventMigration({ onClose }) {
  const { currentUser } = useAuth();
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkForUnassignedEvents();
  }, []);

  const checkForUnassignedEvents = async () => {
    try {
      setLoading(true);
      const count = await countEventsWithoutUser();
      setEventCount(count);
    } catch (err) {
      console.error('Error checking events:', err);
      setError('Failed to check for unassigned events');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!currentUser) {
      setError('You must be logged in to migrate events');
      return;
    }

    const confirmed = window.confirm(
      `This will assign ${eventCount} unassigned events to your account (${currentUser.email}). Continue?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      setError('');
      setMessage('');
      
      const migratedCount = await migrateEventsToUser(currentUser.uid);
      setMessage(`Successfully migrated ${migratedCount} events to your account!`);
      setEventCount(0);
      
      // Reload the page to refresh events
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Migration error:', err);
      setError('Failed to migrate events. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `⚠️ WARNING: This will permanently delete ${eventCount} unassigned events. This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    // Double confirmation for destructive action
    const doubleConfirmed = window.confirm(
      'Are you absolutely sure? This will delete all events without a user.'
    );

    if (!doubleConfirmed) return;

    try {
      setProcessing(true);
      setError('');
      setMessage('');
      
      const deletedCount = await deleteEventsWithoutUser();
      setMessage(`Successfully deleted ${deletedCount} unassigned events.`);
      setEventCount(0);
      
      // Reload the page to refresh events
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete events. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="migration-overlay">
        <div className="migration-modal">
          <h3>Checking Events...</h3>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (eventCount === 0) {
    return (
      <div className="migration-overlay">
        <div className="migration-modal">
          <h3>✅ All Events Assigned</h3>
          <p>All events in your database are properly assigned to users.</p>
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="migration-overlay">
      <div className="migration-modal">
        <h3>⚠️ Unassigned Events Found</h3>
        
        <div className="migration-info">
          <p>
            <strong>{eventCount}</strong> events in your database don't have a user assigned.
          </p>
          <p>
            These are likely events created before authentication was added.
          </p>
        </div>

        {error && <div className="migration-error">{error}</div>}
        {message && <div className="migration-success">{message}</div>}

        <div className="migration-options">
          <div className="option-card">
            <h4>📥 Claim These Events</h4>
            <p>Assign all unassigned events to your account ({currentUser?.email})</p>
            <button
              className="btn-primary"
              onClick={handleMigrate}
              disabled={processing}
            >
              {processing ? 'Migrating...' : 'Claim Events'}
            </button>
          </div>

          <div className="option-card danger">
            <h4>🗑️ Delete These Events</h4>
            <p>Permanently remove all unassigned events from the database</p>
            <button
              className="btn-danger"
              onClick={handleDelete}
              disabled={processing}
            >
              {processing ? 'Deleting...' : 'Delete Events'}
            </button>
          </div>
        </div>

        <button className="btn-secondary" onClick={onClose} disabled={processing}>
          Close
        </button>
      </div>
    </div>
  );
}

export default EventMigration;

