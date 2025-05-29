import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaInfoCircle } from 'react-icons/fa';
import { Link, useParams } from 'react-router';
import { useEventDetail } from '../hooks/useEvent';
import type { Event, Ticket } from '../services/event';

// const event = {
//     id: '1',
//     image: 'https://via.placeholder.com/150',
//     title: 'Event 1',
//     description: 'Description of event 1',
//     venue: 'Venue 1',
//     date: '2023-01-01',
//     time: '10:00 AM',
//     price: 100,
//     promotionalOffers: [
//         {
//             code: 'PROMO1',
//             discountType: 'percentage',
//             discountValue: 10
//         }
//     ],
//     availableSeats: 100,
//     totalSeats: 200,
//     hastag: ['#Event 1', '#Event 2', '#Event 3']
// }


export default function EventDetailPage() {
    const { id } = useParams();
    const { event, loading, error } = useEventDetail(id);

    function calculateMinimumPrice(eventData: Event) {
        if (!eventData.tickets || eventData.tickets.length === 0) {
            return 0;
        }
        return eventData.tickets.reduce((min: number, ticket: Ticket) => {
            return Math.min(min, ticket.price);
        }, eventData.tickets[0].price);
    }

    if (loading) {
        return (
            <div className="py-6 md:py-28 px-4 md:px-8 lg:px-16">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="py-6 md:py-28 px-4 md:px-8 lg:px-16">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error || 'Event not found'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="py-28 md:py-28 px-4 md:px-8 lg:px-16 bg-secondary">
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center items-start">
                <div className="flex justify-center">
                    <img src={`http://localhost:5000${event.image}`} alt={event.name} className="w-[250px] h-[400px] object-cover rounded-lg shadow-md" />
                </div>
                <div className="bg-primary rounded-lg shadow-md p-4 text-secondary flex flex-col gap-3 md:w-1/3 max-w-md">
                    <h1 className="text-xl md:text-2xl font-bold">{event.name}</h1>
                    <p className="text-sm">{event.description}</p>

                    <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <FaMapMarkerAlt className="text-secondary w-4 h-4" />
                            <span>{event.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <FaCalendarAlt className="text-secondary w-4 h-4" />
                            <span>{event.date.toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <FaClock className="text-secondary w-4 h-4" />
                            <span>{event.time}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <FaTicketAlt className="text-secondary w-4 h-4" />
                            <span>{event.availableSeats}/{event.totalSeats} tickets available</span>
                        </div>
                    </div>

                    <div className="mt-1">
                        <div className="flex items-end gap-2 mb-1.5 text-sm">
                            <span className="">Start From </span><span className='font-bold text-[#FEB32B] text-2xl'>RM{calculateMinimumPrice(event)}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-0.5 mt-1">
                        {event.tags.map((tag) => (
                            <div key={tag} className="bg-primary text-secondary px-2 py-1 rounded-full text-sm">
                                #{tag}
                            </div>
                        ))}
                    </div>

                    <Link to={`/event/${event.id}/book`} className="mt-3 text-center bg-secondary text-primary py-2 px-4 rounded-md font-bold hover:bg-secondary/90 transition-colors text-sm">
                        Book Tickets
                    </Link>

                    {event.promotionalOffers && event.promotionalOffers.length > 0 && (
                        <div className="bg-yellow-100 p-2 rounded-md my-1">
                            <div className="flex items-start gap-2 text-yellow-800 text-sm">
                                <FaInfoCircle className="mt-0.5" />
                                <div>
                                    <p className="font-bold">Promo Available!</p>
                                    {event.promotionalOffers.map(promo => (
                                        <p key={promo.code}>
                                            Use code <span className="font-mono font-semibold">{promo.code}</span> for
                                            {promo.discountType === 'percentage' ?
                                                ` ${promo.discountValue}% discount` :
                                                ` RM${promo.discountValue} off`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
