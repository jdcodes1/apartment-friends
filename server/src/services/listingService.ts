import { supabase } from '../config/supabase';
import { Listing, ListingInsert, ListingUpdate } from '../types/database';

export class ListingService {
  async createListing(listingData: ListingInsert): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getListingById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:owner_id (
          id,
          email,
          first_name,
          last_name,
          profile_picture,
          phone,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return null;

    // Transform data to match frontend expectations
    return {
      _id: data.id,
      title: data.title,
      description: data.description,
      listingType: data.listing_type,
      propertyType: data.property_type,
      price: data.price,
      location: {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
        coordinates: data.latitude && data.longitude ? {
          lat: data.latitude,
          lng: data.longitude
        } : undefined
      },
      amenities: data.amenities || [],
      images: data.images || [],
      availableDate: data.available_date,
      isActive: data.is_active,
      owner: {
        _id: data.profiles?.id,
        email: data.profiles?.email,
        firstName: data.profiles?.first_name,
        lastName: data.profiles?.last_name,
        phone: data.profiles?.phone,
        profilePicture: data.profiles?.profile_picture,
        createdAt: data.profiles?.created_at
      },
      roomDetails: data.room_details,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async getListingsByOwner(ownerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:owner_id (
          id,
          email,
          first_name,
          last_name,
          profile_picture,
          phone,
          created_at
        )
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match frontend expectations
    return (data || []).map((listing: any) => ({
      _id: listing.id,
      title: listing.title,
      description: listing.description,
      listingType: listing.listing_type,
      propertyType: listing.property_type,
      price: listing.price,
      location: {
        address: listing.address,
        city: listing.city,
        state: listing.state,
        zipCode: listing.zip_code,
        coordinates: listing.latitude && listing.longitude ? {
          lat: listing.latitude,
          lng: listing.longitude
        } : undefined
      },
      amenities: listing.amenities || [],
      images: listing.images || [],
      availableDate: listing.available_date,
      isActive: listing.is_active,
      owner: {
        _id: listing.profiles?.id,
        email: listing.profiles?.email,
        firstName: listing.profiles?.first_name,
        lastName: listing.profiles?.last_name,
        phone: listing.profiles?.phone,
        profilePicture: listing.profiles?.profile_picture,
        createdAt: listing.profiles?.created_at
      },
      roomDetails: listing.room_details,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at
    }));
  }

  async getActiveListings(filters?: {
    listingType?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    state?: string;
  }): Promise<any[]> {
    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:owner_id (
          id,
          email,
          first_name,
          last_name,
          profile_picture,
          created_at
        )
      `)
      .eq('is_active', true);

    if (filters) {
      if (filters.listingType) {
        query = query.eq('listing_type', filters.listingType);
      }
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.state) {
        query = query.eq('state', filters.state);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    
    // Transform data to match frontend expectations
    return (data || []).map((listing: any) => ({
      _id: listing.id,
      title: listing.title,
      description: listing.description,
      listingType: listing.listing_type,
      propertyType: listing.property_type,
      price: listing.price,
      location: {
        address: listing.address,
        city: listing.city,
        state: listing.state,
        zipCode: listing.zip_code,
        coordinates: listing.latitude && listing.longitude ? {
          lat: listing.latitude,
          lng: listing.longitude
        } : undefined
      },
      amenities: listing.amenities || [],
      images: listing.images || [],
      availableDate: listing.available_date,
      isActive: listing.is_active,
      owner: {
        _id: listing.profiles?.id,
        email: listing.profiles?.email,
        firstName: listing.profiles?.first_name,
        lastName: listing.profiles?.last_name,
        profilePicture: listing.profiles?.profile_picture,
        createdAt: listing.profiles?.created_at
      },
      roomDetails: listing.room_details,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at
    }));
  }

  async updateListing(id: string, updates: ListingUpdate): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deactivateListing(id: string): Promise<Listing | null> {
    return this.updateListing(id, { is_active: false });
  }

  async searchListings(searchQuery: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:owner_id (
          id,
          email,
          first_name,
          last_name,
          profile_picture,
          phone,
          created_at
        )
      `)
      .eq('is_active', true)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match frontend expectations
    return (data || []).map((listing: any) => ({
      _id: listing.id,
      title: listing.title,
      description: listing.description,
      listingType: listing.listing_type,
      propertyType: listing.property_type,
      price: listing.price,
      location: {
        address: listing.address,
        city: listing.city,
        state: listing.state,
        zipCode: listing.zip_code,
        coordinates: listing.latitude && listing.longitude ? {
          lat: listing.latitude,
          lng: listing.longitude
        } : undefined
      },
      amenities: listing.amenities || [],
      images: listing.images || [],
      availableDate: listing.available_date,
      isActive: listing.is_active,
      owner: {
        _id: listing.profiles?.id,
        email: listing.profiles?.email,
        firstName: listing.profiles?.first_name,
        lastName: listing.profiles?.last_name,
        phone: listing.profiles?.phone,
        profilePicture: listing.profiles?.profile_picture,
        createdAt: listing.profiles?.created_at
      },
      roomDetails: listing.room_details,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at
    }));
  }
}