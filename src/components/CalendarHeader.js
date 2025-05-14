import dayjs from 'dayjs';
import React, { useContext } from 'react';
import logo from '../assets/logo.png';
import GlobalContext from '../context/GlobalContext';

export default function CalendarHeader() {
    const {monthIndex, setMonthIndex} = useContext(GlobalContext)
    function handlePrevMonth() {
        setMonthIndex(monthIndex - 1)
    }
    function handleNextMonth() {
        setMonthIndex(monthIndex + 1)
    }
    function handleReset() {
        setMonthIndex(monthIndex === dayjs().month() ? monthIndex + Math.random() : dayjs().month())
    }
    return (
        <header className="d-flex align-items-center px-4 py-2">
            <img src={logo} alt="calendar" className="me-2" style={{ width: '48px', height: '48px' }} />
            <h1 className="me-3 mb-0 fs-4 text-secondary fw-bold">
                Happy Tomato
            </h1>
            <button onClick={handleReset} className="btn btn-outline-secondary me-3">
                Today
            </button>
            <button className="btn p-0" onClick={handlePrevMonth}>
                <span className="material-icons-outlined text-secondary mx-2">
                    chevron_left
                </span>
            </button>
            <button className="btn p-0" onClick={handleNextMonth}>
                <span className="material-icons-outlined text-secondary mx-2">
                    chevron_right
                </span>
            </button>
            <h2 className='ms-4 mb-0 fs-5 text-secondary fw-bold'>
                {dayjs(new Date(dayjs().year(), monthIndex)).format("MMMM YYYY")}
            </h2>
        </header>
    );
}
