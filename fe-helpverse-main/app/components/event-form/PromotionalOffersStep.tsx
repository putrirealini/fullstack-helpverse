import React, { useState } from 'react';
import { FaTicketAlt, FaTrashAlt, FaPlus, FaPercentage, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';
import type { PromotionalOffer } from './types';

interface PromotionalOffersStepProps {
  promotionalOffers: PromotionalOffer[];
  onAddPromo: (promo: Omit<PromotionalOffer, 'id'>) => void;
  onRemovePromo: (id: string) => void;
  onPromoChange: (id: string, field: keyof PromotionalOffer, value: any) => void;
  errors?: {[key: string]: string};
  formTouched?: boolean;
}

export function PromotionalOffersStep({
  promotionalOffers,
  onAddPromo,
  onRemovePromo,
  onPromoChange,
  errors = {},
  formTouched = false
}: PromotionalOffersStepProps) {
  const [showAddPromoForm, setShowAddPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState<Omit<PromotionalOffer, 'id'>>({
    name: '',
    description: '',
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    maxUses: 100,
    currentUses: 0,
    validFrom: '',
    validUntil: '',
    active: true
  });

  const handleInputChange = (field: keyof Omit<PromotionalOffer, 'id'>, value: any) => {
    setNewPromo({
      ...newPromo,
      [field]: value
    });
  };

  const handleSubmitPromo = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPromo({ ...newPromo });
    setNewPromo({
      name: '',
      description: '',
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUses: 100,
      currentUses: 0,
      validFrom: '',
      validUntil: '',
      active: true
    });
    setShowAddPromoForm(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 bg-secondary w-full max-w-full overflow-hidden">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
          <FaTicketAlt className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400" />
          Promotional Offers (Optional)
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add promo codes for your event to increase sales.
        </p>
        
        {/* List of Existing Promos */}
        <div className="space-y-3 sm:space-y-4 mt-4 w-full">
          {promotionalOffers.map((promo) => (
            <div key={promo.id} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm w-full">
              <div className="flex justify-between items-start">
                <div className="w-full pr-2">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 break-words">{promo.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{promo.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePromo(promo.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200 flex-shrink-0"
                >
                  <FaTrashAlt className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-2 text-xs sm:text-sm overflow-hidden">
                  <span className="font-medium">Code: </span>
                  <span className="font-mono text-indigo-600 break-all">{promo.code}</span>
                </div>
                <div className="bg-gray-50 rounded p-2 text-xs sm:text-sm">
                  <span className="font-medium">Discount: </span>
                  <span>
                    {promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' RM'}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="text-xs text-gray-500 flex items-center">
                  <FaCalendarAlt className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">From: {new Date(promo.validFrom).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <FaCalendarAlt className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">To: {new Date(promo.validUntil).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <span>Usage limit: {promo.maxUses}</span>
              </div>
            </div>
          ))}
          
          {promotionalOffers.length === 0 && !showAddPromoForm && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
              No promotional offers yet. Add promos to increase ticket sales.
            </div>
          )}
        </div>
        
        {/* Add New Promo Button */}
        {!showAddPromoForm ? (
          <button
            type="button"
            onClick={() => setShowAddPromoForm(true)}
            className="mt-4 inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 w-full sm:w-auto justify-center"
          >
            <FaPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Add New Promo
          </button>
        ) : (
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm w-full">
            <h3 className="font-medium text-gray-900 mb-3">Add New Promo</h3>
            <form onSubmit={handleSubmitPromo} className="space-y-3">
              <div>
                <label htmlFor="promoName" className="block text-sm font-medium text-gray-700">
                  Promo Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="promoName"
                  value={newPromo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="example: Early Bird"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="promoDescription" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="promoDescription"
                  value={newPromo.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Explain promo terms and conditions"
                  rows={2}
                />
              </div>
              
              <div>
                <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700">
                  Promo Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="promoCode"
                  value={newPromo.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  placeholder="EARLYBIRD"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow focus-within:z-10">
                      <select
                        id="discountType"
                        value={newPromo.discountType}
                        onChange={(e) => handleInputChange('discountType', e.target.value)}
                        className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (RM)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {newPromo.discountType === 'percentage' ? (
                        <FaPercentage className="h-4 w-4 text-gray-400" />
                      ) : (
                        <FaMoneyBillWave className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="number"
                      id="discountValue"
                      value={newPromo.discountValue}
                      onChange={(e) => handleInputChange('discountValue', parseInt(e.target.value) || 0)}
                      className="block w-full pl-10 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                      min="0"
                      max={newPromo.discountType === 'percentage' ? 100 : undefined}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <label htmlFor="discountSymbol" className="sr-only">Symbol</label>
                      <span className="px-3 text-gray-500 sm:text-sm">
                        {newPromo.discountType === 'percentage' ? '%' : 'RM'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="validFrom"
                    value={newPromo.validFrom}
                    onChange={(e) => handleInputChange('validFrom', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="validUntil"
                    value={newPromo.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700">
                  Usage Limit <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="maxUses"
                  value={newPromo.maxUses}
                  onChange={(e) => handleInputChange('maxUses', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-center"
                >
                  Save Promo
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPromoForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 