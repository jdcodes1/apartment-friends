# Phone Authentication & Zillow Import - Setup Guide

This guide covers the new phone authentication (magic codes via SMS) and Zillow listing import features.

## Table of Contents
- [Phone Authentication Setup](#phone-authentication-setup)
- [Database Migrations](#database-migrations)
- [Environment Variables](#environment-variables)
- [Zillow Import Feature](#zillow-import-feature)
- [Testing](#testing)

---

## Phone Authentication Setup

The app now uses **phone number authentication with SMS magic codes** instead of email/password.

### How It Works

1. **User Flow**:
   - User enters phone number (US format)
   - System sends a 6-digit verification code via SMS
   - User enters code to login/register
   - For new users, first and last name are collected

2. **Security Features**:
   - Rate limiting: 3 code send attempts per hour
   - Code expiry: 10 minutes
   - Maximum 5 verification attempts per code
   - Automatic cleanup of expired codes
   - User blocking after too many failed attempts (1 hour)

### Prerequisites

To enable SMS functionality, you need a **Twilio account**:

1. **Sign up for Twilio** (free trial available):
   - Go to https://www.twilio.com/try-twilio
   - Sign up and verify your email/phone
   - Get $15 free credit (good for ~300 SMS in US)

2. **Get Twilio Credentials**:
   - From Twilio Console Dashboard:
     - **Account SID**: Found on main dashboard
     - **Auth Token**: Click "View" to reveal
   - Buy a phone number:
     - Go to Phone Numbers → Buy a Number
     - Search for a US number with SMS capability
     - Purchase it (costs ~$1/month)

3. **Configure Environment Variables** (see below)

---

## Database Migrations

You need to run two new migrations to add phone auth and Zillow import support.

### Migration 1: Phone Authentication

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy the contents of `server/database/migration_phone_auth.sql`
4. Paste and click **"Run"**

This migration adds:
- `verification_codes` table (stores SMS codes)
- `auth_rate_limits` table (prevents abuse)
- `phone_verified` column on profiles
- Rate limiting functions
- Expired code cleanup function

### Migration 2: Zillow URL Field

1. In **Supabase SQL Editor**, create another new query
2. Copy the contents of `server/database/migration_add_zillow_url.sql`
3. Paste and click **"Run"**

This migration adds:
- `zillow_url` column to listings table
- Index for Zillow URL lookups

### Verify Migrations

After running both migrations, verify in **Table Editor**:

- Check `profiles` table has `phone_verified` column
- Check `verification_codes` and `auth_rate_limits` tables exist
- Check `listings` table has `zillow_url` column

---

## Environment Variables

### Server Environment Variables (`server/.env`)

Update your `server/.env` file with these new variables:

```env
# Existing variables...
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173

# === NEW: Twilio Configuration (for SMS) ===
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# === Optional: Facebook (existing) ===
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# === Development Mode ===
NODE_ENV=development  # Set to 'production' in production
```

### Important Notes:

1. **Development Mode**:
   - If Twilio credentials are missing, SMS codes will be **logged to console**
   - This allows testing without Twilio account
   - Perfect for local development

2. **Twilio Phone Number Format**:
   - Must be in E.164 format: `+15551234567`
   - Include country code (+1 for US)
   - No spaces or special characters

3. **Security**:
   - **NEVER** commit `.env` files to git
   - Keep `TWILIO_AUTH_TOKEN` secret
   - Use environment variables in production (Heroku, Vercel, etc.)

### Client Environment Variables (`client/.env`)

No changes needed! The client only needs:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Zillow Import Feature

Users can now import listing details from Zillow URLs to auto-fill the listing form.

### How It Works

1. **User Experience**:
   - On "Create Listing" page, user sees "Import from Zillow" section
   - Paste any Zillow listing URL (e.g., `https://www.zillow.com/homedetails/...`)
   - Click "Import" button
   - Form fields auto-populate with extracted data
   - User can review and edit before submitting

2. **What Gets Imported**:
   - Title
   - Description
   - Price
   - Address, City, State, Zip
   - Bedrooms, Bathrooms, Square Feet
   - Property Type (Studio, 1BR, 2BR, etc.)
   - Amenities
   - Images (URLs)

3. **Limitations**:
   - Web scraping may break if Zillow changes their HTML
   - Not all fields may import successfully
   - Images are URLs (not uploaded to your server)
   - Violates Zillow TOS for commercial use

### Legal Considerations

⚠️ **Important**: The Zillow parser uses web scraping, which may violate Zillow's Terms of Service.

**For Production Use**:
- Consider using Zillow's official **Bridge API** (requires partnership)
- Get explicit permission from Zillow
- Use a third-party real estate data API (Zillow, Realtor, etc.)
- Current implementation is for **personal/educational use only**

### Supported Zillow URLs

- ✅ `https://www.zillow.com/homedetails/...`
- ✅ `https://www.zillow.com/b/...`
- ❌ Search results pages (not supported)
- ❌ Rental pages (partial support)

---

## Testing

### Testing Phone Authentication

#### Option 1: With Twilio (Real SMS)

1. Set up Twilio credentials in `.env`
2. Start server: `npm run dev` in `server/`
3. Start client: `npm run dev` in `client/`
4. Navigate to `http://localhost:5173/login`
5. Enter your real phone number
6. You should receive an SMS with a 6-digit code
7. Enter the code to login

#### Option 2: Without Twilio (Console Logs)

1. **Don't** add Twilio credentials to `.env`
2. Start server
3. When you request a code, check the **server console**
4. You'll see output like:
   ```
   =================================
   📱 SMS VERIFICATION CODE (DEV MODE)
   =================================
   To: +15551234567
   Code: 123456
   =================================
   ```
5. Use the code from console to login

### Testing Zillow Import

1. Go to Zillow.com and find any listing
2. Copy the URL
3. Navigate to "Create Listing" in your app
4. Paste URL in "Import from Zillow" section
5. Click "Import"
6. Check if fields populate correctly
7. Edit any missing/incorrect fields
8. Submit the listing

**Test URLs**:
- Use any current Zillow listing
- Test with different property types (studio, 1BR, 2BR, etc.)
- Test with rentals and sales listings

### Rate Limiting Tests

1. **Send Code Rate Limit**:
   - Try sending 4 codes within 1 hour
   - 4th attempt should be blocked
   - Error: "Too many attempts. Please try again in 1 hour."

2. **Verify Code Rate Limit**:
   - Request a code
   - Try 6 wrong codes
   - Should be blocked after 5 attempts

3. **Code Expiry**:
   - Request a code
   - Wait 11 minutes
   - Try to verify - should fail with "expired" error

---

## Troubleshooting

### Phone Auth Issues

**Problem**: SMS not sending

**Solution**:
1. Check Twilio credentials in `.env`
2. Verify phone number format is E.164: `+15551234567`
3. Check Twilio account balance
4. For trial accounts, verify the recipient number in Twilio console

**Problem**: "Too many attempts" error

**Solution**:
- Wait 1 hour, or
- Clear rate limits in database:
  ```sql
  DELETE FROM auth_rate_limits WHERE phone = '+15551234567';
  ```

**Problem**: Code expired

**Solution**:
- Request a new code
- Codes expire after 10 minutes

### Zillow Import Issues

**Problem**: "Failed to fetch Zillow page"

**Solution**:
- Verify URL is from Zillow.com
- Check internet connection
- Zillow may be blocking requests - try again later

**Problem**: No data imported

**Solution**:
- Zillow changed their HTML structure
- Parser needs updating
- Manually enter listing details

**Problem**: Images not loading

**Solution**:
- Zillow image URLs may require authentication
- Consider downloading and re-uploading images
- Or use Supabase Storage for image hosting

---

## Production Deployment

### Environment Variables

Set these in your hosting platform (Vercel, Heroku, etc.):

```bash
# Server
SUPABASE_URL=your-prod-url
SUPABASE_SERVICE_ROLE_KEY=your-prod-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
JWT_SECRET=your-strong-secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Client
VITE_API_URL=https://your-api-domain.com/api
VITE_SUPABASE_URL=your-prod-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Security Checklist

- [ ] Use strong `JWT_SECRET` (64+ random characters)
- [ ] Enable HTTPS on both frontend and backend
- [ ] Set up CORS properly for your domain
- [ ] Review Supabase RLS policies
- [ ] Monitor Twilio usage and set spending limits
- [ ] Disable console logging of codes in production
- [ ] Consider adding CAPTCHA for phone auth
- [ ] Set up error logging (Sentry, LogRocket, etc.)

---

## Migration Path for Existing Users

If you have existing users with email/password auth:

1. **Keep Old Auth System** (recommended):
   - Keep existing email/password endpoints
   - Add phone auth as alternative method
   - Let users gradually migrate

2. **Force Migration**:
   - Add phone field to existing profiles
   - Email users to update profiles
   - Require phone verification on next login

3. **Database Script** for bulk migration:
   ```sql
   -- Add placeholder phone numbers for existing users
   UPDATE profiles
   SET phone = '+1' || LPAD(FLOOR(RANDOM() * 10000000000)::text, 10, '0'),
       phone_verified = false
   WHERE phone IS NULL;
   ```

   Then email users to update their phone numbers.

---

## Support

For questions or issues:
- Check server logs for detailed errors
- Review Twilio dashboard for SMS logs
- Check Supabase logs for database errors
- Create an issue on GitHub

---

## License

This feature implementation is for educational purposes. Respect Zillow's Terms of Service and obtain proper API access for production use.
