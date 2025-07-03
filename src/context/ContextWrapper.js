import React, {useEffect, useReducer, useState, useMemo} from "react";
import GlobalContext from "./GlobalContext";
import dayjs from "dayjs";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";

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

    async function handleEventDispatch({type, payload}) {
        setIsLoading(true);
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
                        
                        throw new Error(`Document with ID "${payload.id}" does not exist in Firebase`);
                    }
                } catch (deleteError) {
                    console.error('❌ Firebase delete error details:');
                    console.error('Error code:', deleteError.code);
                    console.error('Error message:', deleteError.message);
                    console.error('Full error:', deleteError);
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
            alert(`Failed to ${type} event. Please check your internet connection and try again.`);
            // Don't update local state if Firebase operation fails for deletes
            if (type !== 'delete') {
                dispatchCallEvent({ type, payload });
            }
        } finally {
            setIsLoading(false);
        }
    }; 
    useEffect(() => {
        fetchEvents().then(events => {
            dispatchCallEvent({ type: "load", payload: events }); // Add a 'load' case to your reducer to initialize state
        });
      }, []);      
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

    return (
        <GlobalContext.Provider value={{monthIndex, setMonthIndex, smallCalendarMonth, setSmallCalendarMonth, daySelected, setDaySelected, showEventModal, setShowEventModal, dispatchCallEvent: handleEventDispatch, savedEvents, selectedEvent, setSelectedEvent, labels, setLabels, updateLabel, filteredEvents, dosage, setDosage, showSidebar, setShowSidebar, isLoading, setIsLoading}}>
            {props.children}
        </GlobalContext.Provider>
    )
}