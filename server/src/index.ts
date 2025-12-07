import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import friendRoutes from './routes/friends';
import uploadRoutes from './routes/upload';
import { supabase } from './config/supabase';
import { ImageUploadService } from './services/imageUploadService';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Log ALL incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://apartment-friends.vercel.app', // Your production frontend
        /\.vercel\.app$/ // Any vercel.app domain
      ]
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'Apartment Rental API is running with Supabase!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/upload', uploadRoutes);

const initializeApp = async () => {
  try {
    console.log('Testing Supabase connection...');
    // Test Supabase connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.warn('Supabase connection warning:', error.message);
    } else {
      console.log('Supabase connected successfully');
    }

    console.log('Initializing storage bucket...');
    // Initialize storage bucket for images
    const imageUploadService = new ImageUploadService();
    await imageUploadService.ensureBucketExists();
    console.log('Storage bucket initialized');
  } catch (error) {
    console.error('Supabase connection failed:', error);
  }
};

// Start listening FIRST, then initialize in background
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  // Initialize after server is listening
  initializeApp();
});