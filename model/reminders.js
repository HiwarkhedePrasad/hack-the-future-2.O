// model/reminders.js
import supabase from '../config/supabase.js';

export class ReminderSchedule {
  // Create a new reminder schedule
  static async create(reminderData) {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .insert([reminderData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find reminder by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select(`
        *,
        prescription_drugs!reminder_schedule_prescription_drug_id_fkey (
          id,
          dosage,
          frequency,
          duration_days,
          drug_notes,
          drugs!prescription_drugs_drug_id_fkey (
            id,
            name
          ),
          prescription_records!prescription_drugs_record_id_fkey (
            id,
            patient_id,
            patients!prescription_records_patient_id_fkey (
              patient_id,
              profiles!patients_patient_id_fkey (
                name,
                mobile_number
              )
            )
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Find reminders by prescription drug ID
  static async findByPrescriptionDrugId(prescriptionDrugId) {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select('*')
      .eq('prescription_drug_id', prescriptionDrugId)
      .order('scheduled_time');
    
    if (error) throw error;
    return data;
  }

  // Find pending reminders
  static async findPending() {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select(`
        *,
        prescription_drugs!reminder_schedule_prescription_drug_id_fkey (
          id,
          dosage,
          frequency,
          duration_days,
          drug_notes,
          drugs!prescription_drugs_drug_id_fkey (
            id,
            name
          ),
          prescription_records!prescription_drugs_record_id_fkey (
            id,
            patient_id,
            patients!prescription_records_patient_id_fkey (
              patient_id,
              timezone_offset,
              profiles!patients_patient_id_fkey (
                name,
                mobile_number
              )
            )
          )
        )
      `)
      .eq('status', 'pending')
      .order('scheduled_time');
    
    if (error) throw error;
    return data;
  }

  // Find reminders due now (within next 5 minutes)
  static async findDueNow() {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select(`
        *,
        prescription_drugs!reminder_schedule_prescription_drug_id_fkey (
          id,
          dosage,
          frequency,
          duration_days,
          drug_notes,
          drugs!prescription_drugs_drug_id_fkey (
            id,
            name
          ),
          prescription_records!prescription_drugs_record_id_fkey (
            id,
            patient_id,
            patients!prescription_records_patient_id_fkey (
              patient_id,
              timezone_offset,
              profiles!patients_patient_id_fkey (
                name,
                mobile_number
              )
            )
          )
        )
      `)
      .eq('status', 'pending')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', fiveMinutesFromNow.toISOString())
      .order('scheduled_time');
    
    if (error) throw error;
    return data;
  }

  // Find reminders by patient mobile number
  static async findByPatientMobile(mobileNumber) {
    const { data, error } = await supabase
      .from('reminder_schedule')
      .select(`
        *,
        prescription_drugs!reminder_schedule_prescription_drug_id_fkey (
          id,
          dosage,
          frequency,
          duration_days,
          drug_notes,
          drugs!prescription_drugs_drug_id_fkey (
            id,
            name
          ),
          prescription_records!prescription_drugs_record_id_fkey (
            id,
            patient_id,
            patients!prescription_records_patient_id_fkey (
              patient_id,
              profiles!patients_patient_id_fkey (
                name,
                mobile_number
              )
            )
          )
        )
      `)
      .eq('prescription_drugs.prescription_records.patients.profiles.mobile_number', mobileNumber)
      .order('scheduled_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Update reminder status
  static async updateStatus(id, status, intakeConfirmedAt = null) {
    const updates = { status };
    if (intakeConfirmedAt) {
      updates.intake_confirmed_at = intakeConfirmedAt;
    }

    const { data, error } = await supabase
      .from('reminder_schedule')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Mark reminder as taken
  static async markTaken(id) {
    return this.updateStatus(id, 'taken', new Date().toISOString());
  }

  // Mark reminder as missed
  static async markMissed(id) {
    return this.updateStatus(id, 'missed');
  }

  // Mark reminder as cancelled
  static async markCancelled(id) {
    return this.updateStatus(id, 'cancelled');
  }

  // Create multiple reminders for a prescription drug
  static async createMultipleReminders(prescriptionDrugId, scheduledTimes) {
    const reminders = scheduledTimes.map(time => ({
      prescription_drug_id: prescriptionDrugId,
      scheduled_time: time,
      status: 'pending'
    }));

    const { data, error } = await supabase
      .from('reminder_schedule')
      .insert(reminders)
      .select();
    
    if (error) throw error;
    return data;
  }
}

export class ReminderAttempt {
  // Create a new reminder attempt
  static async create(attemptData) {
    const { data, error } = await supabase
      .from('reminder_attempts')
      .insert([attemptData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Find attempts by schedule ID
  static async findByScheduleId(scheduleId) {
    const { data, error } = await supabase
      .from('reminder_attempts')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('attempted_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Find recent attempts for a reminder
  static async findRecentAttempts(scheduleId, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('reminder_attempts')
      .select('*')
      .eq('schedule_id', scheduleId)
      .gte('attempted_at', since.toISOString())
      .order('attempted_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get attempt statistics
  static async getStatistics(scheduleId) {
    const { data, error } = await supabase
      .from('reminder_attempts')
      .select('result')
      .eq('schedule_id', scheduleId);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      success: 0,
      failure: 0,
      read: 0,
      no_response: 0
    };
    
    data.forEach(attempt => {
      stats[attempt.result]++;
    });
    
    return stats;
  }
}

// Classes are already exported individually above
