import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useRegisterEventOrganizer } from '../../hooks/useAuth';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

// Interface untuk modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  status: 'success' | 'error';
}

// Komponen Modal
function Modal({ isOpen, onClose, title, message, status }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative z-10">
        <div className="text-center">
          {status === 'success' ? (
            <FaCheckCircle className="mx-auto text-green-500 text-5xl mb-4" />
          ) : (
            <FaTimesCircle className="mx-auto text-red-500 text-5xl mb-4" />
          )}
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="mb-6 text-gray-600">{message}</p>
          <button
            onClick={onClose}
            className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary/90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: "Register Event Organizer - Helpverse" },
    { name: "description", content: "Create a new event organizer account" },
  ];
}

export default function RegisterEventOrganizer() {
  const navigate = useNavigate();
  const { register, loading, error, newEventOrganizer } = useRegisterEventOrganizer();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    organizerName: '',
    password: '',
    agreeTerms: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // State untuk modal
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    status: 'success' as 'success' | 'error'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username must be filled';
    }
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name must be filled';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email must be filled';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number must be filled';
    }
    
    if (!formData.organizerName.trim()) {
      errors.organizerName = 'Organization name must be filled';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password must be filled';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('Form validation failed:', formErrors);
      return;
    }
    
    try {
      console.log('Form data being submitted:', formData);
      const dataToSubmit = {
        ...formData,
        role: 'eventOrganizer' as const
      };
      console.log('Data that will be sent to the API:', dataToSubmit);
      
      const result = await register(dataToSubmit);
      console.log('Registration result:', result);
      
      // Show success modal
      setModalData({
        title: 'Registration Successful',
        message: 'Event organizer account has been successfully created. You will be redirected to the home page.',
        status: 'success'
      });
      setShowModal(true);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Get specific error message if available
      let errorMessage = 'An error occurred while registering the account. Please try again.';
      if (error) {
        errorMessage = error;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Show error modal
      setModalData({
        title: 'Registration Failed',
        message: errorMessage,
        status: 'error'
      });
      setShowModal(true);
    }
  };
  
  // Handler for closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
    
    // If registration is successful, redirect to home page
    if (modalData.status === 'success') {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-secondary">
      <div className="w-full max-w-md p-6 space-y-4 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <img src="/logo-blue.png" alt="HELPVerse Logo" className="mx-auto h-16 w-16" />
          <h1 className="text-2xl font-bold text-primary mt-2">Register Event Organizer</h1>
          <p className="mt-1 text-sm text-gray-600">Create an account to manage your events</p>
        </div>
        
        {error && !showModal && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`mt-1 block w-full px-3 py-2 border ${formErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
              {formErrors.username && (
                <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className={`mt-1 block w-full px-3 py-2 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />
              {formErrors.fullName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-1 block w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className={`mt-1 block w-full px-3 py-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
              />
              {formErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="organizerName" className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                id="organizerName"
                name="organizerName"
                type="text"
                required
                className={`mt-1 block w-full px-3 py-2 border ${formErrors.organizerName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                placeholder="Enter your organization name"
                value={formData.organizerName}
                onChange={handleChange}
              />
              {formErrors.organizerName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.organizerName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={`mt-1 block w-full px-3 py-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded ${formErrors.agreeTerms ? 'border-red-500' : ''}`}
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeTerms" className="font-medium text-gray-700">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a>
                </label>
                {formErrors.agreeTerms && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.agreeTerms}</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
                Login here
              </Link>
            </p>
          </div>
          
          <div className="text-sm text-center mt-4 border-t pt-4">
            <p className="text-gray-600">
              Want to register as a regular user?{' '}
              <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
      
      {/* Modal for notifications */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalData.title}
        message={modalData.message}
        status={modalData.status}
      />
    </div>
  );
}