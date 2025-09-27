-- Supabase Schema for MediPing Application
-- Execute this in your Supabase SQL Editor

-- ENUM types
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE role_enum AS ENUM ('doctor', 'patient', 'admin');
CREATE TYPE reminder_status_enum AS ENUM ('pending', 'taken', 'missed', 'cancelled');

-- Profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    mobile_number text NOT NULL UNIQUE,
    name text NOT NULL,
    age smallint NOT NULL CHECK (age > 0),
    gender gender_enum NOT NULL,
    role role_enum NOT NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Specializations
CREATE TABLE public.specializations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    CONSTRAINT specializations_pkey PRIMARY KEY (id)
);

-- Doctors
CREATE TABLE public.doctors (
    doctor_id uuid NOT NULL,
    licence_number text NOT NULL UNIQUE,
    specialization_id uuid NOT NULL,
    clinic_address varchar,
    CONSTRAINT doctors_pkey PRIMARY KEY (doctor_id),
    CONSTRAINT doctors_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(id),
    CONSTRAINT doctors_specialization_id_fkey FOREIGN KEY (specialization_id) REFERENCES public.specializations(id)
);

-- Patients
CREATE TABLE public.patients (
    patient_id uuid NOT NULL,
    emergency_contact text NOT NULL,
    insurance_type text,
    blood_group text,
    timezone_offset smallint NOT NULL,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT patients_pkey PRIMARY KEY (patient_id),
    CONSTRAINT patients_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id)
);

-- Allergies Master
CREATE TABLE public.allergies_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    CONSTRAINT allergies_master_pkey PRIMARY KEY (id)
);

-- Patient Allergies
CREATE TABLE public.patient_allergies (
    patient_id uuid NOT NULL,
    allergy_id uuid NOT NULL,
    CONSTRAINT patient_allergies_pkey PRIMARY KEY (patient_id, allergy_id),
    CONSTRAINT patient_allergies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id),
    CONSTRAINT patient_allergies_allergy_id_fkey FOREIGN KEY (allergy_id) REFERENCES public.allergies_master(id)
);

-- Drugs
CREATE TABLE public.drugs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    CONSTRAINT drugs_pkey PRIMARY KEY (id)
);

-- Medical History
CREATE TABLE public.medical_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    record_date date NOT NULL,
    icd_code varchar,
    diagnosis text,
    notes varchar,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT medical_history_pkey PRIMARY KEY (id),
    CONSTRAINT medical_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id)
);

-- Prescription Records
CREATE TABLE public.prescription_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    general_notes varchar,
    is_completed boolean NOT NULL DEFAULT false,
    prescribed_on timestamp with time zone DEFAULT now(),
    CONSTRAINT prescription_records_pkey PRIMARY KEY (id),
    CONSTRAINT prescription_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id),
    CONSTRAINT prescription_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id)
);

-- Prescription Drugs
CREATE TABLE public.prescription_drugs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    record_id uuid NOT NULL,
    drug_id uuid NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration_days smallint NOT NULL CHECK (duration_days > 0),
    drug_notes text,
    CONSTRAINT prescription_drugs_pkey PRIMARY KEY (id),
    CONSTRAINT prescription_drugs_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.prescription_records(id),
    CONSTRAINT prescription_drugs_drug_id_fkey FOREIGN KEY (drug_id) REFERENCES public.drugs(id)
);

-- Reminder Schedule
CREATE TABLE public.reminder_schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    prescription_drug_id uuid NOT NULL,
    scheduled_time timestamp with time zone NOT NULL,
    status reminder_status_enum NOT NULL DEFAULT 'pending',
    intake_confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reminder_schedule_pkey PRIMARY KEY (id),
    CONSTRAINT reminder_schedule_prescription_drug_id_fkey FOREIGN KEY (prescription_drug_id) REFERENCES public.prescription_drugs(id)
);

-- Reminder Attempts
CREATE TABLE public.reminder_attempts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL,
    channel text NOT NULL CHECK (channel = ANY (ARRAY['whatsapp', 'gsm'])),
    result text NOT NULL CHECK (result = ANY (ARRAY['success', 'failure', 'read', 'no_response'])),
    attempted_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reminder_attempts_pkey PRIMARY KEY (id),
    CONSTRAINT reminder_attempts_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.reminder_schedule(id)
);

-- Indexes for better performance
CREATE INDEX idx_profiles_mobile_number ON public.profiles(mobile_number);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_patients_emergency_contact ON public.patients(emergency_contact);
CREATE INDEX idx_reminder_schedule_status ON public.reminder_schedule(status);
CREATE INDEX idx_reminder_schedule_scheduled_time ON public.reminder_schedule(scheduled_time);
CREATE INDEX idx_prescription_records_patient_id ON public.prescription_records(patient_id);
CREATE INDEX idx_prescription_records_doctor_id ON public.prescription_records(doctor_id);
CREATE INDEX idx_medical_history_patient_id ON public.medical_history(patient_id);
CREATE INDEX idx_medical_history_record_date ON public.medical_history(record_date);

-- Insert some sample specializations
INSERT INTO public.specializations (name) VALUES 
('General Medicine'),
('Cardiology'),
('Neurology'),
('Orthopedics'),
('Pediatrics'),
('Psychiatry'),
('Dermatology'),
('Ophthalmology'),
('ENT'),
('Gynecology');

-- Insert some common allergies
INSERT INTO public.allergies_master (name) VALUES 
('Penicillin'),
('Aspirin'),
('Peanuts'),
('Shellfish'),
('Latex'),
('Dust Mites'),
('Pollen'),
('Pet Dander'),
('Sulfa Drugs'),
('Iodine');

-- Insert some common drugs
INSERT INTO public.drugs (name) VALUES 
('Paracetamol'),
('Ibuprofen'),
('Aspirin'),
('Amoxicillin'),
('Metformin'),
('Lisinopril'),
('Atorvastatin'),
('Omeprazole'),
('Amlodipine'),
('Levothyroxine');

-- Enable Row Level Security (RLS) - Uncomment if needed
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.prescription_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reminder_schedule ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policies (uncomment and modify as needed)
-- CREATE POLICY "Users can view their own profile" ON public.profiles
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Patients can view their own data" ON public.patients
--   FOR SELECT USING (auth.uid() = patient_id);

-- CREATE POLICY "Doctors can view their own data" ON public.doctors
--   FOR SELECT USING (auth.uid() = doctor_id);
