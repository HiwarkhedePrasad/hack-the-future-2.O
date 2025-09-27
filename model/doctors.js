// model/doctors.js
import supabase from '../config/supabase.js';

export class Doctor {
  // Create a new doctor
  static async create(doctorData) {
    const { data, error } = await supabase
      .from('doctors')
      .insert([doctorData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find doctor by ID
  static async findById(doctorId) {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        profiles!doctors_doctor_id_fkey (
          id,
          mobile_number,
          name,
          age,
          gender,
          role,
          created_at,
          updated_at
        ),
        specializations!doctors_specialization_id_fkey (
          id,
          name
        )
      `)
      .eq('doctor_id', doctorId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find doctor by license number
  static async findByLicenseNumber(licenseNumber) {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        profiles!doctors_doctor_id_fkey (
          id,
          mobile_number,
          name,
          age,
          gender,
          role,
          created_at,
          updated_at
        ),
        specializations!doctors_specialization_id_fkey (
          id,
          name
        )
      `)
      .eq('licence_number', licenseNumber)
      .eq('profiles.is_deleted', false)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find all doctors
  static async findAll() {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        profiles!doctors_doctor_id_fkey (
          id,
          mobile_number,
          name,
          age,
          gender,
          role,
          created_at,
          updated_at
        ),
        specializations!doctors_specialization_id_fkey (
          id,
          name
        )
      `)
      .eq('profiles.is_deleted', false);
    
    if (error) throw error;
    return data;
  }

  // Find doctors by specialization
  static async findBySpecialization(specializationId) {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        profiles!doctors_doctor_id_fkey (
          id,
          mobile_number,
          name,
          age,
          gender,
          role,
          created_at,
          updated_at
        ),
        specializations!doctors_specialization_id_fkey (
          id,
          name
        )
      `)
      .eq('specialization_id', specializationId)
      .eq('profiles.is_deleted', false);
    
    if (error) throw error;
    return data;
  }

  // Update doctor
  static async update(doctorId, updates) {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('doctor_id', doctorId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export default Doctor;
