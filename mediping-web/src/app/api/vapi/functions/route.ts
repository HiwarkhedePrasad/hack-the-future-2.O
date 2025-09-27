import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Vapi function call received:', body);

    // Extract function call data
    const message = body.message || {};
    const functionCall = message.functionCall || {};
    const callId = body.call?.id || 'unknown';

    const functionName = functionCall.name;
    const parameters = functionCall.parameters || {};

    if (!functionName) {
      return NextResponse.json({ error: 'No function name provided' }, { status: 400 });
    }

    // Handle different function calls
    let result;
    
    switch (functionName) {
      case 'register_patient':
        result = await handlePatientRegistration(parameters, callId);
        break;
        
      case 'add_medication':
        result = await handleAddMedication(parameters);
        break;
        
      case 'check_medications':
        result = await handleCheckMedications(parameters);
        break;
        
      case 'mark_medication_taken':
        result = await handleMarkMedicationTaken(parameters);
        break;
        
      case 'set_reminder':
        result = await handleSetReminder(parameters);
        break;
        
      default:
        result = { error: `Unknown function: ${functionName}` };
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Vapi function call error:', error);
    return NextResponse.json({ error: 'Function execution failed' }, { status: 500 });
  }
}

async function handlePatientRegistration(params: any, callId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Registration mein problem hui. Phir se try kijiye.'
    };
  }
}

async function handleAddMedication(params: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Medication add karne mein problem hui.'
    };
  }
}

async function handleCheckMedications(params: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/medications?patient_mobile=${params.patient_mobile}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: `Aapki ${data.medications.length} medicines hain aur ${data.reminders.length} reminders set hain.`,
        medications: data.medications,
        reminders: data.reminders
      };
    }
    
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Medications check karne mein problem hui.'
    };
  }
}

async function handleMarkMedicationTaken(params: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        action: 'mark_taken'
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Medication record karne mein problem hui.'
    };
  }
}

async function handleSetReminder(params: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Reminder set karne mein problem hui.'
    };
  }
}
