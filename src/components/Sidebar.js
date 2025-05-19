import React from 'react';
import CreateEventButton from './CreateEventButton';
import Labels from './Labels';

export default function Sidebar() {
    return (
        <aside className="border p-3" style={{ width: '300px' }}>
            <div className="d-flex justify-content-center mb-4">
                <CreateEventButton />
            </div>
            <Labels />
        </aside>
    );
}
