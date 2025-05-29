import React from 'react';

export function meta() {
  return [
    { title: "Book Event - Helpverse" },
    { name: "description", content: "Book tickets for this event" },
  ];
}

export default function EventBooking() {
  // This would normally use the event ID from the URL params
  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Event Booking Page</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">This page allows users to book tickets for the event.</p>
      </div>
    </div>
  );
} 