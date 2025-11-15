/**
 * Validation utilities for input data
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (E.164 format: +1234567890)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate US ZIP code
 */
export function isValidZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Validate US state code (2 letters)
 */
export function isValidStateCode(state: string): boolean {
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
  ];
  return validStates.includes(state.toUpperCase());
}

/**
 * Validate price (must be positive number)
 */
export function isValidPrice(price: number): boolean {
  return !isNaN(price) && price > 0 && price < 1000000;
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date is in the future or today
 */
export function isValidFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Validate required fields are present
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validate listing data
 */
export function validateListingData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  const { valid, missing } = validateRequiredFields(data, [
    'title',
    'description',
    'price',
    'address',
    'city',
    'state',
    'zipCode',
    'availableDate'
  ]);

  if (!valid) {
    errors.push(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate price
  if (data.price && !isValidPrice(Number(data.price))) {
    errors.push('Price must be a positive number less than $1,000,000');
  }

  // Validate state
  if (data.state && !isValidStateCode(data.state)) {
    errors.push('Invalid state code');
  }

  // Validate ZIP code
  if (data.zipCode && !isValidZipCode(data.zipCode)) {
    errors.push('Invalid ZIP code format');
  }

  // Validate available date
  if (data.availableDate && !isValidFutureDate(data.availableDate)) {
    errors.push('Available date must be today or in the future');
  }

  // Validate images array
  if (data.images && !Array.isArray(data.images)) {
    errors.push('Images must be an array');
  }

  if (data.images && data.images.length > 10) {
    errors.push('Maximum 10 images allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate user profile data
 */
export function validateProfileData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone number format (use E.164 format: +1234567890)');
  }

  if (data.firstName && (data.firstName.length < 1 || data.firstName.length > 50)) {
    errors.push('First name must be between 1 and 50 characters');
  }

  if (data.lastName && (data.lastName.length < 1 || data.lastName.length > 50)) {
    errors.push('Last name must be between 1 and 50 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
