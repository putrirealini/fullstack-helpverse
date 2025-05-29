import React from 'react';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import { FormInput } from './FormInput';
import type { EventDetails } from './types';

interface EventDetailsStepProps {
  eventDetails: EventDetails;
  tagsString: string;
  onEventDetailsChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  errors?: { [key: string]: string };
  formTouched?: boolean;
}

export function EventDetailsStep({
  eventDetails,
  tagsString,
  onEventDetailsChange,
  imagePreview,
  onImageChange,
  onImageRemove,
  errors = {},
  formTouched = false
}: EventDetailsStepProps) {
  return (
    <div className="space-y-4 sm:space-y-6 bg-secondary">
      <FormInput
        label="Event Name"
        name="name"
        value={eventDetails.name}
        onChange={onEventDetailsChange}
        required
        placeholder="Enter event name"
        error={errors.name}
        information='( Enter an event name with at least 2 characters )'
        formTouched={formTouched}
      />

      <FormInput
        label="Event Description"
        name="description"
        value={eventDetails.description}
        onChange={onEventDetailsChange}
        required
        textarea
        placeholder="Include key details such as purpose, activities, and target audience"
        error={errors.description}
        information='( Include key details such as purpose, activities, and target audience )'
        formTouched={formTouched}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <FormInput
          label="Event Date"
          name="date"
          type="date"
          value={eventDetails.date}
          onChange={onEventDetailsChange}
          required
          icon={<FaCalendarAlt className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
          error={errors.date}
          formTouched={formTouched}
        />
        <FormInput
          label="Event Time"
          name="time"
          type="time"
          value={eventDetails.time}
          onChange={onEventDetailsChange}
          required
          icon={<FaClock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
          error={errors.time}
          formTouched={formTouched}
        />
      </div>

      <FormInput
        label="Location"
        name="location"
        value={eventDetails.location}
        onChange={onEventDetailsChange}
        required
        placeholder="Enter event location"
        error={errors.location}
        formTouched={formTouched}
      />

      <FormInput
        label="Tags"
        name="tags"
        value={tagsString}
        onChange={onEventDetailsChange}
        placeholder="Enter tags separated by commas (e.g. technology, conference, jakarta)"
        error={errors.tags}
        information='( Add relevant tags to help people find your event )'
        formTouched={formTouched}
      />

      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Event Poster</h2>
        <div className="mt-1 sm:mt-2">
          {imagePreview ? (
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative w-full md:w-[250px] h-[200px] md:h-[250px] overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Event poster preview"
                  className="w-full h-full object-cover rounded-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={onImageRemove}
                  className="absolute -top-2 -right-2 p-1 sm:p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-md"
                >
                  <svg className="h-2 w-2 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-foreground-muted text-gray-600">Upload an event poster in JPG, PNG, or PDF format (Max size: 5MB)
                Make sure your poster is clear, high-quality, and visually appealing</p>
            </div>
          ) : (
            <div>
              <div className="w-full flex justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 flex items-center justify-center w-full sm:w-auto"
                >
                  <span>Upload poster</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onImageChange} accept="image/*" />
                </label>
              </div>
              {errors.image && (
                <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.image}</p>
              )}
              <p className="mt-2 text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 