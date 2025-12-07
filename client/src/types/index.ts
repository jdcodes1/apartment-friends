export interface User {
  _id: string;
  id: string; // Add id as well for compatibility
  phoneNumber: string; // Required - primary identifier
  firstName: string;
  lastName: string;
  profilePicture?: string;
  profileComplete: boolean;

  // Current address (used as default for listings)
  currentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentZip?: string;
  currentLatitude?: number;
  currentLongitude?: number;

  contactsUploaded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export const ListingType = {
  APARTMENT: "apartment" as const,
  ROOM: "room" as const,
};

export type ListingType = "apartment" | "room";

export const PropertyType = {
  STUDIO: "studio" as const,
  ONE_BEDROOM: "1br" as const,
  TWO_BEDROOM: "2br" as const,
  THREE_BEDROOM: "3br" as const,
  FOUR_PLUS_BEDROOM: "4br+" as const,
};

export type PropertyType = "studio" | "1br" | "2br" | "3br" | "4br+";

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
    gender?: "male" | "female" | "any";
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
  // All listings are friends-only now (no permission field)
}

export interface FriendConnection {
  _id: string;
  user1: User;
  user2: User;
  status: "pending" | "accepted" | "blocked";
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedContact {
  id: string;
  userId: string;
  phoneNumber: string;
  contactName?: string;
  matchedUserId?: string;
  matchedUser?: User;
  createdAt: string;
}

export interface ProfileCompletionData {
  firstName: string;
  lastName: string;
  currentAddress: string;
  currentCity: string;
  currentState: string;
  currentZip: string;
  profilePicture?: string;
}
