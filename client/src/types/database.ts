export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          profile_picture: string | null;
          phone: string | null;
          facebook_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          profile_picture?: string | null;
          phone?: string | null;
          facebook_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          profile_picture?: string | null;
          phone?: string | null;
          facebook_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      friend_connections: {
        Row: {
          id: string;
          user1: string;
          user2: string;
          status: 'pending' | 'accepted' | 'blocked';
          requested_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user1: string;
          user2: string;
          status?: 'pending' | 'accepted' | 'blocked';
          requested_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user1?: string;
          user2?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          requested_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          title: string;
          description: string;
          listing_type: 'apartment' | 'room' | 'looking_for';
          property_type: 'studio' | '1br' | '2br' | '3br' | '4br+' | null;
          price: number;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          latitude: number | null;
          longitude: number | null;
          amenities: string[] | null;
          images: string[] | null;
          available_date: string;
          is_active: boolean;
          owner_id: string;
          room_details: RoomDetails | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          listing_type: 'apartment' | 'room' | 'looking_for';
          property_type?: 'studio' | '1br' | '2br' | '3br' | '4br+' | null;
          price: number;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          latitude?: number | null;
          longitude?: number | null;
          amenities?: string[] | null;
          images?: string[] | null;
          available_date: string;
          is_active?: boolean;
          owner_id: string;
          room_details?: RoomDetails | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          listing_type?: 'apartment' | 'room' | 'looking_for';
          property_type?: 'studio' | '1br' | '2br' | '3br' | '4br+' | null;
          price?: number;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          latitude?: number | null;
          longitude?: number | null;
          amenities?: string[] | null;
          images?: string[] | null;
          available_date?: string;
          is_active?: boolean;
          owner_id?: string;
          room_details?: RoomDetails | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export interface RoomDetails {
  furnished?: boolean;
  privateBathroom?: boolean;
  roommatePreferences?: {
    gender?: 'male' | 'female' | 'any';
    ageRange?: {
      min: number;
      max: number;
    };
    occupation?: string[];
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type FriendConnection = Database['public']['Tables']['friend_connections']['Row'];
export type FriendConnectionInsert = Database['public']['Tables']['friend_connections']['Insert'];
export type FriendConnectionUpdate = Database['public']['Tables']['friend_connections']['Update'];

export type Listing = Database['public']['Tables']['listings']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];

export const ListingType = {
  APARTMENT: 'apartment' as const,
  ROOM: 'room' as const,
  LOOKING_FOR: 'looking_for' as const
} as const;

export const PropertyType = {
  STUDIO: 'studio' as const,
  ONE_BEDROOM: '1br' as const,
  TWO_BEDROOM: '2br' as const,
  THREE_BEDROOM: '3br' as const,
  FOUR_PLUS_BEDROOM: '4br+' as const
} as const;