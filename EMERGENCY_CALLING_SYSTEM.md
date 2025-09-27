# 🚨 Emergency Voice Calling System

## Overview
When patients don't respond to medicine reminders within 7 minutes, the system automatically escalates by making a **voice call** to their emergency contact, followed by a WhatsApp backup message.

## 🔄 Complete Emergency Escalation Flow

### 1. Medicine Reminder Sent
```
Bot → Patient: "⏰ Time to take your aspirin! Reply 'Taken' if you've taken it."
```

### 2. 7-Minute Timer Starts
- System tracks if patient responds
- If no response after 7 minutes → Emergency escalation triggered

### 3. Emergency Voice Call Made
```
📞 VOICE CALL to Emergency Contact:

"Hello, this is an urgent message from MediPing, the medication reminder service.

Your contact, John Smith, has not responded to their medicine reminder for aspirin.

They were supposed to take their aspirin at 8:00 AM, but have not confirmed taking it.

Please check on John Smith to ensure they are okay and have taken their medication.

If this is an emergency, please call emergency services immediately.

Thank you for being their emergency contact."
```

### 4. WhatsApp Backup Message
If voice call fails or as additional backup:
```
🚨 **URGENT - MediPing Alert** 🚨

Your contact **John Smith** has not responded to their medicine reminder.

📋 **Details:**
💊 Medicine: Aspirin
⏰ Scheduled Time: 8:00 AM
📱 Patient Phone: +919284905505

⚠️ **Action Required:**
Please check on John Smith to ensure they are okay and have taken their medication.

🆘 If this is an emergency, call emergency services immediately.
```

## 🛠️ Technical Implementation

### Voice Call Features
- **Professional Voice**: Uses Twilio's "Alice" voice in English
- **Clear Message**: Repeats key information twice for clarity
- **60-Second Ring**: Calls for up to 60 seconds
- **Status Tracking**: Monitors call completion, busy, no-answer, etc.
- **Privacy**: Calls are not recorded

### Fallback System
1. **Primary**: Voice call to emergency contact
2. **Backup**: WhatsApp message to emergency contact
3. **Logging**: All attempts logged for audit trail

### Environment Handling
- **Development**: Logs what would happen, no actual calls made
- **Production**: Makes real voice calls and sends WhatsApp messages

## 📋 Setup Requirements

### 1. Twilio Configuration
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # For voice calls
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
BASE_URL=https://your-domain.com  # For call status webhooks
```

### 2. Patient Registration
Users must provide emergency contact during registration:
```
REGISTER John Smith | 65 | male | +919876543210
                                    ↑
                              Emergency Contact
```

### 3. Webhook Endpoint
System includes `/call-status` endpoint to track call completion:
```
POST /call-status
- Receives call status updates from Twilio
- Logs call completion, duration, etc.
```

## 🎯 Patient Safety Benefits

### 1. **Medication Adherence**
- Ensures patients don't miss critical medications
- Immediate family/caregiver notification

### 2. **Emergency Detection**
- Can detect if patient is unresponsive due to medical emergency
- Prompts emergency contact to check on patient

### 3. **Peace of Mind**
- Families know they'll be contacted if loved one misses medicine
- Patients feel safer knowing someone will check on them

### 4. **Dual Channel Communication**
- Voice call for immediate attention
- WhatsApp for written record and backup

## 📊 Monitoring & Analytics

### Call Status Tracking
- **Completed**: Emergency contact answered
- **Busy**: Line was busy, WhatsApp backup sent
- **No Answer**: No answer, WhatsApp backup sent
- **Failed**: Technical failure, WhatsApp backup sent

### Logging
```
📞 Emergency call initiated: CA1234567890abcdef
✅ Emergency voice call completed: 45s duration
📱 Backup WhatsApp message sent to +919876543210
```

## 🔧 Customization Options

### Voice Message Language
Currently English, can be extended to support:
- Hindi
- Regional languages
- Custom messages per patient

### Timing Configuration
- Default: 7 minutes before escalation
- Can be customized per patient
- Multiple retry attempts possible

### Emergency Contact Types
- Family members
- Caregivers
- Healthcare providers
- Multiple emergency contacts (future)

## 🚀 Production Deployment

### 1. Set NODE_ENV=live
```env
NODE_ENV=live
```

### 2. Configure Twilio Phone Number
- Purchase Twilio phone number for voice calls
- Configure webhook URL for call status updates

### 3. Test Emergency Flow
1. Register test patient with your emergency number
2. Set medicine reminder
3. Don't respond to reminder
4. Verify voice call is received after 7 minutes

## 📱 User Experience

### For Patients
- Clear warning in reminders: "If you don't respond within 7 minutes, we'll contact your emergency contact"
- Simple responses: "Taken", "Later", "Skip"
- Peace of mind knowing someone will check on them

### For Emergency Contacts
- Professional, clear voice message
- Written WhatsApp backup with all details
- Clear action items: check on patient, call emergency services if needed

## 🔒 Privacy & Security

- **No Call Recording**: Voice calls are not recorded for privacy
- **Secure Data**: Emergency contact info stored securely in Supabase
- **Audit Trail**: All emergency escalations logged for accountability
- **HIPAA Considerations**: System designed with healthcare privacy in mind

This emergency calling system transforms MediPing from a simple reminder service into a comprehensive patient safety platform! 🏥✨
