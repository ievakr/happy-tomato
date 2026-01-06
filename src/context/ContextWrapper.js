import React, {useEffect, useReducer, useState, useMemo} from "react";
import GlobalContext from "./GlobalContext";
import dayjs from "dayjs";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where } from "firebase/firestore";
import errorLogger from "../utils/errorLogger";
import { PLANT_LABELS } from "../constants";
import { useAuth } from "./AuthContext";

function savedEventsReducer(state, { type, payload }) {
    switch (type) {
      case "push":
        return [...state, payload];
      case "update":
        return state.map(evt => evt.id === payload.id ? payload : evt);
        case "delete":
        return state.filter(evt => evt.id !== payload.id);                    
      case "load":
        return payload;
      default:
        throw new Error();
    }
  }  

async function fetchEvents(userId) {
    try {
        console.log('Fetching events from Firebase for user:', userId);
        
        // Query events filtered by userId
        const eventsQuery = query(
            collection(db, "events"),
            where("userId", "==", userId)
        );
        
        const snapshot = await getDocs(eventsQuery);
        const events = snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            console.log('Fetched event:', data);
            return data;
        });
        console.log(`Successfully fetched ${events.length} events from Firebase for user ${userId}`);
        return events;
    } catch (error) {
        console.error('Error fetching events from Firebase:', error);
        errorLogger.logError(error, null, 'Firebase Fetch Events', { 
            operation: 'fetch',
            userId: userId,
            timestamp: new Date().toISOString()
        });
        return [];
    }
}  

export default function ContextWrapper(props) {
    const { currentUser } = useAuth();
    
    // Get responsive info to set initial view
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    
    // Update window width on resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);
    
    const isMobile = windowWidth <= 768;
    const getInitialView = () => isMobile ? 'daily' : 'month';
    
    const [monthIndex, setMonthIndex] = useState(dayjs().month())
    const [smallCalendarMonth, setSmallCalendarMonth] = useState(null)
    const [daySelected, setDaySelected] = useState(dayjs())
    const [showEventModal, setShowEventModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [labels, setLabels] = useState([])
    const [savedEvents, dispatchCallEvent] = useReducer(savedEventsReducer, [])
    const [dosage, setDosage] = useState("");
    const [showSidebar, setShowSidebar] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [loadingOperation, setLoadingOperation] = useState(null)
    const [currentView, setCurrentView] = useState(getInitialView())
    const [weekIndex, setWeekIndex] = useState(0)
    const [currentDayIndex, setCurrentDayIndex] = useState(0)

    const [operationQueue, setOperationQueue] = useState([])
    const [isProcessingOperation, setIsProcessingOperation] = useState(false)
    
    const filteredEvents = useMemo(() => {
        // If no labels are set up yet, show all events
        if (labels.length === 0) {
            return savedEvents;
        }
        
        const checkedLabels = labels.filter(lbl => lbl.checked).map(lbl => lbl.label);
        
        return savedEvents.filter(evt => {
            // Show events that have no labels
            if (!evt.labels || evt.labels.length === 0) {
                return true;
            }
            
            // Show events that have at least one checked label
            return evt.labels.some(eventLabel => checkedLabels.includes(eventLabel));
        });
    }, [savedEvents, labels]);

    function getErrorMessage(error, operation) {
        // Check for specific Firebase error codes
        if (error.code) {
            switch (error.code) {
                case 'permission-denied':
                    return 'Permission denied. Please check your authentication.';
                case 'unavailable':
                    return 'Service temporarily unavailable. Please try again later.';
                case 'not-found':
                    return 'The requested data was not found.';
                case 'already-exists':
                    return 'This item already exists.';
                case 'resource-exhausted':
                    return 'Too many requests. Please wait a moment and try again.';
                case 'failed-precondition':
                    return 'Operation failed due to system constraints.';
                case 'aborted':
                    return 'Operation was aborted. Please try again.';
                case 'out-of-range':
                    return 'Invalid data range provided.';
                case 'unauthenticated':
                    return 'Authentication required. Please sign in.';
                case 'deadline-exceeded':
                    return 'Request timed out. Please check your connection and try again.';
                default:
                    break;
            }
        }

        // Check for network errors
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return 'Network error. Please check your internet connection and try again.';
        }

        // Operation-specific error messages
        switch (operation) {
            case 'push':
                return 'Failed to create event. Please check your internet connection and try again.';
            case 'update':
                return 'Failed to update event. Please check your internet connection and try again.';
            case 'delete':
                return 'Failed to delete event. Please check your internet connection and try again.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }

    // Enhanced retry logic with exponential backoff
    async function retryOperation(operation, maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`Operation attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw error; // Final attempt failed, throw the error
                }
                
                // Exponential backoff: wait 1s, then 2s, then 4s, etc.
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async function handleEventDispatch({type, payload}) {
        // Prevent concurrent operations to avoid conflicts
        if (isProcessingOperation) {
            console.log('Operation already in progress, queuing new operation:', { type, payload });
            setOperationQueue(prev => [...prev, { type, payload }]);
            return;
        }

        setIsProcessingOperation(true);
        setIsLoading(true);
        setLoadingOperation(type);
        
        try {
            console.log(`Starting ${type} operation for event:`, payload);
            
            // Wrap Firebase operations in retry logic
            await retryOperation(async () => {
                switch (type) {
                  case "push":
                    console.log('=== ADD OPERATION DEBUG ===');
                    console.log('Event to add:', payload);
                    
                    // Add userId to the event
                    const eventWithUserId = {
                        ...payload,
                        userId: currentUser.uid
                    };
                    console.log('Event with userId:', eventWithUserId);
                    
                    const addDocRef = await addDoc(collection(db, "events"), eventWithUserId);
                    console.log('✅ Event added to Firebase with ID:', addDocRef.id);
                    console.log('Document path:', addDocRef.path);
                    
                    // Update the payload with the actual Firebase-generated ID and userId
                    payload.id = addDocRef.id;
                    payload.userId = currentUser.uid;
                    console.log('Updated payload with Firebase ID:', payload);
                    break;
                  case "update":
                    console.log('Updating event in Firebase...');
                    await updateDoc(doc(db, "events", payload.id), payload);
                    console.log('Event updated in Firebase successfully');
                    break;
                  case "delete":
                    console.log('=== DELETE OPERATION DEBUG ===');
                    console.log('Event to delete:', payload);
                    console.log('Event ID to delete:', payload.id);
                    console.log('Event ID type:', typeof payload.id);
                    
                    // Check if the document exists first
                    const deleteDocRef = doc(db, "events", payload.id);
                    console.log('Document reference created:', deleteDocRef);
                    console.log('Document path:', deleteDocRef.path);
                    
                    // Check if document exists before deleting
                    console.log('Checking if document exists...');
                    const docSnap = await getDoc(deleteDocRef);
                    if (docSnap.exists()) {
                        console.log('Document exists, proceeding with delete...');
                        console.log('Document data:', docSnap.data());
                        
                        await deleteDoc(deleteDocRef);
                        console.log('✅ Event deleted from Firebase successfully');
                    } else {
                        console.warn('⚠️ Document does not exist in Firebase - likely already deleted or never synced');
                        console.log('Event ID:', payload.id);
                        
                        // For delete operations, if document doesn't exist in Firebase,
                        // we should still proceed to clean up the local state
                        // This handles cases where events exist locally but not in Firebase due to sync issues
                        console.log('Proceeding with local cleanup since document was not found in Firebase');
                    }
                    break;
                  default:
                    break;
                }
            });
            
            // Local state update only after Firebase operation completes
            dispatchCallEvent({ type, payload });
            console.log(`${type} operation completed successfully`);
        } catch (error) {
            console.error(`Error performing ${type} operation:`, error);
            
            // Log the error with context
            errorLogger.logError(error, null, 'Event Operation', { 
                operation: type,
                payload: payload,
                timestamp: new Date().toISOString()
            });
            
            // Show user-friendly error message with more context
            const errorMessage = getErrorMessage(error, type);
            alert(`${errorMessage}\n\nIf this problem persists, try refreshing the page.`);
            
            // Don't update local state if Firebase operation fails for deletes
            if (type !== 'delete') {
                dispatchCallEvent({ type, payload });
            }
        } finally {
            setIsLoading(false);
            setLoadingOperation(null);
            setIsProcessingOperation(false);
            
            // Process queued operations
            if (operationQueue.length > 0) {
                const nextOperation = operationQueue[0];
                setOperationQueue(prev => prev.slice(1));
                console.log('Processing queued operation:', nextOperation);
                // Small delay to prevent overwhelming Firebase
                setTimeout(() => handleEventDispatch(nextOperation), 100);
            }
        }
    }; 
    
    useEffect(() => {
        async function loadInitialData() {
            // Only load events if user is authenticated
            if (!currentUser) {
                console.log('No user authenticated, skipping event load');
                setIsInitialLoading(false);
                return;
            }
            
            // Set initial loading
            setIsInitialLoading(true);
            setIsLoading(true);
            setLoadingOperation('load');
            
            try {
                console.log('Loading initial events for user:', currentUser.uid);
                
                // Use retry logic for initial load as well, passing userId
                const events = await retryOperation(() => fetchEvents(currentUser.uid), 2);
                dispatchCallEvent({ type: "load", payload: events });
                console.log(`Loaded ${events.length} events successfully`);
            } catch (error) {
                console.error('Failed to load initial events:', error);
                errorLogger.logError(error, null, 'Initial Data Load', { 
                    operation: 'initial_load',
                    userId: currentUser?.uid,
                    timestamp: new Date().toISOString()
                });
                
                // Show a more helpful error message for initial load failures
                alert('Failed to load your events. Please check your internet connection and refresh the page.');
            } finally {
                setIsInitialLoading(false);
                setIsLoading(false);
                setLoadingOperation(null);
            }
        }
        
        loadInitialData();
    }, [currentUser]);
    
      
    useEffect(() => {
        setLabels((prevLabels) => {
            // Include all available plant labels from constants
            const allAvailableLabels = Object.values(PLANT_LABELS);
            
            // Also collect labels from existing events in case there are custom ones
            const eventLabels = savedEvents.flatMap(evt => evt.labels || []);
            
            // Combine both and get unique labels
            const uniqueLabels = [...new Set([...allAvailableLabels, ...eventLabels])];
            
            return uniqueLabels.map(label => {
                const currentLabel = prevLabels.find(lbl => lbl.label === label)
                return {
                    label,
                    checked : currentLabel ? currentLabel.checked : true,
                }
            })
        })
    }, 
    [savedEvents])
    useEffect(() => {
        if(smallCalendarMonth !== null){
            setMonthIndex(smallCalendarMonth)
        }
    }, [smallCalendarMonth])
    useEffect(() => {
        if(!showEventModal){
            setSelectedEvent(null)
        }
    }, [showEventModal])
    
    function updateLabel(label) {
        setLabels(
          labels.map((lbl) => (lbl.label === label.label ? label : lbl))
        );
    }



    return (
        <GlobalContext.Provider value={{
            monthIndex, 
            setMonthIndex, 
            smallCalendarMonth, 
            setSmallCalendarMonth, 
            daySelected, 
            setDaySelected, 
            showEventModal, 
            setShowEventModal, 
            dispatchCallEvent: handleEventDispatch, 
            savedEvents, 
            selectedEvent, 
            setSelectedEvent, 
            labels, 
            setLabels, 
            updateLabel, 
            filteredEvents, 
            dosage, 
            setDosage, 
            showSidebar, 
            setShowSidebar, 
            isLoading, 
            setIsLoading,
            isInitialLoading,
            loadingOperation,
            currentView,
            setCurrentView,
            weekIndex,
            setWeekIndex,
            currentDayIndex,
            setCurrentDayIndex
        }}>
            {props.children}
        </GlobalContext.Provider>
    )
}