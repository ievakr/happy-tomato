import dayjs from 'dayjs';
import React, { useContext } from 'react';
import logo from '../../assets/logo.png';
import GlobalContext from '../../context/GlobalContext';

export default function Header() {
    const {monthIndex, setMonthIndex, showSidebar, setShowSidebar} = useContext(GlobalContext)
    function handlePrevMonth() {
        setMonthIndex(monthIndex - 1)
    }
    function handleNextMonth() {
        setMonthIndex(monthIndex + 1)
    }
    function toggleSidebar() {
        setShowSidebar(!showSidebar)
    }
    return (
        <header className="calendar-header d-flex align-items-center px-2 px-md-4 py-2">
            {/* Mobile sidebar toggle button */}
            <button 
                className="sidebar-toggle btn btn-outline-secondary d-md-none me-2" 
                onClick={toggleSidebar}
            >
                <span className="material-icons-outlined">
                    menu
                </span>
            </button>
            
            <img src={logo} alt="calendar" className="me-2" style={{ width: '32px', height: '32px' }} />
            
            {/* Desktop title */}
            <h1 className="d-none d-sm-block me-2 me-md-3 mb-0 fs-4 text-secondary fw-bold">
                Happy Tomato
            </h1>
            
            {/* Mobile title - styled differently */}
            <div className="d-sm-none me-2 mobile-title">
                <div className="d-flex flex-column">
                    <span className="mobile-title-main">Happy</span>
                    <span className="mobile-title-sub">Tomato</span>
                </div>
            </div>
            
            <div className="d-flex align-items-center me-2 me-md-4">
                <button className="btn btn-sm p-1" onClick={handlePrevMonth}>
                    <span className="material-icons-outlined text-secondary">
                        chevron_left
                    </span>
                </button>
                <button className="btn btn-sm p-1" onClick={handleNextMonth}>
                    <span className="material-icons-outlined text-secondary">
                        chevron_right
                    </span>
                </button>
            </div>
            
            <h2 className='mb-0 fs-5 text-secondary fw-bold'>
                <span className="d-none d-md-inline">
                    {dayjs(new Date(dayjs().year(), monthIndex)).format("MMMM YYYY")}
                </span>
                <span className="d-md-none">
                    {dayjs(new Date(dayjs().year(), monthIndex)).format("MMM YYYY")}
                </span>
            </h2>
        </header>
    );
}
