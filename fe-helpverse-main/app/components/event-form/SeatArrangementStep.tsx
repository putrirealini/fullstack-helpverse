import React from 'react';
import type { TicketType } from './types';
import { FaChair, FaTicketAlt } from 'react-icons/fa';

interface SeatArrangementStepProps {
  ticketTypes: TicketType[];
  onSeatLayoutChange: (ticketId: string, rows: number, columns: number) => void;
  errors?: {[key: string]: string};
  formTouched?: boolean;
}

export function SeatArrangementStep({ 
  ticketTypes, 
  onSeatLayoutChange,
  errors = {},
  formTouched = false
}: SeatArrangementStepProps) {
  
  // Function to handle row number changes
  const handleRowsChange = (ticketId: string, value: string) => {
    const rows = parseInt(value) || 0;
    const ticket = ticketTypes.find(t => t.id === ticketId);
    const columns = ticket?.columns || 0;
    onSeatLayoutChange(ticketId, rows, columns);
  };
  
  // Function to handle column number changes
  const handleColumnsChange = (ticketId: string, value: string) => {
    const columns = parseInt(value) || 0;
    const ticket = ticketTypes.find(t => t.id === ticketId);
    const rows = ticket?.rows || 0;
    onSeatLayoutChange(ticketId, rows, columns);
  };

  return (
    <div className="space-y-4 sm:space-y-6 bg-secondary">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
          <FaChair className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400" />
          Seat Arrangement
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Define the number of rows and columns for each ticket type.
        </p>
        
        {/* Error message for seat arrangement */}
        {formTouched && errors.seatArrangement && (
          <div className="mt-2 p-2 sm:p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-xs sm:text-sm text-red-700">{errors.seatArrangement}</p>
          </div>
        )}
        
        <div className="mt-4 space-y-4">
          {ticketTypes.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 flex items-center">
                <FaTicketAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
                {ticket.name}
              </h3>
              
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`rows-${ticket.id}`} className="block text-xs sm:text-sm font-medium text-gray-700">
                    Number of Rows
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      id={`rows-${ticket.id}`}
                      value={ticket.rows || 0}
                      onChange={(e) => handleRowsChange(ticket.id, e.target.value)}
                      min="0"
                      className="block w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`columns-${ticket.id}`} className="block text-xs sm:text-sm font-medium text-gray-700">
                    Number of Columns
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      id={`columns-${ticket.id}`}
                      value={ticket.columns || 0}
                      onChange={(e) => handleColumnsChange(ticket.id, e.target.value)}
                      min="0"
                      className="block w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
              </div>
              
              {/* Seat Preview */}
              {(ticket.rows && ticket.rows > 0 && ticket.columns && ticket.columns > 0) ? (
                <div className="mt-3">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Preview Seat Arrangement</h4>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-md overflow-x-auto">
                    <div className="flex flex-col items-center min-w-max">
                      {/* Screen */}
                      <div className="w-full max-w-md mb-3 bg-gray-300 rounded-lg p-1 text-center text-xs text-gray-600">
                        SCREEN
                      </div>
                      
                      {/* Seats */}
                      <div className="w-auto">
                        {Array.from({ length: Math.min(parseInt(ticket.rows?.toString() || '0'), 15) }).map((_, rowIndex) => (
                          <div key={`row-${rowIndex}`} className="flex justify-center mb-1">
                            {Array.from({ length: Math.min(parseInt(ticket.columns?.toString() || '0'), 20) }).map((_, colIndex) => (
                              <div 
                                key={`seat-${rowIndex}-${colIndex}`} 
                                className="w-4 h-4 sm:w-5 sm:h-5 m-0.5 rounded-sm bg-indigo-600"
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                      
                      {((ticket.rows || 0) > 15 || (ticket.columns || 0) > 20) && (
                        <div className="mt-2 text-xs text-center text-gray-500 italic">
                          Preview shows maximum 15 rows x 20 columns out of total {ticket.rows} rows x {ticket.columns} columns
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-500 italic">
                  Specify the number of rows and columns to see the seat arrangement preview.
                </div>
              )}
              
              <div className="mt-3 bg-yellow-50 rounded-md p-2 sm:p-3 text-xs sm:text-sm text-yellow-800">
                <strong>Note:</strong> The actual number of seats ({((ticket.rows || 0) * (ticket.columns || 0)).toLocaleString()}) 
                may differ from the number of available tickets ({parseInt(ticket.limit || '0').toLocaleString()}) due to capacity constraints.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}