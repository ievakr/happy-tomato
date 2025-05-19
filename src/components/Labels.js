import React from "react";

const labelsClasses = {
    "rose": "Roses",
    "tomato": "Tomatoes",
    "cucumber": "Cucumbers",
    "radish": "Radishes",
    "onion": "Onions",
    "pepper-alt": "Bell Peppers",
    "leafy-green": "Salad",
    "garlic-alt": "Garlic",
    "carrot": "Carrot",
    "broccoli": "Broccoli",
    "watermelon": "Watermelon",
    "strawberry": "Strawberries",
    "pumpkin": "Squash"
};

export default function Labels() {
    return (
        <React.Fragment>
            <p className="text-secondary fw-bold mt-4">Labels</p>
            {Object.entries(labelsClasses).map(([lblClass, plantName], idx) => (
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
