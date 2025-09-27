# 🔗 TTS Integration Guide

This guide shows how to integrate the new TTS system with your existing emergency call system.

## 🚀 Quick Integration

### Step 1: Update Your Reminder Scheduler

Replace the emergency call service import in your reminder scheduler:

```javascript
// OLD: services/reminderScheduler.js
import emergencyCallService from "./emergencyCallService.js";

// NEW: services/reminderScheduler.js  
import emergencyCallService from "./emergencyCallServiceWithTTS.js";
```

That's it! The new service is a drop-in replacement with TTS capabilities.

### Step 2: Optional TTS Configuration

You can customize TTS behavior by passing options:

```javascript
// In your emergency call logic
const emergencyResult = await emergencyCallService.makeEmergencyCall(
    patientInfo,
    reminderInfo, 
    emergencyNumber,
    {
        useOnlineTTS: false,    // Use offline TTS (more reliable)
        language: 'en',         // Language code
        playLocally: false      // Don't play on server
    }
);
```

## 🔧 Setup Instructions

### 1. Install Python Dependencies
```bash
# Navigate to your project root
cd /path/to/your/mediping/project

# Install TTS dependencies
cd tts
pip install -r requirements.txt

# Test the installation
python setup.py
```

### 2. Test TTS System
```bash
# Test TTS functionality
npm run test-tts

# Test with actual calls (optional)
NODE_ENV=live npm run test-tts
```

### 3. Update Your Environment
No additional environment variables needed! The TTS system uses your existing Twilio configuration.

## 📋 What Changes

### Before (Standard Emergency Calls)
1. Patient misses reminder
2. Standard Twilio voice call with TwiML
3. WhatsApp backup message

### After (TTS Emergency Calls)  
1. Patient misses reminder
2. **Generate personalized TTS audio**
3. Enhanced voice call with custom message
4. **Local audio playback for monitoring**
5. WhatsApp backup message
6. **Automatic audio file cleanup**

## 🎯 Benefits

- **Personalized Messages**: Each call uses patient's actual name and medicine
- **Better Clarity**: High-quality TTS voices optimized for emergencies
- **Offline Capability**: Works without internet using local TTS
- **Automatic Fallback**: Falls back to standard calls if TTS fails
- **Audio Monitoring**: Generated audio files for quality assurance
- **Multi-language Support**: Emergency calls in different languages

## 🧪 Testing Your Integration

### Test Emergency Flow
```javascript
// Create a test reminder that triggers emergency call
const testReminder = await MedicineReminder.create({
    UserID: testUser.UserID,
    Medicine: "Test Medicine",
    Time: "12:00", // Set to current time + 1 minute
    ReminderType: "daily"
});

// Wait for emergency timeout (7 minutes)
// Emergency call with TTS should trigger automatically
```

### Manual TTS Test
```bash
# Test TTS generation only
npm run test-tts

# Test with your actual phone number
# Edit test-tts.js and change emergencyNumber to your number
```

## 🔄 Rollback Plan

If you need to rollback to the standard system:

```javascript
// Change back to standard service
import emergencyCallService from "./emergencyCallService.js";
```

The TTS files won't interfere with the standard system.

## 📊 Monitoring TTS System

### Check TTS Status
```javascript
// Add to your monitoring endpoints
app.get('/tts-status', async (req, res) => {
    const status = await emergencyCallService.getTTSStatus();
    res.json(status);
});
```

### Audio File Management
```javascript
// Cleanup old audio files (run daily)
const deletedCount = await emergencyCallService.cleanupTTSFiles();
console.log(`Cleaned up ${deletedCount} old audio files`);
```

## 🚨 Emergency Call Examples

### Standard Call (Before)
> "Hello, this is an urgent message from MediPing. Your contact has not responded to their medicine reminder..."

### TTS Call (After)  
> "Hello, this is an urgent message from MediPing. Your contact, **John Smith**, has not responded to their medicine reminder for **Blood Pressure Medicine**. They were supposed to take their **Blood Pressure Medicine** at **8:00 AM**..."

## 🌍 Multi-Language Support

```javascript
// Spanish emergency call
await emergencyCallService.makeEmergencyCall(
    patientInfo,
    reminderInfo,
    emergencyNumber,
    { language: 'es' }
);

// French emergency call  
await emergencyCallService.makeEmergencyCall(
    patientInfo,
    reminderInfo,
    emergencyNumber,
    { language: 'fr' }
);
```

## 🔧 Troubleshooting Integration

### TTS Not Working
1. Check Python installation: `python --version`
2. Install dependencies: `cd tts && pip install -r requirements.txt`
3. Test TTS service: `npm run test-tts`

### Audio Issues
1. Check audio drivers on your system
2. Test with different TTS engines (online vs offline)
3. Check generated audio files in `tts/audio/` folder

### Call Issues
1. TTS system falls back to standard calls automatically
2. Check Twilio configuration (same as before)
3. WhatsApp backup still works as before

## 📈 Performance Impact

- **Minimal**: TTS generation adds 2-5 seconds to emergency call setup
- **Fallback**: If TTS fails, standard call happens immediately  
- **Storage**: Audio files auto-cleanup after 24 hours
- **Memory**: ~50MB during TTS generation, minimal at rest

## ✅ Integration Checklist

- [ ] Python installed and working
- [ ] TTS dependencies installed (`pip install -r requirements.txt`)
- [ ] TTS test successful (`npm run test-tts`)
- [ ] Updated reminder scheduler import
- [ ] Tested emergency call flow
- [ ] Verified fallback to standard calls
- [ ] Audio cleanup working
- [ ] Monitoring endpoints added (optional)

## 🎉 You're Ready!

Your emergency call system now has personalized TTS capabilities while maintaining all existing functionality and reliability! 

The system will automatically:
- ✅ Generate personalized emergency messages
- ✅ Fall back to standard calls if needed
- ✅ Send WhatsApp backups as before
- ✅ Clean up audio files automatically
- ✅ Work in multiple languages

Your patients' emergency contacts will now receive much more informative and personalized emergency calls! 🚨🎤
