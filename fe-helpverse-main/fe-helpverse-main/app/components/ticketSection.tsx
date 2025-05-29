import { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaCalendarAlt, FaClock } from "react-icons/fa";
import { Link } from "react-router";
import { useEventList } from "../hooks/useEvent";

export function TicketSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [itemsToShow, setItemsToShow] = useState(3);
    const { events, loading, error } = useEventList(1, 10);

    // Update items to show based on screen size
    useEffect(() => {
        const handleResize = () => {
            setItemsToShow(window.innerWidth < 768 ? 1 : 3);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => {
        if (currentIndex < events.length - itemsToShow) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            setCurrentIndex(events.length - itemsToShow);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 3000);
        return () => clearInterval(interval);
    }, [currentIndex, events.length, itemsToShow]);

    useEffect(() => {
        if (carouselRef.current) {
            const itemWidth = 250 + 16;
            carouselRef.current.scrollTo({
                left: currentIndex * itemWidth,
                behavior: 'smooth'
            });
        }
    }, [currentIndex]);

    if (loading) {
        return (
            <div className="bg-primary p-10">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-primary p-10">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="bg-primary p-10">
                <div className="text-center text-gray-600">
                    <p>No events available at this time.</p>
                </div>
            </div>
        );
    }

    // Format date to a more readable format
    const formatDate = (dateString: string | Date) => {
        try {
            const date = dateString instanceof Date ? dateString : new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
        } catch (e) {
            return String(dateString);
        }
    };

    return (
        <div className="bg-primary p-10 relative">
            <h1 className="text-secondary md:text-4xl text-2xl font-bold">Book Your Tickets</h1>

            <div className="relative mt-4">
                <button 
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-secondary text-primary rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-secondary/90 transition-colors"
                    aria-label="Previous slide"
                >
                    <FaChevronLeft />
                </button>
                
                <div 
                    ref={carouselRef}
                    className="flex overflow-hidden mt-4 scroll-smooth"
                >
                    {events.map((event) => (
                        <Link 
                            key={event.id} 
                            to={`/event/${event.id}`} 
                            className="md:w-[250px] md:h-[450px] h-[450px] w-[250px] rounded-md overflow-hidden flex-shrink-0 mx-2 transition-all duration-300 relative group"
                        >
                            <img 
                                src={`http://localhost:5000${event.image}`} 
                                alt={event.name || "Event image"} 
                                className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <h3 className="text-white font-bold text-lg">{event.name}</h3>
                                <div className="flex items-center text-white text-xs mt-1">
                                    <FaCalendarAlt className="mr-1" />
                                    <span>{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center text-white text-xs mt-1">
                                    <FaClock className="mr-1" />
                                    <span>{event.time}</span>
                                </div>
                                <div className="flex items-center text-white text-xs mt-1">
                                    <FaMapMarkerAlt className="mr-1" />
                                    <span>{event.location}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                
                <button 
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-secondary text-primary rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-secondary/90 transition-colors"
                    aria-label="Next slide"
                >
                    <FaChevronRight />
                </button>
                
                <div className="flex justify-center mt-4">
                    {Array.from({ length: Math.max(0, events.length - itemsToShow + 1) }).map((_, index) => (
                        <button 
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 mx-1 rounded-full ${currentIndex === index ? 'bg-secondary' : 'bg-gray-300'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
