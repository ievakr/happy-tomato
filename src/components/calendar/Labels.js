import React from "react";
import { PLANT_LABELS } from "../../constants";

export default function Labels() {
    return (
        <React.Fragment>
            <p className="text-secondary fw-bold mt-4">Labels</p>
            {Object.entries(PLANT_LABELS).map(([lblClass, plantName], idx) => (
                <div key={idx} className="d-flex align-items-center mb-2">
                    <span>
                        <i
                            className={`fi fi-rr-${lblClass}`}
                            style={{ fontSize: '20px' }} 
                        />
                    </span>
                    <span className="text-capitalize ms-2">{plantName}</span>
                </div>
            ))}
        </React.Fragment>
    );
}
