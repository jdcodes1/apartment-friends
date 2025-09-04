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

  async getListingById(id: string): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getListingsByOwner(ownerId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActiveListings(filters?: {
    listingType?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    state?: string;
  }): Promise<Listing[]> {
    let query = supabase
      .from('listings')
      .select('*')
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
    return data || [];
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

  async searchListings(searchQuery: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}