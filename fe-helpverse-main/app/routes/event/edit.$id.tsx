import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { EventDetailsStep } from '~/components/event-form/EventDetailsStep';
import { TicketTypesStep } from '~/components/event-form/TicketTypesStep';
import { SeatArrangementStep } from '~/components/event-form/SeatArrangementStep';
import { PromotionalOffersStep } from '~/components/event-form/PromotionalOffersStep';
import { NavigationButtons } from '~/components/event-form/NavigationButtons';
import type { EventDetails, TicketType, PromotionalOffer } from '~/components/event-form/types';
import { AuthGuard } from '~/components/AuthGuard';
import { eventService } from '~/services/event';
import type { Event } from '~/services/event';
import axios from 'axios';

// Tipe data lokal untuk respons API
interface ApiTicket {
  _id: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  startDate?: string;
  endDate?: string;
  seatArrangement?: {
    rows: number;
    columns: number;
  };
  bookedSeats?: any[];
  status?: string;
}

interface ApiOffer {
  _id: string;
  name: string;
  description?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  currentUses?: number;
  validFrom: string;
  validUntil: string;
  active?: boolean;
}

export function meta() {
  return [
    { title: "Edit Event - Helpverse" },
    { name: "description", content: "Edit your event" },
  ];
}

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isFormValid, setIsFormValid] = useState<{[key: number]: boolean}>({
    1: true,
    2: true,
    3: true,
    4: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Event data states
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: '',
    tags: [],
  });
  const [tagsString, setTagsString] = useState<string>('');
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [newTicketType, setNewTicketType] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [promotionalOffers, setPromotionalOffers] = useState<PromotionalOffer[]>([]);

  // Fetch event data
  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      // Use axios for consistency with other parts of the application
      const response = await axios.get(`http://localhost:5000/api/events/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response:', response.data); // Debug: view API response
      
      // Check response success
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch event data');
      }
      
      // Use event data from response
      const event = response.data.data;
      
      // Populate event details form
      setEventDetails({
        name: event.name || '',
        description: event.description || '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        time: event.time || '',
        location: event.location || '',
        image: event.image as string || '',
        tags: Array.isArray(event.tags) ? event.tags : [],
      });
      
      // Set tags string
      if (Array.isArray(event.tags) && event.tags.length > 0) {
        setTagsString(event.tags.join(', '));
      }
      
      // Set image preview if exists
      if (typeof event.image === 'string' && event.image) {
        setImagePreview(event.image.startsWith('http') 
          ? event.image 
          : `http://localhost:5000${event.image}`);
      }
      
      // Transform tickets to ticket types
      if (Array.isArray(event.tickets)) {
        console.log('Original tickets data:', event.tickets); // Debugging original data
        const transformedTickets: TicketType[] = event.tickets.map((ticket: ApiTicket) => {
          console.log('Processing ticket:', ticket); // Debug individual ticket
          return {
            id: ticket._id || ticket.id || '',
            name: ticket.name || '',
            description: ticket.description || '',
            price: ticket.price?.toString() || '0',
            quantity: ticket.quantity || 0,
            limit: ticket.quantity?.toString() || '0',
            startDate: ticket.startDate ? new Date(ticket.startDate).toISOString().split('T')[0] : '',
            endDate: ticket.endDate ? new Date(ticket.endDate).toISOString().split('T')[0] : '',
            saleEndDate: ticket.endDate ? new Date(ticket.endDate).toISOString().split('T')[0] : '', // Add saleEndDate field
            rows: ticket.seatArrangement?.rows || 0,
            columns: ticket.seatArrangement?.columns || 0,
          };
        });
        console.log('Transformed tickets:', transformedTickets); // Debug transformed data
        setTicketTypes(transformedTickets);
      }
      
      // Set promotional offers
      if (Array.isArray(event.promotionalOffers)) {
        const transformedOffers: PromotionalOffer[] = event.promotionalOffers.map((offer: ApiOffer) => ({
          id: offer._id,
          name: offer.name || '',
          description: offer.description || '',
          code: offer.code || '',
          discountType: offer.discountType || 'percentage',
          discountValue: offer.discountValue || 0,
          maxUses: offer.maxUses || 0,
          currentUses: offer.currentUses || 0,
          active: offer.active !== undefined ? offer.active : true,
          validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
          validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : '',
        }));
        setPromotionalOffers(transformedOffers);
      }
      
    } catch (error) {
      console.error('Error fetching event data:', error);
      let errorMessage = 'Failed to fetch event data. Please try again.';
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setLoadError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Validasi form
  useEffect(() => {
    if (Object.keys(touchedFields).length > 0 || formTouched) {
      validateCurrentStep();
    }
  }, [eventDetails, ticketTypes, promotionalOffers, currentStep, touchedFields, formTouched]);

  const validateCurrentStep = () => {
    // Same validation code as in create event page
    const newErrors: {[key: string]: string} = {};
    
    // Validate Step 1: Event Details
    if (currentStep === 1) {
      if (touchedFields['name'] && !eventDetails.name) 
        newErrors.name = 'Event name is required';
      if (touchedFields['description'] && !eventDetails.description) 
        newErrors.description = 'Event description is required';
      if (touchedFields['date'] && !eventDetails.date) 
        newErrors.date = 'Event date is required';
      if (touchedFields['time'] && !eventDetails.time) 
        newErrors.time = 'Event time is required';
      if (touchedFields['location'] && !eventDetails.location) 
        newErrors.location = 'Event location is required';
    }
    
    // Validate Step 2: Ticket Types
    else if (currentStep === 2) {
      if (formTouched && ticketTypes.length === 0) {
        newErrors.ticketTypes = 'At least 1 ticket type is required';
      } else {
        ticketTypes.forEach((ticket, index) => {
          const ticketNameKey = `ticket-${index}-name`;
          const ticketPriceKey = `ticket-${index}-price`;
          const ticketLimitKey = `ticket-${index}-limit`;

          if (touchedFields[ticketNameKey] && !ticket.name) 
            newErrors[ticketNameKey] = 'Ticket name is required';
          if (touchedFields[ticketPriceKey] && (!ticket.price || parseInt(ticket.price) <= 0))
            newErrors[ticketPriceKey] = 'Ticket price must be greater than 0';
          if (touchedFields[ticketLimitKey] && (!ticket.limit || parseInt(ticket.limit) <= 0))
            newErrors[ticketLimitKey] = 'Ticket quantity must be greater than 0';
        });
      }
    }
    
    // Validate Step 3: Seat Arrangement
    else if (currentStep === 3) {
      const hasSeatArrangement = ticketTypes.some(t => (t.rows || 0) > 0 && (t.columns || 0) > 0);
      if (formTouched && !hasSeatArrangement && ticketTypes.length > 0) {
        newErrors.seatArrangement = 'At least one ticket type must have seat arrangement';
      }
    }
    
    // Validate Step 4: Promotional Offers (optional)
    else if (currentStep === 4) {
      promotionalOffers.forEach((promo, index) => {
        const nameKey = `promo-${index}-name`;
        const codeKey = `promo-${index}-code`;
        const validFromKey = `promo-${index}-validFrom`;
        const validUntilKey = `promo-${index}-validUntil`;
        const discountValueKey = `promo-${index}-discountValue`;
        const dateRangeKey = `promo-${index}-dateRange`;
        
        if (touchedFields[nameKey] && !promo.name) {
          newErrors[nameKey] = 'Promo name is required';
        }
        if (touchedFields[codeKey]) {
          if (!promo.code) {
            newErrors[codeKey] = 'Promo code is required';
          } else if (!/^[A-Z0-9_-]+$/.test(promo.code)) {
            newErrors[codeKey] = 'Promo code may only contain capital letters, numbers, underscores, and dashes';
          }
        }
        if (touchedFields[validFromKey] && !promo.validFrom) {
          newErrors[validFromKey] = 'Start date is required';
        }
        if (touchedFields[validUntilKey] && !promo.validUntil) {
          newErrors[validUntilKey] = 'End date is required';
        }
        if ((touchedFields[dateRangeKey] || (touchedFields[validFromKey] && touchedFields[validUntilKey])) && 
            promo.validFrom && promo.validUntil && new Date(promo.validFrom) > new Date(promo.validUntil)) {
          newErrors[dateRangeKey] = 'Start date must be before end date';
        }
        if (touchedFields[discountValueKey] && promo.discountValue <= 0) {
          newErrors[discountValueKey] = 'Discount value must be greater than 0';
        }
        if (touchedFields[discountValueKey] && promo.discountType === 'percentage' && promo.discountValue > 100) {
          newErrors[discountValueKey] = 'Percentage discount value cannot be greater than 100%';
        }
      });
    }
    
    setErrors(newErrors);
    
    // Update form validity
    if (formTouched) {
      setIsFormValid({
        ...isFormValid,
        [currentStep]: Object.keys(newErrors).length === 0
      });
    } else {
      const touchedFieldsWithErrors = Object.keys(newErrors).filter(key => touchedFields[key]);
      setIsFormValid({
        ...isFormValid,
        [currentStep]: touchedFieldsWithErrors.length === 0
      });
    }
  };

  // Navigation handlers
  const handleNext = () => {
    setFormTouched(true);
    validateCurrentStep();
    
    if (isFormValid[currentStep]) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/my-events');
  };

  // Form field handlers (sama seperti di create event)
  const handleEventDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({ ...prev, [name]: value }));
    
    // Track yang sudah disentuh
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  // Fungsi untuk meneruskan perubahan ke event details
  const onEventDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Khusus untuk tags, perlu handler yang berbeda
    if (e.target.name === 'tags') {
      // Handle type casting karena HTMLTextAreaElement tidak bisa dikonversi ke HTMLInputElement
      handleTagsChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    } else {
      handleEventDetailsChange(e);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsInput = e.target.value;
    setTagsString(tagsInput);
    
    // Konversi string tags menjadi array
    const tagsArray = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    setEventDetails(prev => ({ ...prev, tags: tagsArray }));
    
    // Track yang sudah disentuh
    setTouchedFields(prev => ({ ...prev, 'tags': true }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Buat URL untuk preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Track yang sudah disentuh
      setTouchedFields(prev => ({ ...prev, 'image': true }));
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setEventDetails(prev => ({ ...prev, image: '' }));
  };

  // Ticket type handlers
  const handleTicketTypeChange = (id: string, field: keyof TicketType, value: string) => {
    setTicketTypes(prevTickets =>
      prevTickets.map(ticket => 
        ticket.id === id ? { ...ticket, [field]: value } : ticket
      )
    );
    
    // Track field yang sudah disentuh
    const ticketIndex = ticketTypes.findIndex(t => t.id === id);
    setTouchedFields(prev => ({ 
      ...prev, 
      [`ticket-${ticketIndex}-${field}`]: true 
    }));
  };

  const handleAddTicketType = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTicketType.trim()) return;
    
    const newTicket: TicketType = {
      id: `temp-${Date.now()}`,
      name: newTicketType,
      description: '',
      price: '',
      limit: '',
      quantity: 0,
      startDate: '',
      endDate: '',
      rows: 0,
      columns: 0
    };
    
    setTicketTypes(prev => [...prev, newTicket]);
    setNewTicketType('');
  };

  const handleRemoveTicketType = (id: string) => {
    setTicketTypes(prev => prev.filter(ticket => ticket.id !== id));
  };

  // Promotional offer handlers
  const handleAddPromo = (promo: Omit<PromotionalOffer, 'id'>) => {
    const newPromo: PromotionalOffer = {
      ...promo,
      id: `promo-${Date.now()}`
    };
    
    setPromotionalOffers(prev => [...prev, newPromo]);
  };

  const handleRemovePromo = (id: string) => {
    setPromotionalOffers(prev => prev.filter(promo => promo.id !== id));
  };

  const handlePromoChange = (id: string, field: keyof PromotionalOffer, value: any) => {
    setPromotionalOffers(prevPromos =>
      prevPromos.map(promo => 
        promo.id === id ? { ...promo, [field]: value } : promo
      )
    );
    
    // Track fields that have been touched
    const promoIndex = promotionalOffers.findIndex(p => p.id === id);
    setTouchedFields(prev => ({ 
      ...prev, 
      [`promo-${promoIndex}-${field}`]: true 
    }));
  };

  // Submit handler for updating event
  const handleSubmitEvent = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Create FormData
      const formData = new FormData();
      
      // Add all event details fields
      Object.entries(eventDetails).forEach(([key, value]) => {
        if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      });
      
      // Add tickets
      formData.append('tickets', JSON.stringify(ticketTypes.map(ticket => {
        console.log('Processing ticket for submission:', ticket); // Debug log
        return {
          name: ticket.name,
          description: ticket.description,
          price: parseInt(ticket.price || '0'),
          quantity: parseInt(ticket.limit || '0'),
          startDate: ticket.startDate || undefined,
          endDate: ticket.endDate || ticket.saleEndDate || undefined, // Use saleEndDate as fallback
          seatArrangement: {
            rows: ticket.rows || 0,
            columns: ticket.columns || 0
          },
          ...(ticket.id && !ticket.id.startsWith('temp-') ? { _id: ticket.id } : {})
        };
      })));
      
      // Add promos if any
      if (promotionalOffers.length > 0) {
        formData.append('promotionalOffers', JSON.stringify(promotionalOffers.map(promo => ({
          name: promo.name,
          description: promo.description || '',
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          maxUses: promo.maxUses || 50,
          validFrom: promo.validFrom,
          validUntil: promo.validUntil,
          ...(promo.id && !promo.id.startsWith('promo-') ? { _id: promo.id } : {})
        }))));
      }
      
      // Add image if a new one was uploaded
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // Send update request to API
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error updating event:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Steps configuration
  const steps = [
    { 
      title: 'Event Details', 
      component: <EventDetailsStep 
        eventDetails={eventDetails}
        tagsString={tagsString}
        onEventDetailsChange={onEventDetailsChange}
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onImageRemove={handleImageRemove}
        errors={errors}
        formTouched={formTouched}
      /> 
    },
    { 
      title: 'Ticket Types', 
      component: <TicketTypesStep 
        ticketTypes={ticketTypes}
        newTicketType={newTicketType}
        onNewTicketTypeChange={setNewTicketType}
        onAddTicketType={handleAddTicketType}
        onRemoveTicketType={handleRemoveTicketType}
        onTicketTypeChange={handleTicketTypeChange}
        errors={errors}
        formTouched={formTouched}
      /> 
    },
    { 
      title: 'Seat Arrangement', 
      component: <SeatArrangementStep 
        ticketTypes={ticketTypes} 
        onSeatLayoutChange={(ticketId, rows, columns) => {
          handleTicketTypeChange(ticketId, 'rows', rows.toString());
          handleTicketTypeChange(ticketId, 'columns', columns.toString());
        }}
        errors={errors}
        formTouched={formTouched}
      /> 
    },
    { 
      title: 'Promotional Offers', 
      component: <PromotionalOffersStep 
        promotionalOffers={promotionalOffers}
        onAddPromo={handleAddPromo}
        onRemovePromo={handleRemovePromo}
        onPromoChange={handlePromoChange}
        errors={errors}
        formTouched={formTouched}
      /> 
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-secondary">
        <Navbar />
        <div className="max-w-7xl mx-auto py-3 sm:py-6 md:py-10 px-3 sm:px-6 lg:px-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading event data...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Error state
  if (loadError) {
    return (
      <main className="min-h-screen bg-secondary">
        <Navbar />
        <div className="max-w-7xl mx-auto py-3 sm:py-6 md:py-10 px-3 sm:px-6 lg:px-8 flex justify-center items-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-gray-700 mb-4">{loadError}</p>
            <button 
              onClick={() => navigate('/my-events')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Event List
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <AuthGuard allowedRoles={['eventOrganizer', 'admin']}>
      <main className="min-h-screen bg-secondary">
        <Navbar />
        <div className="max-w-7xl mx-auto py-3 sm:py-6 md:py-10 px-3 sm:px-6 lg:px-8">
          <div className="px-0 sm:px-2">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-3 sm:mb-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">Edit Event</h1>
                <p className="mt-1 text-xs sm:text-sm text-foreground-muted">
                  Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
                </p>
              </div>

              <div className="bg-secondary rounded-lg p-2 sm:p-4 md:p-6">
                {steps[currentStep - 1].component}
                
                {/* Error summary jika ada error di step saat ini */}
                {formTouched && Object.keys(errors).length > 0 && (
                  <div className="mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="text-xs sm:text-sm font-medium text-red-800">Please fix the following errors:</h3>
                    <ul className="mt-1 text-xs sm:text-sm text-red-700 list-disc list-inside">
                      {Object.values(errors)
                        .filter(error => error) // Only display errors that have values
                        .map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Submit error message */}
                {submitError && (
                  <div className="mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="text-xs sm:text-sm font-medium text-red-800">Error when updating event:</h3>
                    <p className="mt-1 text-xs sm:text-sm text-red-700">{submitError}</p>
                  </div>
                )}
                
                <NavigationButtons
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  onPrevious={handlePrevious}
                  onNext={currentStep < 4 ? handleNext : handleSubmitEvent}
                  isNextDisabled={!isFormValid[currentStep] || isSubmitting}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
        <Footer />

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Event Updated Successfully!</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Your event has been updated successfully. You will be redirected to the event list page.
                </p>
                <button
                  onClick={handleSuccessModalClose}
                  className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
} 