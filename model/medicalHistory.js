// model/medicalHistory.js
import supabase from '../config/supabase.js';

export class MedicalHistory {
  // Create a new medical history record
  static async create(historyData) {
    const { data, error } = await supabase
      .from('medical_history')
      .insert([historyData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find medical history by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('medical_history')
      .select(`
        *,
        patients!medical_history_patient_id_fkey (
          patient_id,
          profiles!patients_patient_id_fkey (
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

  // Find medical history by patient ID
  static async findByPatientId(patientId) {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Find medical history by date range
  static async findByDateRange(patientId, startDate, endDate) {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', patientId)
      .gte('record_date', startDate)
      .lte('record_date', endDate)
      .order('record_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Search medical history by diagnosis
  static async searchByDiagnosis(patientId, searchTerm) {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', patientId)
      .ilike('diagnosis', `%${searchTerm}%`)
      .order('record_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Search medical history by ICD code
  static async searchByIcdCode(patientId, icdCode) {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', patientId)
      .eq('icd_code', icdCode)
      .order('record_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Update medical history record
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('medical_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete medical history record
  static async delete(id) {
    const { data, error } = await supabase
      .from('medical_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  }

  // Get recent medical history (last N records)
  static async getRecent(patientId, limit = 10) {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
}

export default MedicalHistory;
