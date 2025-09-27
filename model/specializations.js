// model/specializations.js
import supabase from '../config/supabase.js';

export class Specialization {
  // Create a new specialization
  static async create(specializationData) {
    const { data, error } = await supabase
      .from('specializations')
      .insert([specializationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find specialization by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('specializations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find specialization by name
  static async findByName(name) {
    const { data, error } = await supabase
      .from('specializations')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find all specializations
  static async findAll() {
    const { data, error } = await supabase
      .from('specializations')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Search specializations by name pattern
  static async searchByName(pattern) {
    const { data, error } = await supabase
      .from('specializations')
      .select('*')
      .ilike('name', `%${pattern}%`)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Update specialization
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('specializations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete specialization
  static async delete(id) {
    const { data, error } = await supabase
      .from('specializations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  }
}

export default Specialization;
