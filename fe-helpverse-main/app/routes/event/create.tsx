import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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

export function meta() {
  return [
    { title: "Create Event - Helpverse" },
    { name: "description", content: "Create a new event" },
  ];
}

// Definisi tipe untuk respons dari API
interface EventResponse {
  id: string;
  _id: string;
  name: string;
  tickets?: {
    _id: string;
    name: string;
    [key: string]: any;
  }[];
  ticketTypes?: {
    _id: string;
    name: string;
    [key: string]: any;
  }[];
  [key: string]: any;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isFormValid, setIsFormValid] = useState<{[key: number]: boolean}>({
    1: true, // Awalnya valid sampai user mencoba next
    2: true,
    3: true,
    4: true // Promo is optional, so it's valid by default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false); // Flag untuk menandai form sudah disentuh
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({}); // Track which fields have been touched

  // Development data
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

  // Promotional Offers state
  const [promotionalOffers, setPromotionalOffers] = useState<PromotionalOffer[]>([]);

  // Modifikasi useEffect untuk validasi
  useEffect(() => {
    // Validasi hanya jika ada field yang telah disentuh
    // atau jika formTouched aktif (saat mencoba next)
    if (Object.keys(touchedFields).length > 0 || formTouched) {
      validateCurrentStep();
    }
  }, [eventDetails, ticketTypes, promotionalOffers, currentStep, touchedFields, formTouched]);

  const validateCurrentStep = () => {
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
    
    // Cek validitas dari step saat ini berdasarkan error
    // Jika form sudah disentuh menyeluruh, cek semua error
    // Jika belum, hanya cek error dari field yang telah disentuh
    if (formTouched) {
      setIsFormValid({
        ...isFormValid,
        [currentStep]: Object.keys(newErrors).length === 0
      });
    } else {
      // Cek apakah ada error pada field yang telah disentuh
      const touchedFieldsWithErrors = Object.keys(newErrors).filter(key => touchedFields[key]);
      setIsFormValid({
        ...isFormValid,
        [currentStep]: touchedFieldsWithErrors.length === 0
      });
    }
  };

  const handleNext = () => {
    // Tandai semua field pada step ini sebagai telah disentuh
    const currentStepFields = new Set<string>();
    
    if (currentStep === 1) {
      // Step 1: Event Details
      ['name', 'description', 'date', 'time', 'location', 'tags', 'image'].forEach(field => 
        currentStepFields.add(field)
      );
    } else if (currentStep === 2) {
      // Step 2: Ticket Types
      ticketTypes.forEach((_, index) => {
        currentStepFields.add(`ticket-${index}-name`);
        currentStepFields.add(`ticket-${index}-price`);
        currentStepFields.add(`ticket-${index}-limit`);
      });
      currentStepFields.add('ticketTypes');
    } else if (currentStep === 3) {
      // Step 3: Seat Arrangement
      currentStepFields.add('seatArrangement');
    } else if (currentStep === 4) {
      // Step 4: Promotional Offers
      promotionalOffers.forEach((_, index) => {
        currentStepFields.add(`promo-${index}-name`);
        currentStepFields.add(`promo-${index}-code`);
        currentStepFields.add(`promo-${index}-validFrom`);
        currentStepFields.add(`promo-${index}-validUntil`);
        currentStepFields.add(`promo-${index}-discountValue`);
      });
    }
    
    // Tandai semua field pada step ini sebagai telah disentuh
    const updatedTouchedFields = {...touchedFields};
    Array.from(currentStepFields).forEach(field => {
      updatedTouchedFields[field] = true;
    });
    setTouchedFields(updatedTouchedFields);
    setFormTouched(true);
    
    // Validasi ulang dengan semua field step ini disentuh
    validateCurrentStep();
    
    // Lanjutkan jika valid
    if (isFormValid[currentStep]) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmitEvent();
      }
    } else {
      // Tampilkan pesan error jika form tidak valid
      alert("Please complete all required fields before continuing.");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  const handleEventDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Khusus untuk tags, simpan string asli dan update array hanya untuk internal state
    if (name === 'tags') {
      setTagsString(value); // Simpan string mentah
      
      // Tetap update array tags di eventDetails untuk diproses nanti
      const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      setEventDetails(prev => ({
        ...prev,
        [name]: tagsArray
      }));
    } else {
      setEventDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Mark specific field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Mark form as touched when user changes form values
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Mark as touched when user uploads an image
      if (!formTouched) {
        setFormTouched(true);
      }
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    
    // Mark as touched when user removes an image
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handleNewTicketTypeChange = (value: string) => {
    setNewTicketType(value);
    
    // Mark as touched when user types in new ticket type
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handleAddTicketType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicketType.trim()) {
      const id = Date.now().toString();
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      setTicketTypes(prev => [
        ...prev,
        { 
          id, 
          name: newTicketType.trim(), 
          price: '100000',
          quantity: 50,
          limit: '50',
          rows: 5, 
          columns: 10,
          description: `Ticket ${newTicketType.trim()}`,
          category: 'Regular',
          maxPerOrder: '4',
          startDate: today, // Gunakan tanggal hari ini sebagai default
          saleEndDate: eventDetails.date || today, // Gunakan tanggal event atau hari ini
          status: 'active',
          bookedSeats: []
        }
      ]);
      setNewTicketType('');
      
      // Mark as touched when user adds a ticket type
      if (!formTouched) {
        setFormTouched(true);
      }
    }
  };

  const handleRemoveTicketType = (id: string) => {
    setTicketTypes(prev => prev.filter(ticketType => ticketType.id !== id));
    
    // Mark as touched when user removes a ticket type
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handleTicketTypeChange = (id: string, field: keyof TicketType, value: string) => {
    setTicketTypes(prev => prev.map(ticketType => 
      ticketType.id === id ? { ...ticketType, [field]: value } : ticketType
    ));
    
    // Find the index of the ticket being modified
    const index = ticketTypes.findIndex(ticket => ticket.id === id);
    // Mark specific field as touched
    setTouchedFields(prev => ({
      ...prev,
      [`ticket-${index}-${field}`]: true
    }));
    
    // Mark as touched when user changes ticket type details
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  // Promo handling functions
  const handleAddPromo = (promo: Omit<PromotionalOffer, 'id'>) => {
    const id = Date.now().toString();
    const newPromo: PromotionalOffer = {
      ...promo,
      id,
      currentUses: 0, // Pastikan selalu 0 untuk promo baru
      active: true // Pastikan selalu true untuk promo baru
    };
    
    setPromotionalOffers(prev => [...prev, newPromo]);
    
    // Mark as touched when user adds a promo
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handleRemovePromo = (id: string) => {
    setPromotionalOffers(prev => prev.filter(promo => promo.id !== id));
    
    // Mark as touched when user removes a promo
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handlePromoChange = (id: string, field: keyof PromotionalOffer, value: any) => {
    setPromotionalOffers(prev => 
      prev.map(promo => 
        promo.id === id ? { ...promo, [field]: value } : promo
      )
    );
    
    // Find the index of the promo being modified
    const index = promotionalOffers.findIndex(promo => promo.id === id);
    // Mark specific field as touched
    setTouchedFields(prev => ({
      ...prev,
      [`promo-${index}-${field}`]: true
    }));
    
    // Mark as touched when user changes promo details
    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handleSubmitEvent = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Format tiket sesuai format yang diharapkan
      const formattedTickets = ticketTypes.map(ticket => ({
        name: ticket.name,
        description: ticket.description || `Ticket ${ticket.name}`,
        price: parseInt(ticket.price),
        quantity: ticket.limit ? parseInt(ticket.limit) : ticket.quantity,
        startDate: new Date(ticket.startDate || eventDetails.date).toISOString(),
        endDate: new Date(ticket.saleEndDate || eventDetails.date).toISOString(),
        seatArrangement: {
          rows: ticket.rows ? parseInt(String(ticket.rows)) : 0,
          columns: ticket.columns ? parseInt(String(ticket.columns)) : 0
        }
      }));

      // Hitung total kapasitas dari semua tiket
      const totalCapacity = formattedTickets.reduce((total, ticket) => {
        return total + (typeof ticket.quantity === 'number' ? ticket.quantity : parseInt(String(ticket.quantity)));
      }, 0);
      
      // Format promo sesuai yang diharapkan
      const formattedPromos = promotionalOffers.map(promo => ({
        name: promo.name,
        description: promo.description || `Promo ${promo.code}`,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: parseInt(String(promo.discountValue)),
        maxUses: parseInt(String(promo.maxUses)),
        currentUses: parseInt(String(promo.currentUses)) || 0,
        validFrom: new Date(promo.validFrom).toISOString(),
        validUntil: new Date(promo.validUntil).toISOString(),
        active: true
      }));

      // Format tags
      const formattedTags = Array.isArray(eventDetails.tags) 
        ? eventDetails.tags 
        : (tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : []);

      // Buat data event sesuai format yang diharapkan server
      const eventData = {
        name: eventDetails.name,
        description: eventDetails.description,
        date: new Date(eventDetails.date).toISOString(),
        time: eventDetails.time,
        location: eventDetails.location,
        image: imageFile, // File object langsung
        totalSeats: totalCapacity,
        availableSeats: totalCapacity,
        published: true,
        approvalStatus: "pending",
        tags: formattedTags,
        tickets: formattedTickets,
        promotionalOffers: formattedPromos.length > 0 ? formattedPromos : []
      };

      console.log('Data to be sent to server:', eventData);
      
      // Gunakan createEvent yang sudah ada
      const response = await eventService.createEvent(eventData as any) as unknown as EventResponse;
      
      console.log('Response from server:', response);
      
      // Tampilkan modal sukses
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating event:', error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('An error occurred while creating the event');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { 
      title: 'Event Details', 
      component: <EventDetailsStep 
        eventDetails={eventDetails}
        tagsString={tagsString}
        onEventDetailsChange={handleEventDetailsChange}
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
        onNewTicketTypeChange={handleNewTicketTypeChange}
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
          setTicketTypes(prev => prev.map(ticket => 
            ticket.id === ticketId ? { ...ticket, rows, columns } : ticket
          ));
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

  return (
    <AuthGuard allowedRoles={['eventOrganizer']}>
      <main className="min-h-screen bg-secondary">
        <Navbar />
        <div className="max-w-7xl mx-auto py-3 sm:py-6 md:py-10 px-3 sm:px-6 lg:px-8">
          <div className="px-0 sm:px-2">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-3 sm:mb-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">Create New Event</h1>
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
                        .filter(error => error) // Only show errors that have values
                        .map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Submit error message */}
                {submitError && (
                  <div className="mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="text-xs sm:text-sm font-medium text-red-800">Error when creating event:</h3>
                    <p className="mt-1 text-xs sm:text-sm text-red-700">{submitError}</p>
                  </div>
                )}
                
                <NavigationButtons
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
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
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Event Created Successfully!</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Your event has been created successfully. You will be redirected to the home page.
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