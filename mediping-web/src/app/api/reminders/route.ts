import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, use Supabase
let reminders: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_mobile, medication_name, reminder_id, action } = body;

    if (action === 'mark_taken') {
      const reminderIndex = reminders.findIndex(r => r.id === reminder_id);
      
      if (reminderIndex !== -1) {
        reminders[reminderIndex].taken = true;
        reminders[reminderIndex].taken_at = new Date().toISOString();
        
        return NextResponse.json({
          success: true,
          message: `Excellent! Maine record kar liya hai ki aapne ${medication_name} le liya hai. Keep up the good work!`,
          reminder: reminders[reminderIndex]
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Reminder nahi mila.'
        }, { status: 404 });
      }
    }

    // Create custom reminder
    const newReminder = {
      id: Date.now().toString(),
      patient_mobile,
      medication_name,
      time: body.time || '09:00 AM',
      taken: false,
      created_at: new Date().toISOString()
    };

    reminders.push(newReminder);

    return NextResponse.json({
      success: true,
      message: `${medication_name} ke liye reminder set ho gaya hai ${newReminder.time} par.`,
      reminder: newReminder
    });

  } catch (error) {
    console.error('Reminder error:', error);
    return NextResponse.json({
      success: false,
      message: 'Reminder set karne mein problem hui.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patient_mobile = searchParams.get('patient_mobile');

  if (patient_mobile) {
    const patientReminders = reminders.filter(r => r.patient_mobile === patient_mobile);
    const todayReminders = patientReminders.filter(r => {
      // For demo, show all reminders as today's
      return true;
    });
    
    return NextResponse.json({
      success: true,
      reminders: todayReminders,
      message: `Aaj ke ${todayReminders.length} reminders hain.`
    });
  }

  return NextResponse.json({ success: true, reminders });
}
