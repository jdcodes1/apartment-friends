export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          profile_picture: string | null;
          phone_number: string;
          profile_complete: boolean;
          current_address: string | null;
          current_city: string | null;
          current_state: string | null;
          current_zip: string | null;
          current_latitude: number | null;
          current_longitude: number | null;
          contacts_uploaded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          profile_picture?: string | null;
          phone_number?: string;
          profile_complete?: boolean;
          current_address?: string | null;
          current_city?: string | null;
          current_state?: string | null;
          current_zip?: string | null;
          current_latitude?: number | null;
          current_longitude?: number | null;
          contacts_uploaded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          profile_picture?: string | null;
          phone_number?: string;
          profile_complete?: boolean;
          current_address?: string | null;
          current_city?: string | null;
          current_state?: string | null;
          current_zip?: string | null;
          current_latitude?: number | null;
          current_longitude?: number | null;
          contacts_uploaded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      friend_connections: {
        Row: {
          id: string;
          user1: string;
          user2: string;
          status: "pending" | "accepted" | "blocked";
          requested_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user1: string;
          user2: string;
          status?: "pending" | "accepted" | "blocked";
          requested_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user1?: string;
          user2?: string;
          status?: "pending" | "accepted" | "blocked";
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
          listing_type: "apartment" | "room";
          property_type: "studio" | "1br" | "2br" | "3br" | "4br+" | null;
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
          listing_type: "apartment" | "room";
          property_type?: "studio" | "1br" | "2br" | "3br" | "4br+" | null;
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
          listing_type?: "apartment" | "room";
          property_type?: "studio" | "1br" | "2br" | "3br" | "4br+" | null;
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
    gender?: "male" | "female" | "any";
    ageRange?: {
      min: number;
      max: number;
    };
    occupation?: string[];
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type FriendConnection =
  Database["public"]["Tables"]["friend_connections"]["Row"];
export type FriendConnectionInsert =
  Database["public"]["Tables"]["friend_connections"]["Insert"];
export type FriendConnectionUpdate =
  Database["public"]["Tables"]["friend_connections"]["Update"];

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];

export enum ListingType {
  APARTMENT = "apartment",
  ROOM = "room",
}

export enum PropertyType {
  STUDIO = "studio",
  ONE_BEDROOM = "1br",
  TWO_BEDROOM = "2br",
  THREE_BEDROOM = "3br",
  FOUR_PLUS_BEDROOM = "4br+",
}
