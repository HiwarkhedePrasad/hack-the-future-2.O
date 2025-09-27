# 🎤 MediPing Advanced Voice System Guide

Complete offline voice-to-voice interaction system for villages without internet connectivity, with GSM module support for SMS and voice calls.

## 🌟 System Overview

This advanced voice system enables complete medication management through voice commands, designed specifically for rural areas with limited internet connectivity.

### 🎯 Key Features

- **🗣️ Complete Voice Interaction** - Registration, medicine management, reminders
- **📱 Offline Operation** - Works without internet using local speech recognition
- **📡 GSM Module Support** - SMS and voice calls through GSM module
- **🗄️ Local Database** - SQLite database for offline data storage
- **⏰ Automatic Reminders** - Background service for medication reminders
- **🚨 Emergency Alerts** - Automatic emergency contacts for missed medications
- **🌍 Multi-language Support** - Voice interaction in multiple languages
- **🔄 Real-time Monitoring** - SMS monitoring and response handling

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
# Install Python voice dependencies
npm run setup-voice

# Or manually
cd voice
pip install -r requirements.txt
```

### 2. Test the System
```bash
# Test voice system components
npm run test-voice

# Install dependencies if needed
npm run install-voice-deps
```

### 3. Start Voice System
```bash
# Start interactive voice system
npm run start-voice-system

# Or with GSM disabled
node test-voice-system.js --start-system --no-gsm
```

## 📁 System Architecture

```
voice/
├── voice_interaction_system.py    # Core voice interaction system
├── gsm_module.py                   # GSM module integration
├── integrated_voice_system.py     # Complete integrated system
├── requirements.txt                # Python dependencies
├── mediping_offline.db            # SQLite database (auto-created)
└── audio/                          # Generated audio files

services/
└── voiceSystemService.js           # Node.js integration service

test-voice-system.js                # Test and control script
```

## 🎤 Voice Commands

### Main Menu Commands
- **"register"** - Register new user
- **"login"** - Login with phone number
- **"add medicine"** - Add new medicine
- **"check reminders"** - View active reminders
- **"took medicine"** - Mark medicine as taken
- **"emergency test"** - Test emergency system
- **"gsm status"** - Check GSM module status
- **"send sms"** - Send test SMS
- **"system status"** - Check system status
- **"help"** - Show help menu
- **"exit"** - Quit system

### Registration Process
1. System asks for full name
2. System asks for phone number (digit by digit)
3. System asks for age
4. System asks for emergency contact
5. System confirms details
6. User says "yes" to confirm

### Medicine Addition Process
1. System asks for medicine name
2. System asks for dosage
3. System asks for frequency (times per day)
4. System asks for each dose time
5. System asks for duration (days)
6. System confirms details
7. User says "yes" to confirm

## 📡 GSM Module Integration

### Supported GSM Modules
- SIM800L, SIM900A, SIM7600, etc.
- Any AT command compatible GSM module
- USB or Serial connection

### GSM Features
- **📱 SMS Sending** - Medication reminders via SMS
- **📞 Voice Calls** - Emergency voice calls
- **📨 SMS Monitoring** - Incoming SMS processing
- **📶 Signal Monitoring** - Network status checking
- **🆘 Emergency SMS** - Automatic emergency alerts

### GSM Setup
1. Connect GSM module to COM port (e.g., COM3)
2. Insert active SIM card
3. Connect antenna
4. Configure port in system:
   ```bash
   node test-voice-system.js --gsm-port COM3
   ```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `name` - Full name
- `phone` - Phone number (unique)
- `age` - Age
- `language` - Preferred language
- `emergency_contact` - Emergency contact number
- `created_at` - Registration timestamp

### Medicines Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `medicine_name` - Medicine name
- `dosage` - Dosage information
- `frequency` - Times per day
- `time_slots` - JSON array of times
- `start_date` - Start date
- `end_date` - End date
- `notes` - Additional notes

### Reminders Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `medicine_id` - Foreign key to medicines
- `reminder_time` - Time for reminder
- `status` - active/inactive
- `last_taken` - Last taken timestamp

### Voice Interactions Log
- `id` - Primary key
- `user_id` - Foreign key to users
- `interaction_type` - Type of interaction
- `user_input` - What user said
- `system_response` - System response
- `timestamp` - Interaction time

## ⚡ Background Services

### Reminder Service
- Runs every minute
- Checks for due medication reminders
- Sends voice alerts and SMS
- Schedules emergency checks

### SMS Monitor Service
- Monitors incoming SMS every 30 seconds
- Processes medication confirmations
- Handles emergency SMS
- Auto-deletes processed messages

### Emergency Alert System
- Triggers 7 minutes after missed medication
- Sends emergency SMS to contact
- Makes emergency voice call
- Logs all emergency actions

## 🌍 Multi-Language Support

### Supported Languages
- English (en) - Default
- Hindi (hi)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)

### Language Configuration
```python
# In voice system
self.language = "hi"  # Set to Hindi
```

## 🧪 Testing

### Test Voice System
```bash
# Test all components
npm run test-voice

# Expected output:
# ✅ Python Available: YES
# ✅ Voice System Files: YES
# ✅ COM Ports Detected: 3
# ✅ GSM Module Test: PASSED/FAILED
# ✅ Database: EXISTS/WILL BE CREATED
```

### Test GSM Module
```bash
# Test GSM module specifically
cd voice
python integrated_voice_system.py --test-gsm --gsm-port COM3
```

### Test Voice Interaction
```bash
# Start interactive voice system
npm run start-voice-system

# Follow voice prompts:
# 1. Say "register" to create account
# 2. Say "add medicine" to add medication
# 3. Say "check reminders" to view schedule
```

## 🔧 Configuration

### Voice System Settings
```python
# In voice_interaction_system.py
class VoiceInteractionSystem:
    def __init__(self):
        self.language = "en"           # Default language
        self.offline_mode = True       # Offline operation
        self.auto_reminders_enabled = True  # Background reminders
```

### GSM Settings
```python
# In gsm_module.py
class GSMModule:
    def __init__(self, port='COM3', baudrate=9600, timeout=10):
        self.port = port               # COM port
        self.baudrate = baudrate       # Baud rate
        self.timeout = timeout         # Command timeout
```

### TTS Settings
```python
# In voice system
self.tts_engine.setProperty('rate', 140)    # Speech rate
self.tts_engine.setProperty('volume', 0.9)  # Volume level
```

## 🚨 Emergency System

### Emergency Trigger Conditions
1. Patient misses medication reminder
2. No response within 7 minutes
3. No SMS confirmation received

### Emergency Actions
1. **Voice Alert** - Local emergency announcement
2. **Emergency SMS** - Detailed SMS to emergency contact
3. **Emergency Call** - Voice call to emergency contact
4. **Database Log** - Record emergency event

### Emergency SMS Format
```
URGENT - MediPing Alert

Patient: John Smith
Medicine: Blood Pressure Medicine
Scheduled Time: 8:00 AM
Status: MISSED MEDICATION

Please check on John Smith immediately.

If emergency, call 108.

- MediPing System
```

## 📊 Monitoring and Logs

### System Status Monitoring
```javascript
// Check voice system status
const status = await voiceSystemService.getVoiceSystemStatus();

// Check GSM status
const gsmStatus = await voiceSystemService.testGSMModule();

// Check database info
const dbInfo = await voiceSystemService.getDatabaseInfo();
```

### Voice Interaction Logs
All voice interactions are logged in the database:
- User input (speech-to-text)
- System responses
- Interaction types
- Timestamps

### GSM Communication Logs
- SMS sent/received
- Voice calls made
- Network status changes
- Signal strength monitoring

## 🔄 Integration with Main System

### Node.js Integration
```javascript
import voiceSystemService from './services/voiceSystemService.js';

// Start voice system
const result = await voiceSystemService.startVoiceSystem({
    gsmPort: 'COM3',
    enableGSM: true
});

// Send commands
await voiceSystemService.sendCommand('check_reminders');

// Stop system
await voiceSystemService.stopVoiceSystem();
```

### Database Synchronization
```javascript
// Sync offline database with main system
// (Implementation depends on your main database)
```

## 🛠️ Troubleshooting

### Common Issues

#### Voice Recognition Not Working
```bash
# Check microphone permissions
# Install speech recognition packages
pip install SpeechRecognition pyaudio
```

#### GSM Module Not Connecting
```bash
# Check COM port
# Verify SIM card is active
# Check power supply
# Test with AT commands
```

#### Database Errors
```bash
# Check file permissions
# Verify SQLite installation
# Check disk space
```

#### TTS Not Working
```bash
# Install TTS packages
pip install pyttsx3
# Check audio drivers
# Test speakers/headphones
```

### Error Messages

#### "Speech recognition not available"
- Install: `pip install SpeechRecognition`
- Install: `pip install pyaudio`
- Check microphone permissions

#### "GSM module not connected"
- Check COM port configuration
- Verify GSM module power
- Test SIM card in phone first

#### "Database connection failed"
- Check file permissions
- Verify SQLite installation
- Check available disk space

## 🎯 Production Deployment

### Village Deployment Setup
1. **Hardware Requirements**
   - Computer/Raspberry Pi with microphone and speakers
   - GSM module with antenna
   - Active SIM card with SMS/voice plan
   - Stable power supply

2. **Software Setup**
   - Install Python 3.7+
   - Install voice system dependencies
   - Configure GSM module
   - Test all components

3. **User Training**
   - Train village health workers
   - Create voice command reference cards
   - Test with sample patients
   - Establish emergency procedures

### Maintenance
- Daily: Check system status and logs
- Weekly: Test GSM connectivity
- Monthly: Database backup
- Quarterly: Update dependencies

## 📈 Performance Metrics

### Expected Performance
- **Voice Recognition**: 85-95% accuracy (quiet environment)
- **TTS Quality**: Clear, understandable speech
- **SMS Delivery**: 95%+ success rate
- **Emergency Response**: <30 seconds
- **Database Operations**: <1 second per query

### Optimization Tips
- Use quiet environment for voice recognition
- Ensure strong GSM signal
- Regular database maintenance
- Monitor system resources

## 🎉 Success Indicators

- ✅ Users can register via voice commands
- ✅ Medicines added through voice interaction
- ✅ Automatic reminders working
- ✅ SMS notifications sent successfully
- ✅ Emergency alerts functioning
- ✅ Database operations completing
- ✅ GSM module communicating properly
- ✅ Voice recognition understanding commands

Your advanced voice system is now ready to provide complete medication management for villages without internet connectivity! 🎤📱🏥
