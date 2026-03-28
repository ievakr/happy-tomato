import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { migrateEventsToUser, deleteEventsWithoutUser, countEventsWithoutUser } from '../../utils/migrateEvents';

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
      setError('Failed to delete events. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="modal fade show d-block" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="mb-0">Checking Events...</h5>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  }

  if (eventCount === 0) {
    return (
      <>
        <div className="modal fade show d-block" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">All Events Assigned</h5>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p className="mb-0">All events in your database are properly assigned to users.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={onClose} type="button">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  }

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Unassigned Events Found</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" disabled={processing} />
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <strong>{eventCount}</strong> events in your database don't have a user assigned.
                <div className="mt-2">These are likely events created before authentication was added.</div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title">Claim These Events</h6>
                      <p className="card-text text-muted flex-grow-1">
                        Assign all unassigned events to your account ({currentUser?.email}).
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={handleMigrate}
                        disabled={processing}
                        type="button"
                      >
                        {processing ? 'Migrating...' : 'Claim Events'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border-danger">
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title text-danger">Delete These Events</h6>
                      <p className="card-text text-muted flex-grow-1">
                        Permanently remove all unassigned events from the database.
                      </p>
                      <button
                        className="btn btn-danger"
                        onClick={handleDelete}
                        disabled={processing}
                        type="button"
                      >
                        {processing ? 'Deleting...' : 'Delete Events'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={onClose} disabled={processing} type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default EventMigration;




