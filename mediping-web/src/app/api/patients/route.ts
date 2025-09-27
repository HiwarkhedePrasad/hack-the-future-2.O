import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, use Supabase
let patients: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, mobile_number, age, gender, emergency_contact, blood_group } = body;

    // Check if patient already exists
    const existingPatient = patients.find(p => p.mobile_number === mobile_number);
    
    if (existingPatient) {
      return NextResponse.json({
        success: true,
        message: `Welcome back ${existingPatient.name}! Aap already registered hain.`,
        patient: existingPatient
      });
    }

    // Create new patient
    const newPatient = {
      id: Date.now().toString(),
      name,
      mobile_number,
      age,
      gender,
      emergency_contact,
      blood_group,
      medications: [],
      reminders: [],
      created_at: new Date().toISOString()
    };

    patients.push(newPatient);

    return NextResponse.json({
      success: true,
      message: `Welcome ${name}! Aap successfully register ho gaye hain MediPing mein.`,
      patient: newPatient
    });

  } catch (error) {
    console.error('Patient registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Registration mein problem hui. Phir se try kijiye.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mobile_number = searchParams.get('mobile_number');

  if (mobile_number) {
    const patient = patients.find(p => p.mobile_number === mobile_number);
    if (patient) {
      return NextResponse.json({ success: true, patient });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Patient nahi mila. Mobile number check kijiye.' 
      }, { status: 404 });
    }
  }

  return NextResponse.json({ success: true, patients });
}
