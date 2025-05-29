import { FaTicketAlt, FaTheaterMasks, FaRunning, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { eventService } from "../services/event";
import type { PromotionalOffer, Event } from "../services/event";
import { Link } from "react-router";

// Interface for eventOffers state
interface EventOffer {
    event: string;
    offer: PromotionalOffer;
    eventId: string; // Adding eventId for link to event details
}

// Function to get icon based on discount type
const getIconByDiscountType = (discountType: string, discountValue: number) => {
    if (discountType === 'percentage') {
        return <FaTicketAlt className="text-secondary text-5xl" />;
    } else if (discountType === 'fixed') {
        return <FaTheaterMasks className="text-secondary text-5xl" />;
    } else {
        return <FaRunning className="text-secondary text-5xl" />;
    }
};

export function PromotionSection() {
    const [eventOffers, setEventOffers] = useState<EventOffer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [itemsToShow, setItemsToShow] = useState(3); // Default for desktop

    // Fetch promotional offers from API
    useEffect(() => {
        const fetchPromotionalOffers = async () => {
            try {
                setLoading(true);
                // Using eventService to get data
                const response = await eventService.getAllEvents();
                const events = response.events || [];
                
                // Collect all active promos from all events
                const offers: EventOffer[] = [];
                
                events.forEach(event => {
                    if (event.promotionalOffers && event.promotionalOffers.length > 0) {
                        event.promotionalOffers
                            .filter(offer => offer.active)
                            .forEach(offer => {
                                offers.push({
                                    event: event.name,
                                    offer,
                                    eventId: event._id // Store event ID for link
                                });
                            });
                    }
                });
                
                setEventOffers(offers);
            } catch (err) {
                setError("Failed to load promotions. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPromotionalOffers();
    }, []);

    // Update items to show based on screen size
    useEffect(() => {
        const handleResize = () => {
            setItemsToShow(window.innerWidth < 768 ? 1 : 3);
        };
        
        // Set initial value
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => {
        if (currentIndex < eventOffers.length - itemsToShow) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setCurrentIndex(0); // Loop back to first slide
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            setCurrentIndex(eventOffers.length - itemsToShow); // Loop to last slide
        }
    };

    // Auto scroll effect
    useEffect(() => {
        if (eventOffers.length <= itemsToShow) return; // No need for auto-scroll if few items
        
        const interval = setInterval(() => {
            nextSlide();
        }, 3000);
        return () => clearInterval(interval);
    }, [currentIndex, eventOffers.length, itemsToShow]);

    // Scroll to current index when it changes
    useEffect(() => {
        if (carouselRef.current) {
            const itemWidth = 250 + 16; // Card width (250px) + margin (2 * 8px)
            carouselRef.current.scrollTo({
                left: currentIndex * itemWidth,
                behavior: 'smooth'
            });
        }
    }, [currentIndex]);

    // Show loading state
    if (loading) {
        return (
            <div className="bg-secondary p-4 md:p-10">
                <h1 className="text-primary md:text-4xl text-2xl font-bold">Exciting promotions for you</h1>
                <div className="flex justify-center items-center h-40">
                    <p className="text-primary">Loading promotions...</p>
                </div>
            </div>
        );
    }

    // Show error if any
    if (error) {
        return (
            <div className="bg-secondary p-4 md:p-10">
                <h1 className="text-primary md:text-4xl text-2xl font-bold">Exciting promotions for you</h1>
                <div className="flex justify-center items-center h-40">
                    <p className="text-primary">{error}</p>
                </div>
            </div>
        );
    }

    // Show message if no promo
    if (eventOffers.length === 0) {
        return (
            <div className="bg-secondary p-4 md:p-10">
                <h1 className="text-primary md:text-4xl text-2xl font-bold">Exciting promotions for you</h1>
                <div className="flex justify-center items-center h-40">
                    <p className="text-primary">No promotions available at this time.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-secondary p-4 md:p-10 relative">
            <h1 className="text-primary md:text-4xl text-2xl font-bold">Exciting promotions for you</h1>

            <div className="relative mt-6">
                {/* Navigation buttons - only show if there are more than itemsToShow promos */}
                {eventOffers.length > itemsToShow && (
                    <>
                        <button 
                            onClick={prevSlide}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-primary text-secondary rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                            aria-label="Previous slide"
                        >
                            <FaChevronLeft />
                        </button>
                        
                        <button 
                            onClick={nextSlide}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-primary text-secondary rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                            aria-label="Next slide"
                        >
                            <FaChevronRight />
                        </button>
                    </>
                )}
                
                <div 
                    ref={carouselRef}
                    className="flex overflow-hidden mt-4 scroll-smooth"
                >
                    {eventOffers.map((item, index) => {
                        const { event, offer, eventId } = item;
                        const icon = getIconByDiscountType(offer.discountType, offer.discountValue);
                        
                        // Format title based on discount type
                        let title = "";
                        if (offer.discountType === 'percentage') {
                            title = `${offer.discountValue}% Discount`;
                        } else if (offer.discountType === 'fixed') {
                            title = `RM${offer.discountValue} Off`;
                        } else {
                            title = offer.code;
                        }
                        
                        // Format date to display promo validity
                        const validFrom = new Date(offer.validFrom).toLocaleDateString('en-US', {day: 'numeric', month: 'short'});
                        const validUntil = new Date(offer.validUntil).toLocaleDateString('en-US', {day: 'numeric', month: 'short'});
                        
                        return (
                            <Link 
                                key={index} 
                                to={`/event/${eventId}`}
                                className="md:w-[250px] w-[250px] flex-shrink-0 mx-2 transition-all duration-300"
                            >
                                <div className="bg-primary p-4 md:p-6 rounded-md shadow-md hover:shadow-lg transition-all duration-300 h-full">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-3">
                                        <div className="flex justify-center md:justify-start">
                                            {icon}
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h2 className="text-secondary md:text-2xl text-xl font-bold">{title}</h2>
                                            {/* <span className="inline-block bg-secondary text-primary text-xs px-2 py-1 rounded mt-1">{event}</span> */}
                                        </div>
                                    </div>
                                    {/* Description added manually because it's not in PromotionalOffer from API */}
                                    <p className="text-secondary md:text-sm text-xs mt-2 text-center md:text-left">
                                        {offer.discountType === 'percentage' 
                                            ? `Save ${offer.discountValue}% for event ${event}`
                                            : `Save RM${offer.discountValue} for event ${event}`
                                        }
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-secondary/30 text-center md:text-left">
                                        <p className="text-secondary text-xs font-semibold">Code: <span className="bg-secondary/20 px-2 py-1 rounded">{offer.code}</span></p>
                                        <p className="text-secondary text-xs mt-1">Valid: {validFrom} - {validUntil}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                
                {/* Indicator dots - only show if there are more than itemsToShow promos */}
                {eventOffers.length > itemsToShow && (
                    <div className="flex justify-center mt-4">
                        {Array.from({ length: eventOffers.length - itemsToShow + 1 }).map((_, index) => (
                            <button 
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 md:w-3 md:h-3 mx-1 rounded-full ${currentIndex === index ? 'bg-primary' : 'bg-gray-300'}`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
