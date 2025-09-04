export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export const ListingType = {
  APARTMENT: 'apartment' as const,
  ROOM: 'room' as const,
  LOOKING_FOR: 'looking_for' as const
};

export type ListingType = 'apartment' | 'room' | 'looking_for';

export const PropertyType = {
  STUDIO: 'studio' as const,
  ONE_BEDROOM: '1br' as const,
  TWO_BEDROOM: '2br' as const,
  THREE_BEDROOM: '3br' as const,
  FOUR_PLUS_BEDROOM: '4br+' as const
};

export type PropertyType = 'studio' | '1br' | '2br' | '3br' | '4br+';

export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RoomDetails {
  furnished: boolean;
  privateBathroom: boolean;
  roommatePreferences?: {
    gender?: 'male' | 'female' | 'any';
    ageRange?: {
      min: number;
      max: number;
    };
    occupation?: string[];
  };
}

export interface Listing {
  _id: string;
  title: string;
  description: string;
  listingType: ListingType;
  propertyType?: PropertyType;
  price: number;
  location: Location;
  amenities: string[];
  images: string[];
  availableDate: string;
  isActive: boolean;
  owner: User;
  createdAt: string;
  updatedAt: string;
  roomDetails?: RoomDetails;
}

export interface FriendConnection {
  _id: string;
  user1: User;
  user2: User;
  status: 'pending' | 'accepted' | 'blocked';
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}