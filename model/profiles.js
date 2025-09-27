// model/profiles.js
import supabase from '../config/supabase.js';

export class Profile {
  // Create a new profile
  static async create(profileData) {
    // Let the database generate the UUID automatically
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find profile by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  // Find profile by mobile number
  static async findByMobileNumber(mobileNumber) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('mobile_number', mobileNumber)
      .eq('is_deleted', false)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find all profiles with optional filters
  static async findAll(filters = {}) {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_deleted', false);

    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        query = query.eq(key, filters[key]);
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Update profile
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Soft delete profile
  static async softDelete(id) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_deleted: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get profiles by role
  static async findByRole(role) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .eq('is_deleted', false);
    
    if (error) throw error;
    return data;
  }
}

export default Profile;
