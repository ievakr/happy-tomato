import React, {useEffect, useReducer, useState, useMemo} from "react";
import GlobalContext from "./GlobalContext";
import dayjs from "dayjs";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import errorLogger from "../utils/errorLogger";

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

async function fetchEvents() {
    try {
        console.log('Fetching events from Firebase...');
        const snapshot = await getDocs(collection(db, "events"));
        const events = snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            console.log('Fetched event:', data);
            return data;
        });
        console.log(`Successfully fetched ${events.length} events from Firebase`);
        return events;
    } catch (error) {
        console.error('Error fetching events from Firebase:', error);
        errorLogger.logError(error, null, 'Firebase Fetch Events', { 
            operation: 'fetch',
            timestamp: new Date().toISOString()
        });
        return [];
    }
}  

export default function ContextWrapper(props) {
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
    const [loadingTimeoutId, setLoadingTimeoutId] = useState(null)
    
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

    async function handleEventDispatch({type, payload}) {
        setLoadingWithTimeout(type, 30000); // 30 second timeout
        try {
            console.log(`Starting ${type} operation for event:`, payload);
            
            // Firestore side effects
            switch (type) {
              case "push":
                console.log('=== ADD OPERATION DEBUG ===');
                console.log('Event to add:', payload);
                try {
                    const docRef = await addDoc(collection(db, "events"), payload);
                    console.log('✅ Event added to Firebase with ID:', docRef.id);
                    console.log('Document path:', docRef.path);
                    
                    // Update the payload with the actual Firebase-generated ID
                    payload.id = docRef.id;
                    console.log('Updated payload with Firebase ID:', payload);
                } catch (addError) {
                    console.error('❌ Firebase add error:', addError);
                    errorLogger.logError(addError, null, 'Firebase Add Event', { 
                        operation: 'add',
                        payload: payload 
                    });
                    throw addError;
                }
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
                try {
                    const docRef = doc(db, "events", payload.id);
                    console.log('Document reference created:', docRef);
                    console.log('Document path:', docRef.path);
                    
                    // Check if document exists before deleting
                    console.log('Checking if document exists...');
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        console.log('Document exists, proceeding with delete...');
                        console.log('Document data:', docSnap.data());
                        
                        await deleteDoc(docRef);
                        console.log('✅ Event deleted from Firebase successfully');
                    } else {
                        console.error('❌ Document does not exist in Firebase!');
                        console.log('Available documents in Firebase:');
                        
                        // List all documents to see what IDs actually exist
                        const snapshot = await getDocs(collection(db, "events"));
                        snapshot.docs.forEach(d => {
                            console.log(`- Document ID: "${d.id}", Data:`, d.data());
                        });
                        
                        const notFoundError = new Error(`Document with ID "${payload.id}" does not exist in Firebase`);
                        errorLogger.logError(notFoundError, null, 'Firebase Delete Event', { 
                            operation: 'delete',
                            eventId: payload.id,
                            availableIds: snapshot.docs.map(d => d.id)
                        });
                        throw notFoundError;
                    }
                } catch (deleteError) {
                    console.error('❌ Firebase delete error details:');
                    console.error('Error code:', deleteError.code);
                    console.error('Error message:', deleteError.message);
                    console.error('Full error:', deleteError);
                    
                    errorLogger.logError(deleteError, null, 'Firebase Delete Event', { 
                        operation: 'delete',
                        eventId: payload.id,
                        errorCode: deleteError.code
                    });
                    throw deleteError; // Re-throw to be caught by outer catch
                }
                break;
              default:
                break;
            }
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
            
            // Show user-friendly error message
            const errorMessage = getErrorMessage(error, type);
            alert(errorMessage);
            
            // Don't update local state if Firebase operation fails for deletes
            if (type !== 'delete') {
                dispatchCallEvent({ type, payload });
            }
        } finally {
            clearLoadingState();
        }
    }; 
    useEffect(() => {
        async function loadInitialData() {
            // Set initial loading with timeout (longer for initial load)
            setIsInitialLoading(true);
            setLoadingWithTimeout('load', 45000); // 45 second timeout for initial load
            
            try {
                console.log('Loading initial events...');
                const events = await fetchEvents();
                dispatchCallEvent({ type: "load", payload: events });
                console.log(`Loaded ${events.length} events successfully`);
            } catch (error) {
                console.error('Failed to load initial events:', error);
                errorLogger.logError(error, null, 'Initial Data Load', { 
                    operation: 'initial_load',
                    timestamp: new Date().toISOString()
                });
            } finally {
                setIsInitialLoading(false);
                clearLoadingState();
            }
        }
        
        loadInitialData();
    }, []);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (loadingTimeoutId) {
                clearTimeout(loadingTimeoutId);
            }
        };
    }, [loadingTimeoutId]);      
    useEffect(() => {
        setLabels((prevLabels) => {
            // Collect all unique labels from all events' labels arrays
            const allLabels = savedEvents.flatMap(evt => evt.labels || []);
            const uniqueLabels = [...new Set(allLabels)];
            
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

    // Function to handle loading timeouts
    function setLoadingWithTimeout(operation, timeoutMs = 30000) {
        setIsLoading(true);
        setLoadingOperation(operation);
        
        // Clear any existing timeout
        if (loadingTimeoutId) {
            clearTimeout(loadingTimeoutId);
        }
        
        // Set new timeout
        const timeoutId = setTimeout(() => {
            console.warn(`Operation ${operation} timed out after ${timeoutMs}ms`);
            setIsLoading(false);
            setLoadingOperation(null);
            setLoadingTimeoutId(null);
            
            // Log timeout error
            errorLogger.logError(
                new Error(`Operation timeout: ${operation}`), 
                null, 
                'Loading Timeout', 
                { 
                    operation,
                    timeoutMs,
                    timestamp: new Date().toISOString()
                }
            );
            
            // Show user-friendly message
            alert(`The operation is taking longer than expected. Please check your internet connection and try again.`);
        }, timeoutMs);
        
        setLoadingTimeoutId(timeoutId);
    }

    // Function to clear loading state and timeout
    function clearLoadingState() {
        if (loadingTimeoutId) {
            clearTimeout(loadingTimeoutId);
            setLoadingTimeoutId(null);
        }
        setIsLoading(false);
        setLoadingOperation(null);
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
            loadingOperation
        }}>
            {props.children}
        </GlobalContext.Provider>
    )
}