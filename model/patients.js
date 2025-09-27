// model/patients.js
import supabase from '../config/supabase.js';

export class Patient {
  // Create a new patient
  static async create(patientData) {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find patient by ID
  static async findById(patientId) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        profiles!patients_patient_id_fkey (
          id,
          mobile_number,
          name,
          age,
          gender,
          role,
          created_at,
          updated_at
        )
      `)
      .eq('patient_id', patientId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find patient by mobile number (through profile)
  static async findByMobileNumber(mobileNumber) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        profiles!patients_patient_id_fkey (
          id,
          mobile_number,
          name,
          age,
          gender,
          role,
          created_at,
          updated_at
        )
      `)
      .eq('profiles.mobile_number', mobileNumber)
      .eq('profiles.is_deleted', false)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find all patients
  static async findAll() {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        profiles!patients_patient_id_fkey (
          id,
          mobile_number,
          name,
          age,
          gender,
          role,
          created_at,
          updated_at
        )
      `)
      .eq('profiles.is_deleted', false);
    
    if (error) throw error;
    return data;
  }

  // Update patient
  static async update(patientId, updates) {
    const { data, error } = await supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get patient allergies
  static async getAllergies(patientId) {
    const { data, error } = await supabase
      .from('patient_allergies')
      .select(`
        allergies_master (
          id,
          name
        )
      `)
      .eq('patient_id', patientId);
    
    if (error) throw error;
    return data.map(item => item.allergies_master);
  }

  // Add allergy to patient
  static async addAllergy(patientId, allergyId) {
    const { data, error } = await supabase
      .from('patient_allergies')
      .insert([{ patient_id: patientId, allergy_id: allergyId }])
      .select();
    
    if (error) throw error;
    return data;
  }

  // Remove allergy from patient
  static async removeAllergy(patientId, allergyId) {
    const { data, error } = await supabase
      .from('patient_allergies')
      .delete()
      .eq('patient_id', patientId)
      .eq('allergy_id', allergyId);
    
    if (error) throw error;
    return data;
  }
}

export default Patient;
