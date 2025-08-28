import React, { useContext, useState } from 'react';
import CreateEventButton from '../forms/CreateEventButton';
import Labels from '../calendar/Labels';
import GlobalContext from '../../context/GlobalContext';
import { useRecurringActions } from '../../hooks';

export default function Sidebar() {
    const { showSidebar, setShowSidebar, isLoading } = useContext(GlobalContext);
    const { getAllPendingTodos, deleteAllRecurringTodos, nukeAllRecurringTodosFromFirebase } = useRecurringActions();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const pendingTodos = getAllPendingTodos();
    const hasPendingTodos = pendingTodos.length > 0;
    
    const handleDeleteAll = async () => {
        try {
            setIsDeleting(true);
            
            // Check if todos have the old ID format (indicating potential mismatch with Firebase)
            const currentTodos = getAllPendingTodos();
            const hasOldIdFormat = currentTodos.some(todo => 
                todo.id && todo.id.startsWith('todo-') && todo.id.includes('-')
            );
            
            if (hasOldIdFormat) {
                console.log('🧨 Detected old ID format - running nuclear delete first...');
                const nuclearDeletedCount = await nukeAllRecurringTodosFromFirebase();
                console.log(`🧨 Nuclear delete removed ${nuclearDeletedCount} recurring todos from Firebase`);
                
                if (nuclearDeletedCount > 0) {
                    // Force page reload to sync with Firebase
                    console.log('🔄 Reloading page to sync with Firebase...');
                    window.location.reload();
                    return; // Exit early, page will reload
                }
            }
            
            // Try normal delete 
            console.log('🗑️ Attempting normal delete...');
            const normalDeletedCount = await deleteAllRecurringTodos();
            console.log(`✅ Successfully deleted ${normalDeletedCount} recurring todos`);
            
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Failed to delete recurring todos:', error);
        } finally {
            setIsDeleting(false);
        }
    };

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
                
                {/* Bulk Delete Todos Section */}
                {hasPendingTodos && (
                    <div className="mb-4 p-3 border rounded bg-light">
                        <h6 className="mb-2 text-muted">
                            <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                event_note
                            </span>
                            Recurring Todos
                        </h6>
                        <p className="small text-muted mb-2">
                            {pendingTodos.length} auto-generated todo{pendingTodos.length !== 1 ? 's' : ''} found
                        </p>
                        
                        {/* Show fix button if old-style IDs detected */}
                        {pendingTodos.some(todo => todo.id && todo.id.includes('-') && !todo.id.match(/^[a-zA-Z0-9]{20}$/)) && (
                            <button
                                className="btn btn-warning btn-sm w-100 mb-2"
                                onClick={async () => {
                                    try {
                                        setIsDeleting(true);
                                        console.log('🧨 Manual nuclear cleanup triggered...');
                                        await nukeAllRecurringTodosFromFirebase();
                                        console.log('✅ Nuclear cleanup completed - reloading page');
                                        window.location.reload();
                                    } catch (error) {
                                        console.error('❌ Nuclear cleanup failed:', error);
                                        alert('Cleanup failed. Please try again.');
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isLoading || isDeleting}
                                title="Fix sync issues with Firebase - removes orphaned TODOs"
                            >
                                <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                                    build
                                </span>
                                Fix Sync Issues
                            </button>
                        )}
                        
                        <button
                            className="btn btn-outline-warning btn-sm w-100"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isLoading || isDeleting}
                        >
                            <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                                delete_sweep
                            </span>
                            Delete All Todos
                        </button>
                    </div>
                )}
                
                <Labels />
            </aside>
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" style={{ zIndex: 1070, backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <div className="bg-white rounded shadow-lg p-4" style={{ maxWidth: '400px', width: '90%' }}>
                        <h6 className="mb-3">
                            <span className="material-icons-outlined text-warning me-2" style={{ fontSize: '1.2rem', verticalAlign: 'middle' }}>
                                warning
                            </span>
                            Delete All Recurring Todos
                        </h6>
                        <p className="mb-3 text-muted">
                            This will permanently delete <strong>{pendingTodos.length}</strong> auto-generated todo{pendingTodos.length !== 1 ? 's' : ''} from your calendar.
                        </p>
                        <div className="mb-3 p-2 bg-light rounded">
                            <small className="text-muted">
                                <strong>Note:</strong> This only removes pending todos. Completed actions will remain untouched.
                            </small>
                        </div>
                        <p className="mb-4 text-muted small">This action cannot be undone.</p>
                        <div className="d-flex justify-content-end gap-2">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-warning"
                                onClick={handleDeleteAll}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Deleting...</span>
                                        </span>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                                            delete_sweep
                                        </span>
                                        Delete All Todos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
