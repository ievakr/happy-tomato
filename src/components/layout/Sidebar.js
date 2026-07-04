import React, { useContext, useState } from 'react';
import CreateEventButton from '../forms/CreateEventButton';
import Labels from '../calendar/Labels';
import { useCalendarContext } from '../../context/CalendarContext';
import LayoutContext from '../../context/LayoutContext';
import { useEventContext } from '../../context/EventContext';
import { useTranslation } from '../../i18n/LanguageContext';

export default function Sidebar() {
    const { t } = useTranslation();
    const { showSidebar, setShowSidebar } = useContext(LayoutContext);
    const { setCurrentView, currentView } = useCalendarContext();
    const { setShowManagePlantsModal, setShowManageTodoModal } = useEventContext();
    const [isPlantManagementExpanded, setIsPlantManagementExpanded] = useState(false);
    const [isActionManagementExpanded, setIsActionManagementExpanded] = useState(false);

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
                    <h5 className="mb-0">{t('layout.menu')}</h5>
                    <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowSidebar(false)}
                        aria-label={t('common.close')}
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>
                
                <div className="sidebar-menu">
                    <div className="sidebar-section">
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
                            {t('layout.plantManagement')}
                        </button>
                        {isPlantManagementExpanded && (
                            <div className="sidebar-section-body">
                                <CreateEventButton />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => {
                                        setShowSidebar(false);
                                        setShowManagePlantsModal(true);
                                    }}
                                >
                                    <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                        eco
                                    </span>
                                    {t('layout.managePlants')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
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
                            {t('layout.todoManagement')}
                        </button>
                        {isActionManagementExpanded && (
                            <div className="sidebar-section-body">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => {
                                        setShowSidebar(false);
                                        setShowManageTodoModal(true);
                                    }}
                                >
                                    <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                        edit_note
                                    </span>
                                    {t('layout.manageTodo')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <Labels headerClassName="mb-0" contentClassName="" />
                    </div>

                    <div className="sidebar-section">
                        <button
                            type="button"
                            className={`btn w-100 ${currentView === 'guide' ? 'btn-danger' : 'btn-outline-secondary'}`}
                            onClick={() => {
                                setCurrentView('guide');
                                setShowSidebar(false);
                            }}
                        >
                            <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                menu_book
                            </span>
                            {t('layout.vegetableGuide')}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
