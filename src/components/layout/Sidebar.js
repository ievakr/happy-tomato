import React, { useContext, useState, useEffect } from 'react';
import CreateEventButton from '../forms/CreateEventButton';
import Labels from '../calendar/Labels';
import LayoutContext from '../../context/LayoutContext';
import { useEventContext } from '../../context/EventContext';
import EventMigration from '../settings/EventMigration';
import { countEventsWithoutUser } from '../../utils/migrateEvents';

export default function Sidebar() {
    const { showSidebar, setShowSidebar } = useContext(LayoutContext);
    const { setShowManagePlantsModal, setShowManageTodoModal } = useEventContext();
    const [showMigration, setShowMigration] = useState(false);
    const [hasUnassignedEvents, setHasUnassignedEvents] = useState(false);
    const [isPlantManagementExpanded, setIsPlantManagementExpanded] = useState(false);
    const [isActionManagementExpanded, setIsActionManagementExpanded] = useState(false);

    useEffect(() => {
        // Check if there are unassigned events on mount
        const checkEvents = async () => {
            try {
                const count = await countEventsWithoutUser();
                setHasUnassignedEvents(count > 0);
            } catch {
                // Ignore - user may not have permission
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
                className={`sidebar border-end bg-white p-3 h-100 d-flex flex-column ${showSidebar ? 'mobile-sidebar-open' : ''}`}
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
                
                <div className="mb-4">
                    <button
                        type="button"
                        className="btn btn-link btn-collapse-toggle p-0 text-secondary fw-bold text-decoration-none d-flex w-100"
                        onClick={() => setIsPlantManagementExpanded(!isPlantManagementExpanded)}
                        aria-expanded={isPlantManagementExpanded}
                    >
                        <span
                            className="material-icons-outlined me-1"
                            style={{
                                fontSize: '1.25rem',
                                transition: 'transform 0.2s ease',
                                transform: isPlantManagementExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            }}
                        >
                            expand_more
                        </span>
                        Plant Management
                    </button>
                    {isPlantManagementExpanded && (
                        <div className="mt-3">
                            <div className="mb-3">
                                <CreateEventButton />
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={() => setShowManagePlantsModal(true)}
                            >
                                <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                    eco
                                </span>
                                Manage Plants
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <button
                        type="button"
                        className="btn btn-link btn-collapse-toggle p-0 text-secondary fw-bold text-decoration-none d-flex w-100"
                        onClick={() => setIsActionManagementExpanded(!isActionManagementExpanded)}
                        aria-expanded={isActionManagementExpanded}
                    >
                        <span
                            className="material-icons-outlined me-1"
                            style={{
                                fontSize: '1.25rem',
                                transition: 'transform 0.2s ease',
                                transform: isActionManagementExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            }}
                        >
                            expand_more
                        </span>
                        To-do management
                    </button>
                    {isActionManagementExpanded && (
                        <div className="mt-3">
                            <button
                                type="button"
                                className="btn btn-outline-secondary w-100"
                                onClick={() => setShowManageTodoModal(true)}
                            >
                                <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                    edit_note
                                </span>
                                Manage to-do
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <Labels />
                </div>

                {/* Migration button - only show if there are unassigned events */}
                {hasUnassignedEvents && (
                    <div className="mt-4 pt-3 border-top">
                        <button
                            className="btn btn-warning w-100"
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
