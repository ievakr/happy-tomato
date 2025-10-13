import React, { useContext } from 'react';
import CreateEventButton from '../forms/CreateEventButton';
import Labels from '../calendar/Labels';
import GlobalContext from '../../context/GlobalContext';

export default function Sidebar() {
    const { showSidebar, setShowSidebar } = useContext(GlobalContext);

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
            </aside>
        </>
    );
}
