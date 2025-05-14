import React, { useContext } from 'react';
import plusImg from '../assets/plus.png';
import GlobalContext from '../context/GlobalContext';
import dayjs from "dayjs";

export default function CreateEventButton() {
    const {setShowEventModal, setDaySelected, setDosage} = useContext(GlobalContext)
    return (
        <button onClick={() => {setDaySelected(dayjs()); setShowEventModal(true); setDosage("")}} className='btn btn-outline-secondary d-flex align-items-center shadow-sm'>
            <img src={plusImg} alt='create_event' className='me-2' style={{ width: '24px', height: '24px' }} />
            <span>Create</span>
        </button>
    );
}
