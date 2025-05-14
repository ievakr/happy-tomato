import React from 'react'
import Day from './Day'

export default function Month({month}) {
    return (
        <div className="flex-grow-1 d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}>
            {month.map((row, i) => (
                <React.Fragment key={i}>
                    {row.map((day, idx) => (
                        <Day day={day} key={idx} rowIdx={i}/>
                    ))}
                </React.Fragment>
            ))}
        </div>
    )
}