import React, { useContext } from "react";
import { PLANT_LABELS } from "../../constants";
import GlobalContext from "../../context/GlobalContext";
import { EventListSkeleton } from "../common";

export default function Labels() {
    const { labels, updateLabel, isInitialLoading } = useContext(GlobalContext);
    
    return (
        <React.Fragment>
            <p className="text-secondary fw-bold mt-4">Labels</p>
            {isInitialLoading ? (
                <EventListSkeleton count={4} />
            ) : (
                labels.map((label, idx) => {
                // Find the icon class for this label
                const iconClass = Object.keys(PLANT_LABELS).find(key => 
                    PLANT_LABELS[key] === label.label
                ) || 'leaf';
                
                return (
                    <div key={idx} className="d-flex align-items-center mb-2">
                        <input
                            type="checkbox"
                            checked={label.checked}
                            onChange={() => updateLabel({ ...label, checked: !label.checked })}
                            className="me-2"
                        />
                        <span>
                            <i
                                className={`fi fi-rr-${iconClass}`}
                                style={{ fontSize: '20px' }} 
                            />
                        </span>
                        <span className="text-capitalize ms-2">{label.label}</span>
                    </div>
                );
                })
            )}
        </React.Fragment>
    );
}
