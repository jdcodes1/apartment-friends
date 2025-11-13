import React, { useState } from 'react';
import { Phone, ArrowRight, Check } from 'lucide-react';
import api from '../../utils/api';

interface PhoneAuthProps {
  onSuccess: (token: string, user: any) => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'code' | 'register'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const getE164Format = (formatted: string) => {
    // Convert to E.164 format: +1XXXXXXXXXX
    const digits = formatted.replace(/\D/g, '');
    return '+1' + digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const e164Phone = getE164Format(phoneNumber);

      // Validate phone number
      if (e164Phone.length !== 12) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      // Send verification code
      await api.post('/auth/send-code', {
        phoneNumber: e164Phone
      });

      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newCode = [...code];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newCode[index + i] = digits[i];
      }
      setCode(newCode);

      // Focus on the next empty input or the last one
      const nextIndex = Math.min(index + digits.length, 5);
      document.getElementById(`code-${nextIndex}`)?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`)?.focus();
      }
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const e164Phone = getE164Format(phoneNumber);
      const codeString = code.join('');

      if (codeString.length !== 6) {
        throw new Error('Please enter the complete 6-digit code');
      }

      // Verify the code
      const response = await api.post('/auth/verify-code', {
        phoneNumber: e164Phone,
        code: codeString,
        ...(isNewUser && { firstName, lastName })
      });

      if (response.data.isNewUser && !firstName && !lastName) {
        // Need to collect name for new user
        setIsNewUser(true);
        setStep('register');
      } else {
        // Success - login/registration complete
        onSuccess(response.data.token, response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('Please enter your first and last name');
      }

      const e164Phone = getE164Format(phoneNumber);
      const codeString = code.join('');

      // Verify the code with user info
      const response = await api.post('/auth/verify-code', {
        phoneNumber: e164Phone,
        code: codeString,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      onSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setCode(['', '', '', '', '', '']);
    await handleSendCode(new Event('submit') as any);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'phone' && 'Sign in with Phone'}
            {step === 'code' && 'Enter Verification Code'}
            {step === 'register' && 'Complete Your Profile'}
          </h2>
          <p className="text-gray-600 mt-2">
            {step === 'phone' && 'Enter your phone number to get started'}
            {step === 'code' && `We sent a code to ${phoneNumber}`}
            {step === 'register' && 'Just a few more details to get started'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendCode}>
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">+1</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={14}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                We'll send you a 6-digit verification code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? 'Sending...' : 'Send Code'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter 6-Digit Code
              </label>
              <div className="flex gap-2 justify-center">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.some(d => !d)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
              {!loading && <Check className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full mt-3 text-gray-600 hover:text-gray-800 py-2"
            >
              Change phone number
            </button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !firstName.trim() || !lastName.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <Check className="w-5 h-5" />}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 mt-6">
        By continuing, you agree to receive SMS messages from Apartment Friends.
        Standard message and data rates may apply.
      </p>
    </div>
  );
};

export default PhoneAuth;
