import React from 'react';
import { Footer } from '~/components/footer';
import { Navbar } from '~/components/navbar';
import EventDetailPage from '~/pages/eventDetailPage';

export function meta() {
  return [
    { title: "Event Details - Helpverse" },
    { name: "description", content: "View event details" },
  ];
}

export default function EventDetail() {
  // This would normally use the event ID from the URL params
  return (
    <main>
      <Navbar />
      <EventDetailPage />
      <Footer />
    </main>
  );
} 