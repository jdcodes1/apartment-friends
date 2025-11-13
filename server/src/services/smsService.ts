import twilio from 'twilio';

export class SMSService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber) {
      console.warn('Twilio credentials not configured. SMS will be logged to console only.');
      // In development, we'll just log instead of sending real SMS
      this.client = null as any;
    } else {
      this.client = twilio(accountSid, authToken);
    }
  }

  /**
   * Send a verification code via SMS
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const message = `Your Apartment Friends verification code is: ${code}. This code expires in 10 minutes.`;

      // If in development mode without Twilio credentials, just log
      if (!this.client) {
        console.log('=================================');
        console.log('📱 SMS VERIFICATION CODE (DEV MODE)');
        console.log('=================================');
        console.log(`To: ${phoneNumber}`);
        console.log(`Code: ${code}`);
        console.log('=================================');
        return true;
      }

      // Send actual SMS in production
      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log(`SMS sent successfully to ${phoneNumber}`);
      return true;
    } catch (error: any) {
      console.error('Error sending SMS:', error);

      // In development, still return true even if SMS fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Treating SMS send as successful despite error');
        return true;
      }

      return false;
    }
  }

  /**
   * Validate phone number format (E.164 format expected)
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    // Example: +1234567890
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 format
   * Assumes US numbers if no country code is provided
   */
  formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
    // Remove all non-digit characters
    let digits = phoneNumber.replace(/\D/g, '');

    // If it already starts with country code, use as-is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber.replace(/\D/g, (match, offset) => offset === 0 ? '+' : '');
    }

    // If it starts with country code without +, add it
    if (countryCode === '+1' && digits.length === 11 && digits.startsWith('1')) {
      return '+' + digits;
    }

    // Otherwise, prepend country code
    return countryCode + digits;
  }
}
