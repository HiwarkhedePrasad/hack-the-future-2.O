// model/allergies.js
import supabase from '../config/supabase.js';

export class AllergiesMaster {
  // Create a new allergy
  static async create(allergyData) {
    const { data, error } = await supabase
      .from('allergies_master')
      .insert([allergyData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find allergy by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('allergies_master')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find allergy by name
  static async findByName(name) {
    const { data, error } = await supabase
      .from('allergies_master')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find all allergies
  static async findAll() {
    const { data, error } = await supabase
      .from('allergies_master')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Search allergies by name pattern
  static async searchByName(pattern) {
    const { data, error } = await supabase
      .from('allergies_master')
      .select('*')
      .ilike('name', `%${pattern}%`)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Update allergy
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('allergies_master')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete allergy
  static async delete(id) {
    const { data, error } = await supabase
      .from('allergies_master')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  }
}

export default AllergiesMaster;
