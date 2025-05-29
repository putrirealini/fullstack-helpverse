import React from 'react';

interface ManageWaitlistModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
}

export const ManageWaitlistModal: React.FC<ManageWaitlistModalProps> = ({ isOpen, eventId, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Kelola Daftar Tunggu</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Kelola daftar tunggu untuk event ini. Anda dapat melihat siapa saja yang masuk dalam daftar tunggu dan melakukan tindakan yang diperlukan.
          </p>
          
          <div className="bg-purple-50 p-4 rounded-md border border-purple-200 mb-4">
            <p className="text-sm text-purple-800">
              Fitur ini masih dalam pengembangan. Segera hadir di HELPVerse!
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-600 text-sm font-medium mb-2">
              Daftar Tunggu (Demo):
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Pengguna 1 - user1@example.com</li>
              <li>Pengguna 2 - user2@example.com</li>
              <li>Pengguna 3 - user3@example.com</li>
            </ul>
          </div>
          
          <p className="text-gray-600 text-sm mt-4">
            Event ID: {eventId}
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 mr-2"
          >
            Tutup
          </button>
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
            onClick={() => {
              alert('Fitur masih dalam pengembangan');
              onClose();
            }}
          >
            Kelola Waitlist
          </button>
        </div>
      </div>
    </div>
  );
}; 