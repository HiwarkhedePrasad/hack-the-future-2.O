// model/prescriptions.js
import supabase from '../config/supabase.js';

export class PrescriptionRecord {
  // Create a new prescription record
  static async create(prescriptionData) {
    const { data, error } = await supabase
      .from('prescription_records')
      .insert([prescriptionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find prescription by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('prescription_records')
      .select(`
        *,
        patients!prescription_records_patient_id_fkey (
          patient_id,
          profiles!patients_patient_id_fkey (
            name,
            mobile_number
          )
        ),
        doctors!prescription_records_doctor_id_fkey (
          doctor_id,
          profiles!doctors_doctor_id_fkey (
            name,
            mobile_number
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find prescriptions by patient ID
  static async findByPatientId(patientId) {
    const { data, error } = await supabase
      .from('prescription_records')
      .select(`
        *,
        doctors!prescription_records_doctor_id_fkey (
          doctor_id,
          profiles!doctors_doctor_id_fkey (
            name,
            mobile_number
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('prescribed_on', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Find prescriptions by doctor ID
  static async findByDoctorId(doctorId) {
    const { data, error } = await supabase
      .from('prescription_records')
      .select(`
        *,
        patients!prescription_records_patient_id_fkey (
          patient_id,
          profiles!patients_patient_id_fkey (
            name,
            mobile_number
          )
        )
      `)
      .eq('doctor_id', doctorId)
      .order('prescribed_on', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Update prescription
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('prescription_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Mark prescription as completed
  static async markCompleted(id) {
    return this.update(id, { is_completed: true });
  }
}

export class PrescriptionDrug {
  // Create a new prescription drug
  static async create(drugData) {
    const { data, error } = await supabase
      .from('prescription_drugs')
      .insert([drugData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find drugs by prescription record ID
  static async findByRecordId(recordId) {
    const { data, error } = await supabase
      .from('prescription_drugs')
      .select(`
        *,
        drugs!prescription_drugs_drug_id_fkey (
          id,
          name
        )
      `)
      .eq('record_id', recordId);
    
    if (error) throw error;
    return data;
  }

  // Find prescription drug by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('prescription_drugs')
      .select(`
        *,
        drugs!prescription_drugs_drug_id_fkey (
          id,
          name
        ),
        prescription_records!prescription_drugs_record_id_fkey (
          id,
          patient_id,
          doctor_id
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update prescription drug
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('prescription_drugs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete prescription drug
  static async delete(id) {
    const { data, error } = await supabase
      .from('prescription_drugs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  }
}

export class Drug {
  // Create a new drug
  static async create(drugData) {
    const { data, error } = await supabase
      .from('drugs')
      .insert([drugData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find drug by name
  static async findByName(name) {
    const { data, error } = await supabase
      .from('drugs')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find all drugs
  static async findAll() {
    const { data, error } = await supabase
      .from('drugs')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Search drugs by name pattern
  static async searchByName(pattern) {
    const { data, error } = await supabase
      .from('drugs')
      .select('*')
      .ilike('name', `%${pattern}%`)
      .order('name');
    
    if (error) throw error;
    return data;
  }
}

// Classes are already exported individually above
