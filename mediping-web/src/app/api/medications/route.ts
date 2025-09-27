import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, use Supabase
let medications: any[] = [];
let reminders: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_mobile, medication_name, dosage, frequency, duration_days, doctor_name } = body;

    // Create new medication
    const newMedication = {
      id: Date.now().toString(),
      patient_mobile,
      medication_name,
      dosage,
      frequency,
      duration_days,
      doctor_name,
      created_at: new Date().toISOString()
    };

    medications.push(newMedication);

    // Create automatic reminders based on frequency
    const reminderTimes = generateReminderTimes(frequency);
    
    reminderTimes.forEach((time, index) => {
      const reminder = {
        id: `${Date.now()}_${index}`,
        patient_mobile,
        medication_name,
        time,
        taken: false,
        created_at: new Date().toISOString()
      };
      reminders.push(reminder);
    });

    return NextResponse.json({
      success: true,
      message: `${medication_name} successfully add ho gaya! Reminders automatically set ho gaye hain.`,
      medication: newMedication,
      reminders: reminderTimes.length
    });

  } catch (error) {
    console.error('Medication addition error:', error);
    return NextResponse.json({
      success: false,
      message: 'Medication add karne mein problem hui. Phir se try kariye.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patient_mobile = searchParams.get('patient_mobile');

  if (patient_mobile) {
    const patientMedications = medications.filter(m => m.patient_mobile === patient_mobile);
    const patientReminders = reminders.filter(r => r.patient_mobile === patient_mobile);
    
    return NextResponse.json({
      success: true,
      medications: patientMedications,
      reminders: patientReminders,
      message: `${patientMedications.length} medications aur ${patientReminders.length} reminders milے hain.`
    });
  }

  return NextResponse.json({ success: true, medications, reminders });
}

function generateReminderTimes(frequency: string): string[] {
  const times: string[] = [];
  
  switch (frequency.toLowerCase()) {
    case 'once daily':
    case 'daily':
      times.push('09:00 AM');
      break;
    case 'twice daily':
    case 'bid':
      times.push('09:00 AM', '09:00 PM');
      break;
    case 'thrice daily':
    case 'tid':
      times.push('08:00 AM', '02:00 PM', '08:00 PM');
      break;
    case 'four times daily':
    case 'qid':
      times.push('08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM');
      break;
    default:
      times.push('09:00 AM'); // Default
  }
  
  return times;
}
