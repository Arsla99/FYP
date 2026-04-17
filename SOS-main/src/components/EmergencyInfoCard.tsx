import React from 'react';

const EmergencyInfoCard = () => {
    const emergencyTypes = [
        { name: 'Medical', color: 'bg-red-500' },
        { name: 'Fire', color: 'bg-orange-500' },
        { name: 'Accident', color: 'bg-yellow-500' },
        { name: 'Police', color: 'bg-blue-500' },
        { name: 'Natural Disaster', color: 'bg-green-500' },
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {emergencyTypes.map((type) => (
                <button
                    key={type.name}
                    className={`p-4 text-white font-bold rounded ${type.color} hover:opacity-80`}
                >
                    {type.name}
                </button>
            ))}
        </div>
    );
};

export default EmergencyInfoCard;