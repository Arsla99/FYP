// import { useState, useEffect } from 'react';
// import Navbar from '../../components/Navbar';
// import ContactList from '../../components/ContactList';

// const SOSPage = () => {
//     const [countdown, setCountdown] = useState(10);
//     const [contacts, setContacts] = useState([]);

//     useEffect(() => {
//         const timer = setInterval(() => {
//             setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
//         }, 1000);

//         return () => clearInterval(timer);
//     }, []);

//     const handleConfirmAndCall = () => {
//         // Logic to confirm and call emergency contacts
//     };

//     return (
//         <div className="flex flex-col min-h-screen">
//             <Navbar />
//             <main className="flex-grow flex flex-col items-center justify-center">
//                 <h1 className="text-2xl font-bold mb-4">Sending Alert...</h1>
//                 <p className="text-lg mb-4">Countdown: {countdown}</p>
//                 <ContactList contacts={contacts} />
//                 <button
//                     onClick={handleConfirmAndCall}
//                     className="mt-4 bg-red-500 text-white py-2 px-4 rounded"
//                 >
//                     Confirm and Call
//                 </button>
//             </main>
//         </div>
//     );
// };

// export default SOSPage;



import React, { useState, useRef } from "react";
import Link from "next/link"; // Assuming Link is still needed for footer navigation

export default function Home() {
  const [isPressing, setIsPressing] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info"); // To style feedback

  const handleMouseDown = () => {
    setIsPressing(true);
    setMessage(""); // Clear previous messages
    setMessageType("info");

    const timer = setTimeout(() => {
      // After 3 seconds, trigger the SOS call
      sendSosCall();
      setIsPressing(false); // Reset pressing state after call attempt
    }, 3000); // 3 seconds
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    setIsPressing(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    // If released before 3 seconds, don't send SOS
    if (!message) { // Only show this if no other message (like success/error) was set
       setMessage("Press and hold for 3 seconds to send SOS.");
       setMessageType("info");
    }
  };

  const sendSosCall = async () => {
    setMessage("Sending SOS...");
    setMessageType("info");
    const flaskApiUrl = "/api/app-twillo"; // Updated API endpoint for app-twillo

    try {
      // You can get the real location here if you implement browser geolocation
      // For now, we'll send a static location or try to get it from browser API
      let currentLocation = "Unknown location";
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          currentLocation = `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`;
          setMessage(`Location detected: ${currentLocation}`);
        } catch (geoError: any) {
          console.error("Geolocation error:", geoError);
          setMessage("Could not get location. Sending SOS from Unknown location.");
        }
      }

      const response = await fetch(flaskApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // CORS is handled by Flask-CORS, so no need for origin headers here
        },
        body: JSON.stringify({ location: currentLocation }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`SOS sent successfully! SID: ${data.sid}`);
        setMessageType("success");
        // You might want to redirect to /sending-alert here if you still need that page
        // router.push("/sending-alert");
      } else {
        setMessage(`Failed to send SOS: ${data.error || "Unknown error"}`);
        setMessageType("error");
      }
    } catch (err) {
      console.error("Error sending SOS call:", err);
      setMessage("Network error: Could not reach SOS service.");
      setMessageType("error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 flex flex-col items-center">
        <span className="text-xs text-gray-500">Current location</span>
        <span className="font-semibold text-gray-800">San Francisco, California</span>
      </header>

      {/* SOS Button */}
      <main className="flex flex-col items-center flex-1 justify-center">
        <button
          className={`w-56 h-56 rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg flex items-center justify-center text-white text-4xl font-bold mb-8 transition-transform ${isPressing ? 'scale-95' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Important: If user drags mouse off button
          onTouchStart={handleMouseDown} // For mobile devices
          onTouchEnd={handleMouseUp}     // For mobile devices
        >
          SOS
        </button>
        <span className="text-gray-500 mb-6">Press for 3s for SOS</span>

        {message && (
          <p className={`mt-4 text-center px-4 py-2 rounded ${
            messageType === "success" ? "bg-green-100 text-green-700" :
            messageType === "error" ? "bg-red-100 text-red-700" :
            "bg-blue-100 text-blue-700"
          }`}>
            {message}
          </p>
        )}

        {/* Emergency Types */}
        <div className="flex flex-wrap gap-3 justify-center">
          {["Medical", "Fire", "Accident", "Natural disaster", "Rescue", "Violence"].map(type => (
            <button
              key={type}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 shadow text-sm font-medium text-gray-700 hover:bg-orange-50"
            >
              {type}
            </button>
          ))}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t shadow-inner py-2 px-4 flex justify-between fixed bottom-0 left-0 right-0">
        <Link href="/sos" className="flex flex-col items-center text-orange-500">
          <span className="material-icons">home</span>
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center text-gray-500">
          <span className="material-icons">settings</span>
          <span className="text-xs">Settings</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-500">
          <span className="material-icons">person</span>
          <span className="text-xs">Profile</span>
        </Link>
      </footer>
    </div>
  );
}