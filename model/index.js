// models/index.js - Supabase Models
import supabase from "../config/supabase.js";

// Import all Supabase models
import Profile from "./profiles.js";
import Patient from "./patients.js";
import Doctor from "./doctors.js";
import { PrescriptionRecord, PrescriptionDrug, Drug } from "./prescriptions.js";
import { ReminderSchedule, ReminderAttempt } from "./reminders.js";
import Specialization from "./specializations.js";
import AllergiesMaster from "./allergies.js";
import MedicalHistory from "./medicalHistory.js";

// Legacy compatibility - create User class that maps to Profile/Patient
export class User {
  static async findAll(options = {}) {
    // Find all patients with their profiles
    return await Patient.findAll();
  }

  static async findOne(options) {
    if (options.where && options.where.PhoneNumber) {
      return await Patient.findByMobileNumber(options.where.PhoneNumber);
    }
    return null;
  }

  // Helper method to find or create user by phone number
  static async findOrCreateByPhone(phoneNumber, userData = {}) {
    try {
      // First try to find existing user
      const existingPatient = await Patient.findByMobileNumber(phoneNumber);
      if (existingPatient) {
        console.log('✅ Found existing user:', existingPatient.profiles?.name);
        return {
          UserID: existingPatient.patient_id,
          UserName: existingPatient.profiles?.name,
          PhoneNumber: existingPatient.profiles?.mobile_number,
          EmergencyNumber: existingPatient.emergency_contact,
          Age: existingPatient.profiles?.age,
          Language: 'English'
        };
      }

      // If user doesn't exist and we have enough data, create them
      if (userData.UserName && userData.EmergencyNumber) {
        console.log('📝 Creating new user for phone:', phoneNumber);
        return await this.create({
          UserName: userData.UserName,
          PhoneNumber: phoneNumber,
          EmergencyNumber: userData.EmergencyNumber,
          Age: userData.Age || null,
          Language: userData.Language || 'English'
        });
      }

      // Not enough data to create user
      throw new Error(`User with phone ${phoneNumber} not found. Please provide name and emergency contact to register.`);
    } catch (error) {
      console.error('❌ Error in findOrCreateByPhone:', error);
      throw error;
    }
  }

  static async create(userData) {
    // Create profile first, then patient
    const profileData = {
      mobile_number: userData.PhoneNumber,
      name: userData.UserName,
      age: userData.Age || null,
      gender: 'other', // Default, should be provided
      role: 'patient'
    };

    const profile = await Profile.create(profileData);
    
    const patientData = {
      patient_id: profile.id,
      emergency_contact: userData.EmergencyNumber,
      timezone_offset: 0 // Default, should be calculated based on location
    };

    const patient = await Patient.create(patientData);
    
    // Return in legacy format
    return {
      UserID: patient.patient_id,
      UserName: profile.name,
      PhoneNumber: profile.mobile_number,
      Email: null,
      EmergencyNumber: patient.emergency_contact,
      Age: profile.age,
      Language: userData.Language || 'English'
    };
  }
}

// Legacy compatibility for MedicineReminder
export class MedicineReminder {
  static async create(reminderData) {
    try {
      console.log('Creating medicine reminder for UserID:', reminderData.UserID);
      
      // First, check if the user exists in Supabase
      let patient = null;
      if (reminderData.UserID) {
        patient = await Patient.findById(reminderData.UserID);
      }
      
      // If patient doesn't exist, check if profile exists and create patient record
      if (!patient) {
        console.log('❌ Patient record not found, checking for profile...');
        
        // Check if profile exists
        const profile = await Profile.findById(reminderData.UserID);
        if (profile) {
          console.log('✅ Profile found, creating missing patient record...');
          
          // Create patient record with default emergency contact (their own number)
          patient = await Patient.create({
            patient_id: profile.id,
            emergency_contact: profile.mobile_number, // Use their own number as default
            timezone_offset: 330 // Default to IST (+5:30)
          });
          
          console.log('✅ Patient record created successfully');
        } else {
          console.log('❌ User not found in database. Registration required.');
          throw new Error('User not found. Please register the user first using User.create() with phone number, name, and emergency contact.');
        }
      }
      
      console.log('✅ User found:', patient.profiles?.name || 'Patient');
      
      // This is a simplified mapping - in real implementation, you'd need to:
      // 1. Create a prescription record
      // 2. Create a prescription drug
      // 3. Create reminder schedules
      
      // Get or create a default system doctor
    let systemDoctor = await Doctor.findByLicenseNumber('SYSTEM_DEFAULT');
    if (!systemDoctor) {
      // Create default specialization if it doesn't exist
      let generalMedicine = await Specialization.findByName('General Medicine');
      if (!generalMedicine) {
        generalMedicine = await Specialization.create({ name: 'General Medicine' });
      }
      
      // Create system profile first
      const systemProfile = await Profile.create({
        mobile_number: '+1000000000',
        name: 'System Doctor',
        age: 40,
        gender: 'other',
        role: 'doctor'
      });
      
      // Create system doctor
      systemDoctor = await Doctor.create({
        doctor_id: systemProfile.id,
        licence_number: 'SYSTEM_DEFAULT',
        specialization_id: generalMedicine.id,
        clinic_address: 'System Generated'
      });
    }
    
    // Create prescription record with system doctor
    const prescriptionRecord = await PrescriptionRecord.create({
      patient_id: reminderData.UserID,
      doctor_id: systemDoctor.doctor_id,
      general_notes: reminderData.Notes || 'System generated reminder'
    });

    // Find or create the drug
    let drug = await Drug.findByName(reminderData.Medicine);
    if (!drug) {
      drug = await Drug.create({ name: reminderData.Medicine });
    }

    const prescriptionDrug = await PrescriptionDrug.create({
      record_id: prescriptionRecord.id,
      drug_id: drug.id,
      dosage: '1 tablet', // Default
      frequency: reminderData.Frequency || 'daily',
      duration_days: reminderData.Duration || 1,
      drug_notes: reminderData.Notes
    });

    // Create reminder schedule
    const scheduledTime = new Date();
    const [hours, minutes] = reminderData.Time.split(':');
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const reminder = await ReminderSchedule.create({
      prescription_drug_id: prescriptionDrug.id,
      scheduled_time: scheduledTime.toISOString(),
      status: 'pending'
    });

    // Return in legacy format
    return {
      ReminderID: reminder.id,
      UserID: reminderData.UserID,
      Time: reminderData.Time,
      Medicine: reminderData.Medicine,
      Response: null,
      ReminderType: reminderData.ReminderType || 'daily',
      Duration: reminderData.Duration || 1,
      StartDate: reminderData.StartDate,
      EndDate: reminderData.EndDate,
      Notes: reminderData.Notes,
      Frequency: reminderData.Frequency
    };
    } catch (error) {
      console.error('❌ Error creating medicine reminder:', error);
      throw error;
    }
  }

  static async findAll() {
    const reminders = await ReminderSchedule.findPending();
    return reminders.map(reminder => ({
      ReminderID: reminder.id,
      UserID: reminder.prescription_drugs?.prescription_records?.patient_id,
      Time: new Date(reminder.scheduled_time).toTimeString().slice(0, 5),
      Medicine: reminder.prescription_drugs?.drugs?.name,
      Response: null,
      ReminderType: 'daily',
      Duration: reminder.prescription_drugs?.duration_days,
      StartDate: null,
      EndDate: null,
      Notes: reminder.prescription_drugs?.drug_notes,
      Frequency: reminder.prescription_drugs?.frequency
    }));
  }

  static async findByPk(id) {
    const reminder = await ReminderSchedule.findById(id);
    if (!reminder) return null;

    return {
      ReminderID: reminder.id,
      UserID: reminder.prescription_drugs?.prescription_records?.patient_id,
      Time: new Date(reminder.scheduled_time).toTimeString().slice(0, 5),
      Medicine: reminder.prescription_drugs?.drugs?.name,
      Response: reminder.status === 'taken' ? 'taken' : null,
      ReminderType: 'daily',
      Duration: reminder.prescription_drugs?.duration_days,
      StartDate: null,
      EndDate: null,
      Notes: reminder.prescription_drugs?.drug_notes,
      Frequency: reminder.prescription_drugs?.frequency,
      save: async function() {
        if (this.Response === 'taken') {
          await ReminderSchedule.markTaken(this.ReminderID);
        }
      }
    };
  }
}

// Export all models
export {
  Profile,
  Patient,
  Doctor,
  PrescriptionRecord,
  PrescriptionDrug,
  Drug,
  ReminderSchedule,
  ReminderAttempt,
  Specialization,
  AllergiesMaster,
  MedicalHistory,
  supabase
};
