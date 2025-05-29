import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface WaitlistTicketModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
}

interface WaitlistTicket {
  name: string;
  description: string;
  price: number;
  quantity: number;
  originalTicketRef: string;
}

export const WaitlistTicketModal: React.FC<WaitlistTicketModalProps> = ({ isOpen, eventId, onClose }) => {
  const [waitlistTickets, setWaitlistTickets] = useState<WaitlistTicket[]>([
    {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      originalTicketRef: ''
    }
  ]);
  const [availableTicketTypes, setAvailableTicketTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Fungsi untuk fetch jenis tiket yang tersedia di event
  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventTickets();
    }
  }, [isOpen, eventId]);

  const fetchEventTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User tidak terautentikasi');
      }
      
      const response = await axios.get(`http://localhost:5000/api/events/${eventId}/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Ambil hanya nama/tipe tiket untuk dijadikan reference
        const ticketTypes = response.data.data.map((ticket: any) => ticket.name);
        setAvailableTicketTypes(ticketTypes);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data tiket');
      }
    } catch (err) {
      console.error('Error fetching ticket data:', err);
      setError(err instanceof Error ? err.message : 'Gagal mengambil data tiket');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menambah tiket waitlist
  const addTicketField = () => {
    setWaitlistTickets([
      ...waitlistTickets,
      {
        name: '',
        description: '',
        price: 0,
        quantity: 0,
        originalTicketRef: ''
      }
    ]);
  };

  // Fungsi untuk menghapus tiket waitlist
  const removeTicketField = (index: number) => {
    const updatedTickets = [...waitlistTickets];
    updatedTickets.splice(index, 1);
    setWaitlistTickets(updatedTickets);
  };

  // Handle perubahan input untuk tiket waitlist
  const handleTicketChange = (index: number, field: keyof WaitlistTicket, value: string | number) => {
    const updatedTickets = [...waitlistTickets];
    updatedTickets[index] = { ...updatedTickets[index], [field]: value };
    setWaitlistTickets(updatedTickets);
  };

  // Handle submit form untuk membuat tiket waitlist
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi form
    const hasEmptyFields = waitlistTickets.some(ticket => 
      !ticket.name || !ticket.originalTicketRef || ticket.quantity <= 0
    );
    
    if (hasEmptyFields) {
      setError('Semua field wajib diisi dan jumlah tiket harus lebih dari 0');
      return;
    }
    
    setError(null);
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User tidak terautentikasi');
      }
      
      const payload = {
        waitlistTickets: waitlistTickets
      };
      
      const response = await axios.post(
        `http://localhost:5000/api/events/${eventId}/waitlist-tickets`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to add waitlist ticket');
      }
    } catch (err) {
      console.error('Error creating waitlist tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to add waitlist ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2 py-4 md:p-0">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-3 py-3 md:px-6 md:py-4 border-b border-gray-200 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold">Add Waitlist Ticket</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-3 py-4 md:px-6 md:py-6">
          <p className="text-sm md:text-base text-gray-700 mb-4">
            Add waitlist tickets for this event. Waitlist tickets can be created when all main tickets are sold out.
          </p>
          
          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-4">
              <p className="text-xs md:text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
              <p className="text-xs md:text-sm text-green-800">
                Waitlist ticket successfully added!
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {waitlistTickets.map((ticket, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-3 md:p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base md:text-lg font-medium">Waitlist Ticket #{index + 1}</h3>
                  {waitlistTickets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="mb-2 md:mb-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Waitlist Ticket Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ticket.name}
                      onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                      placeholder="Example: VIP Waitlist"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="mb-2 md:mb-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Original Ticket Reference <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={ticket.originalTicketRef}
                      onChange={(e) => handleTicketChange(index, 'originalTicketRef', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Original Ticket</option>
                      {availableTicketTypes.map((type, i) => (
                        <option key={i} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-2 md:mb-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Ticket Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={ticket.description}
                      onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                      placeholder="Waitlist ticket description"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="mb-2 md:mb-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Ticket Price (RM)
                    </label>
                    <input
                      type="number"
                      value={ticket.price}
                      onChange={(e) => handleTicketChange(index, 'price', Number(e.target.value))}
                      placeholder="Ticket price"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use original ticket price
                    </p>
                  </div>
                  
                  <div className="mb-2 md:mb-3">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Ticket Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={ticket.quantity}
                      onChange={(e) => handleTicketChange(index, 'quantity', Number(e.target.value))}
                      placeholder="Waitlist ticket quantity"
                      className="w-full p-2 text-sm border border-gray-300 rounded-md"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mb-4 md:mb-6">
              <button
                type="button"
                onClick={addTicketField}
                className="flex items-center justify-center text-sm text-primary border border-primary px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-primary hover:text-white transition-colors w-full md:w-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Waitlist Ticket
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row md:justify-end space-y-2 md:space-y-0 md:space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm w-full md:w-auto"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 text-sm w-full md:w-auto"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Add Waitlist Ticket'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 