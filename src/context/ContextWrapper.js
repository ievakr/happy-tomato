import React, {useEffect, useReducer, useState, useMemo} from "react";
import GlobalContext from "./GlobalContext";
import dayjs from "dayjs";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

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
    const snapshot = await getDocs(collection(db, "events"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    
    const filteredEvents = useMemo(() => {
        return savedEvents.filter(evt => labels.filter(lbl => lbl.checked).map(lbl => lbl.label).includes(evt.label))
    }, [savedEvents, labels]);

    function handleEventDispatch({type, payload}) {
        // Firestore side effects
        switch (type) {
          case "push":
            addDoc(collection(db, "events"), payload);
            break;
          case "update":
            updateDoc(doc(db, "events", payload.id), payload);
            break;
          case "delete":
            deleteDoc(doc(db, "events", payload.id));
            break;
          default:
            break;
        }
        // Local state update
        dispatchCallEvent({ type, payload });
    }; 
    useEffect(() => {
        fetchEvents().then(events => {
            dispatchCallEvent({ type: "load", payload: events }); // Add a 'load' case to your reducer to initialize state
        });
      }, []);      
    useEffect(() => {
        setLabels((prevLabels) => {
            return [...new Set(savedEvents.map(evt => evt.label))].map(label => {
                const currentLabel = prevLabels.find(lbl => lbl.label === label)
                console.log(currentLabel)
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
        <GlobalContext.Provider value={{monthIndex, setMonthIndex, smallCalendarMonth, setSmallCalendarMonth, daySelected, setDaySelected, showEventModal, setShowEventModal, dispatchCallEvent: handleEventDispatch, savedEvents, selectedEvent, setSelectedEvent, labels, setLabels, updateLabel, filteredEvents, dosage, setDosage, showSidebar, setShowSidebar}}>
            {props.children}
        </GlobalContext.Provider>
    )
}