import React, { useContext, useState, useEffect } from 'react';
import CreateEventButton from '../forms/CreateEventButton';
import Labels from '../calendar/Labels';
import LayoutContext from '../../context/LayoutContext';
import EventMigration from '../settings/EventMigration';
import { countEventsWithoutUser } from '../../utils/migrateEvents';

export default function Sidebar() {
    const { showSidebar, setShowSidebar } = useContext(LayoutContext);
    const [showMigration, setShowMigration] = useState(false);
    const [hasUnassignedEvents, setHasUnassignedEvents] = useState(false);

    useEffect(() => {
        // Check if there are unassigned events on mount
        const checkEvents = async () => {
            try {
                const count = await countEventsWithoutUser();
                setHasUnassignedEvents(count > 0);
            } catch (error) {
                console.error('Error checking for unassigned events:', error);
            }
        };
        
        checkEvents();
    }, []);

    return (
        <>
            {/* Mobile overlay */}
            {showSidebar && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none" 
                    style={{ zIndex: 1040 }}
                    onClick={() => setShowSidebar(false)}
                />
            )}
            
            {/* Sidebar */}
            <aside 
                className={`sidebar border p-3 ${showSidebar ? 'mobile-sidebar-open' : ''}`}
                style={{ width: '300px' }}
            >
                {/* Mobile close button */}
                <div className="d-flex justify-content-between align-items-center mb-3 d-md-none">
                    <h5 className="mb-0">Menu</h5>
                    <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowSidebar(false)}
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>
                
                <div className="d-flex justify-content-center mb-4">
                    <CreateEventButton />
                </div>
                
                <Labels />

                {/* Migration button - only show if there are unassigned events */}
                {hasUnassignedEvents && (
                    <div className="mt-4 pt-3 border-top">
                        <button
                            className="btn btn-warning w-100 btn-sm"
                            onClick={() => setShowMigration(true)}
                            title="Migrate or delete events without a user"
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>
                                warning
                            </span>
                            Manage Unassigned Events
                        </button>
                    </div>
                )}
            </aside>

            {/* Migration Modal */}
            {showMigration && (
                <EventMigration onClose={() => {
                    setShowMigration(false);
                    setHasUnassignedEvents(false);
                }} />
            )}
        </>
    );
}
