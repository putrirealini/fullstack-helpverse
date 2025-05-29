import React from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  minLength?: number;
  icon?: React.ReactNode;
  className?: string;
  textarea?: boolean;
  rows?: number;
  error?: string;
  information?: string;
  formTouched?: boolean;
}

export function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder,
  min,
  max,
  minLength,
  icon,
  className = '',
  textarea = false,
  rows = 4,
  information,
  error,
  formTouched = true
}: FormInputProps) {
  const hasError = !!error && formTouched;
  const inputBaseClass = `mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 rounded-md ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'} shadow-sm text-sm transition duration-150 ease-in-out`;

  return (
    <div className={className}>
      <label htmlFor={name} className="flex flex-row items-center gap-2 mb-1 text-xs sm:text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
        {information && (
        <p className="text-xs text-foreground- text-gray-400" id={`${name}-information`}>
          {information}
        </p>
      )}
      </label>
      {icon ? (
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
          {textarea ? (
            <textarea
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              required={required}
              rows={rows}
              className={`${inputBaseClass} pl-9 sm:pl-10`}
              placeholder={placeholder}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${name}-error` : undefined}
            />
          ) : (
            <input
              type={type}
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              required={required}
              min={min}
              max={max}
              minLength={minLength}
              className={`${inputBaseClass} pl-9 sm:pl-10`}
              placeholder={placeholder}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${name}-error` : undefined}
            />
          )}
        </div>
      ) : (
        textarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            rows={rows}
            className={inputBaseClass}
            placeholder={placeholder}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : undefined}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            min={min}
            max={max}
            minLength={minLength}
            className={inputBaseClass}
            placeholder={placeholder}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : undefined}
          />
        )
      )}
      {hasError && (
        <p className="mt-1 text-xs sm:text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
} 