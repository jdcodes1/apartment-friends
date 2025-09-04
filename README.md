# ApartmentFriends - Friend-to-Friend Apartment Rental Platform

A fullstack web application that allows users to list and search for apartments and rooms through their social network, limiting visibility to friends within 3 degrees of separation.

## Features

- **User Authentication**: Secure registration and login system
- **Friend Network**: Connect with friends and build your housing network
- **3-Degree Friend Filtering**: Only see listings from friends within 3 degrees of separation
- **Multiple Listing Types**:
  - Apartments for rent
  - Rooms for rent
  - "Looking for" posts
- **Facebook Integration**: Import friends from Facebook to expand your network
- **Advanced Search**: Filter by location, price, property type, and more
- **Room Details**: Special features for room listings (furnished, private bathroom, roommate preferences)

## Tech Stack

### Backend

- **Node.js** with **Express** and **TypeScript**
- **Supabase** (PostgreSQL database + Authentication)
- **Row Level Security** for data access control
- **Facebook Graph API** integration

### Frontend

- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons

## Project Structure

```
apartments/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Supabase configuration
│   │   ├── services/      # Database service layers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   ├── types/         # TypeScript database types
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Server entry point
│   ├── database/          # Database schema and migrations
│   ├── package.json
│   └── tsconfig.json
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── config/        # Supabase configuration
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main app component
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Supabase Account (free tier available)
- Facebook App (optional, for social features)

## 🚀 Complete Setup Guide

### Step 1: Supabase Project Setup

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" 
   - Sign up with GitHub (recommended)

2. **Create New Project**
   - Click "New Project"
   - **Name**: `apartment-rental` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
   - Click "Create new project"
   - Wait 1-2 minutes for setup to complete

3. **Get API Keys**
   - In your project dashboard, go to Settings (⚙️) → API
   - Copy these values:
     - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
     - **anon public** key (starts with `eyJhbGci...`)
     - **service_role** key (⚠️ Keep this secret!)

### Step 2: Database Schema Setup

1. **Open SQL Editor**
   - In Supabase dashboard, click "SQL Editor" (left sidebar)
   - Click "New query"

2. **Create Database Schema**
   - Copy the entire contents of `server/database/schema.sql`
   - Paste into the SQL editor
   - Click "Run" to create tables, policies, and functions
   - You should see success messages for each operation

### Step 3: Backend Setup

1. **Navigate to server directory and install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure `server/.env` with your Supabase credentials:**
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   JWT_SECRET=your-super-secret-jwt-key
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```
   
   You should see: `Supabase connected successfully` and `Server is running on port 5000`

### Step 4: Frontend Setup

1. **Navigate to client directory and install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure `client/.env`:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_FACEBOOK_APP_ID=your-facebook-app-id
   ```

4. **Start the client:**
   ```bash
   npm run dev
   ```

### Step 5: Test Your Setup

1. **Open your browser** to `http://localhost:3000` (or the URL shown in terminal)
2. **Try registering** a new account
3. **Check Supabase dashboard** → Authentication → Users to see the created user
4. **Check Database** → Table editor to see your profile in the `profiles` table

### Database Features

- **Automatic User Creation**: When users sign up, profiles are auto-created
- **Row Level Security**: Users can only see listings from their friend network
- **3-Degree Friend Network**: Implemented at database level for security
- **Real-time Ready**: Built-in support for live updates

### Facebook Integration Setup

1. Create a Facebook App at [Facebook Developers](https://developers.facebook.com/)
2. Add Facebook Login product to your app
3. Configure OAuth redirect URIs for your domain
4. Add the App ID to your environment variables
5. Enable "user_friends" permission (requires app review for production)

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration (creates Supabase auth user + profile)
- `POST /api/auth/login` - User login (returns Supabase session)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/reset-password` - Password reset via email
- `POST /api/auth/update-password` - Update user password

### Listings

- `GET /api/listings` - Get all listings (filtered by friend network)
- `POST /api/listings` - Create new listing
- `GET /api/listings/:id` - Get specific listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `GET /api/listings/my-listings` - Get user's listings

### Friends

- `POST /api/friends/send-request` - Send friend request
- `POST /api/friends/accept-request/:connectionId` - Accept friend request
- `DELETE /api/friends/reject-request/:connectionId` - Reject friend request
- `GET /api/friends/requests` - Get pending friend requests
- `GET /api/friends/list` - Get friends list
- `GET /api/friends/network/:degree` - Get friend network up to N degrees (default: 3)
- `DELETE /api/friends/remove/:friendId` - Remove friend
- `POST /api/friends/block/:userId` - Block user

### Facebook Integration

- `POST /api/facebook/connect-account` - Connect Facebook account
- `POST /api/facebook/import-friends` - Import Facebook friends
- `DELETE /api/facebook/disconnect-account` - Disconnect Facebook account

## Key Features Explained

### 3-Degree Friend Network

The system implements a breadth-first search algorithm to find all friends within 3 degrees of separation:

- 1st degree: Direct friends
- 2nd degree: Friends of friends
- 3rd degree: Friends of friends of friends

### Listing Types

1. **Apartment Listings**: Full apartments available for rent
2. **Room Listings**: Individual rooms with roommate preferences
3. **Looking For**: Users seeking housing with their requirements

### Security Features

- **Supabase Authentication**: Built-in secure user management
- **Row Level Security (RLS)**: Database-enforced access control
- **Friend Network Filtering**: Only see listings from your 3-degree network
- **JWT Tokens**: Handled automatically by Supabase
- **Password Security**: Bcrypt hashing with Supabase Auth

## Development

### Running Tests

```bash
# Backend tests (when implemented)
cd server && npm test

# Frontend tests (when implemented)
cd client && npm test
```

### Building for Production

```bash
# Backend
cd server && npm run build

# Frontend
cd client && npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## 🛠 Troubleshooting

### Common Issues

1. **"Invalid URL" error when starting server**
   - Make sure your `SUPABASE_URL` in `.env` is a valid URL starting with `https://`
   - Remove any trailing slashes from the URL

2. **"Invalid API key" or authentication errors**
   - Verify your `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are correct
   - Keys should be copied exactly from Supabase dashboard → Settings → API

3. **Database connection issues**
   - Check your Supabase project is active and not paused
   - Verify the database schema was created successfully
   - Try refreshing your API keys

4. **Friend network not working**
   - Ensure you have friend connections in the database
   - Check Row Level Security policies are enabled
   - Users must be within 3 degrees to see each other's listings

5. **Frontend not connecting to backend**
   - Verify `VITE_API_URL` points to your running server (usually `http://localhost:5000/api`)
   - Check CORS settings if accessing from different domains

### Getting Help

- Check the browser console for JavaScript errors
- Check server logs for API errors  
- Verify your environment variables are loaded correctly
- Test API endpoints directly using a tool like Postman

## 🚀 Benefits of Supabase Migration

- **No Database Management**: Automatic backups, scaling, and maintenance
- **Built-in Authentication**: Secure user management with password reset, email verification
- **Row Level Security**: Database-enforced access control at the PostgreSQL level
- **Real-time Capabilities**: Built-in subscriptions for live updates
- **Better Performance**: Optimized PostgreSQL with global CDN
- **File Storage**: Built-in storage for profile pictures and listing images
- **Cost Effective**: Generous free tier, pay-as-you-scale pricing

## Future Enhancements

- [ ] Image upload for listings using Supabase Storage
- [ ] Real-time messaging using Supabase Realtime
- [ ] Push notifications for new listings
- [ ] Mobile app development with Supabase Flutter/React Native
- [ ] Integration with other social platforms
- [ ] Advanced matching algorithms with PostgreSQL functions
- [ ] Video tours and virtual walkthroughs
- [ ] Payment integration for rent collection
- [ ] Real-time chat and notifications
