# Patient Self-Service Medicine Reminder System

## Overview
This system allows patients to independently manage their medication reminders by:
- Uploading their own prescriptions
- Setting custom reminder times
- Managing their medication schedule
- Receiving automated WhatsApp reminders

## Patient Workflow

### 1. Registration
```
User: "Hi"
Bot: "👋 Welcome to MediPing! Please register first."

User: "REGISTER John Smith | 65 | male | +919876543210"
Bot: "🎉 Welcome John! You can now upload prescriptions and set reminders."
```

### 2. Prescription Upload (Future Feature)
```
User: [Sends photo of prescription]
Bot: "📸 Prescription received! I can see:
- Medicine: Aspirin 75mg
- Frequency: Once daily
- Duration: 30 days

When would you like to be reminded? 
Example: 'Remind me at 8 AM daily'"
```

### 3. Manual Medicine Entry (Current)
```
User: "Remind me to take aspirin at 8 AM daily"
Bot: "✅ Daily reminder set for aspirin at 08:00"

User: "Set reminder for blood pressure medicine at 6 PM"
Bot: "✅ Daily reminder set for blood pressure medicine at 18:00"
```

### 4. Reminder Management
```
User: "Show my reminders"
Bot: "📋 Your active reminders:
1. Aspirin - Daily at 08:00
2. Blood pressure medicine - Daily at 18:00

Reply 'STOP [number]' to cancel any reminder."
```

### 5. Automated Reminders
```
Bot: "💊 Time for your aspirin!
Please reply:
- 'TAKEN' if you've taken it
- 'LATER' to be reminded in 30 minutes
- 'SKIP' to skip today's dose"
```

## Enhanced Features Needed

### A. Prescription Photo Processing
- OCR to extract medicine names, dosages, frequencies
- Smart parsing of doctor's handwriting
- Validation against drug database

### B. Flexible Reminder Options
- Multiple times per day (e.g., "3 times daily")
- Custom schedules (e.g., "Every Monday and Friday")
- Meal-based reminders (e.g., "After breakfast")

### C. Patient Dashboard
- View all active medications
- Edit reminder times
- Track medication adherence
- Emergency contact management

### D. Smart Notifications
- WhatsApp reminders at scheduled times
- Escalation to emergency contacts if no response
- Weekly adherence reports

## Technical Implementation

### Database Schema Updates
```sql
-- Patient-uploaded prescriptions
CREATE TABLE patient_prescriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES patients(patient_id),
    image_url text,
    extracted_text text,
    status text DEFAULT 'pending', -- pending, processed, active
    uploaded_at timestamp DEFAULT now()
);

-- Patient-defined reminder preferences
CREATE TABLE reminder_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES patients(patient_id),
    medicine_name text NOT NULL,
    custom_schedule text, -- "daily", "twice_daily", "weekly", etc.
    preferred_times text[], -- ["08:00", "20:00"]
    meal_timing text, -- "before_meal", "after_meal", "with_meal"
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT now()
);
```

### WhatsApp Commands
```javascript
// Enhanced command processing
const commands = {
  'UPLOAD': handlePrescriptionUpload,
  'REMIND': handleReminderSetup,
  'LIST': showActiveReminders,
  'STOP': cancelReminder,
  'EDIT': editReminder,
  'HELP': showHelp
};
```

## Patient Benefits

1. **Full Control**: Patients manage their own medication schedule
2. **Convenience**: Upload prescriptions via WhatsApp photos
3. **Flexibility**: Set custom reminder times that fit their routine
4. **Safety**: Emergency contact notifications for missed doses
5. **Privacy**: No need to share prescriptions with third parties
6. **Accessibility**: Simple WhatsApp interface, no app downloads

## Implementation Priority

### Phase 1 (Current) ✅
- Patient registration
- Manual medicine reminder setup
- Basic WhatsApp notifications

### Phase 2 (Next)
- Prescription photo upload
- OCR text extraction
- Enhanced reminder options

### Phase 3 (Future)
- Patient dashboard web interface
- Adherence tracking and reports
- Integration with pharmacy systems
- Doctor notification system

## Sample Patient Journey

```
Day 1: Registration
User: "Hi" → Registers → Can set reminders

Day 2: First Prescription
User: [Photo] → System extracts medicines → User sets times

Day 3-30: Daily Reminders
System: Sends reminders → User responds → Tracks adherence

Day 31: Refill Reminder
System: "Your aspirin prescription expires in 3 days. Contact your doctor for refill."
```

This patient-centric approach empowers users to take control of their medication management while providing the safety net of automated reminders and emergency notifications.
