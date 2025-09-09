import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import friendRoutes from './routes/friends';
import facebookRoutes from './routes/facebook';
import { supabase } from './config/supabase';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://apartment-friends.vercel.app', // Your production frontend
        /\.vercel\.app$/ // Any vercel.app domain
      ]
    : [
        'http://localhost:3000', 
        'http://localhost:5173', // Vite dev server
        'https://apartment-friends.vercel.app', // Your production frontend
        /\.vercel\.app$/ // Any vercel.app domain
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Apartment Rental API is running with Supabase!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/facebook', facebookRoutes);

const initializeApp = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.warn('Supabase connection warning:', error.message);
    } else {
      console.log('Supabase connected successfully');
    }
  } catch (error) {
    console.error('Supabase connection failed:', error);
  }
};

initializeApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});