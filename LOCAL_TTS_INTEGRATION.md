# 🔊 Local TTS Integration Guide

This guide shows how to integrate the local TTS system that plays emergency alerts directly on your laptop instead of making phone calls.

## 🎯 What This Does

Instead of making phone calls, when an emergency is triggered:
1. **🔊 Plays emergency audio directly on your laptop speakers**
2. **📺 Shows visual alert in console**
3. **📱 Sends WhatsApp backup to emergency contact**
4. **📁 Saves audio file for review**

## 🚀 Quick Integration

### Step 1: Update Your Reminder Scheduler

Replace the emergency call service import:

```javascript
// OLD: services/reminderScheduler.js
import emergencyCallService from "./emergencyCallService.js";

// NEW: services/reminderScheduler.js  
import emergencyCallService from "./emergencyCallServiceLocalTTS.js";

// Update the emergency call method
// OLD:
await emergencyCallService.makeEmergencyCall(patientInfo, reminderInfo, emergencyNumber);

// NEW:
await emergencyCallService.handleEmergency(patientInfo, reminderInfo, emergencyNumber);
```

### Step 2: Test the System

```bash
# Test local TTS emergency system
npm run test-local-tts

# Or play emergency alert immediately
node play-emergency-now.js
```

## 🔊 How It Works

### Emergency Flow:
1. **Patient misses reminder** → 7-minute timeout reached
2. **TTS Generation** → Creates personalized emergency message
3. **Local Playback** → Plays audio on your laptop speakers
4. **Visual Alert** → Shows emergency details in console
5. **WhatsApp Backup** → Sends message to emergency contact
6. **File Storage** → Saves audio for review

### Example Emergency Message:
> "Hello, this is an urgent message from MediPing, the medication reminder service. Your contact, **John Smith**, has not responded to their medicine reminder for **Blood Pressure Medicine**. They were supposed to take their **Blood Pressure Medicine** at **8:00 AM**, but have not confirmed taking it. Please check on **John Smith** to ensure they are okay and have taken their medication..."

## 📺 Visual Alert Example

```
╔══════════════════════════════════════════════════════════════╗
║                    🚨 EMERGENCY ALERT 🚨                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Patient: John Smith                                         ║
║  Medicine: Blood Pressure Medicine                           ║
║  Time: 8:00 AM                                               ║
║  Status: MISSED MEDICATION REMINDER                          ║
║                                                              ║
║  🔊 AUDIO ALERT PLAYING ON LAPTOP                           ║
║  📱 WhatsApp notification sent to emergency contact         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## 🎛️ Configuration Options

```javascript
const options = {
    useOnlineTTS: false,    // Use offline TTS (more reliable)
    language: 'en',         // Language code
    playImmediately: true   // Play on laptop immediately
};

await emergencyCallService.handleEmergency(
    patientInfo, 
    reminderInfo, 
    emergencyNumber, 
    options
);
```

## 🧪 Testing Commands

```bash
# Test full local TTS system
npm run test-local-tts

# Play emergency alert immediately
node play-emergency-now.js

# Test Python TTS directly
cd tts
python tts_service.py --patient-name "Test" --medicine "Test Med" --time "12:00 PM" --play
```

## 🔧 Integration in Your Code

### In reminderScheduler.js:
```javascript
import emergencyCallServiceLocalTTS from "./emergencyCallServiceLocalTTS.js";

// When emergency timeout is reached:
const emergencyResult = await emergencyCallServiceLocalTTS.handleEmergency(
    {
        name: user.UserName,
        phone: user.PhoneNumber
    },
    {
        medicine: reminder.Medicine,
        time: reminder.Time
    },
    user.EmergencyNumber
);

if (emergencyResult.success) {
    console.log('🚨 Emergency alert played on laptop');
    console.log('📱 WhatsApp sent to emergency contact');
}
```

### In Express Routes (Optional):
```javascript
// Add emergency test endpoint
app.post('/test-emergency', async (req, res) => {
    const result = await emergencyCallServiceLocalTTS.playEmergencyAlertNow(
        req.body.patientInfo,
        req.body.reminderInfo
    );
    res.json(result);
});

// Get TTS status
app.get('/tts-status', async (req, res) => {
    const status = await emergencyCallServiceLocalTTS.getTTSStatus();
    res.json(status);
});
```

## 🎵 Audio Settings

The system uses these audio settings:
- **Voice**: Microsoft Zira (clear female voice)
- **Speed**: 150 words per minute
- **Volume**: 90%
- **Format**: WAV (high quality)
- **Duration**: ~45-60 seconds per message

## 📁 File Management

- **Audio Location**: `tts/audio/emergency_*.wav`
- **Auto Cleanup**: Files older than 24 hours are deleted
- **File Size**: ~1.3-1.4 MB per emergency message
- **Naming**: `emergency_PatientName_timestamp.wav`

## 🔊 Volume and Speakers

Make sure:
1. **Laptop speakers are ON**
2. **Volume is at reasonable level**
3. **No headphones blocking speakers**
4. **Audio drivers are working**

Test with: `node play-emergency-now.js`

## 🌍 Multi-Language Support

```javascript
// Spanish emergency alert
await emergencyCallService.handleEmergency(
    patientInfo, 
    reminderInfo, 
    emergencyNumber,
    { language: 'es' }
);

// French emergency alert
await emergencyCallService.handleEmergency(
    patientInfo, 
    reminderInfo, 
    emergencyNumber,
    { language: 'fr' }
);
```

## 📊 Monitoring

```javascript
// Check TTS status
const status = await emergencyCallService.getTTSStatus();

// Get recent emergency audio files
const files = await emergencyCallService.getEmergencyAudioFiles();

// Cleanup old files
const deletedCount = await emergencyCallService.cleanupTTSFiles();
```

## 🎯 Benefits of Local TTS

✅ **Immediate Alert**: Plays instantly on your laptop  
✅ **No Phone Costs**: No Twilio voice call charges  
✅ **Always Available**: Works offline  
✅ **Visual + Audio**: Both console alerts and voice  
✅ **WhatsApp Backup**: Still notifies emergency contact  
✅ **File Storage**: Keep audio for review  
✅ **Customizable**: Adjust voice, speed, language  

## 🔄 Rollback

To go back to phone calls:
```javascript
// Change back to phone call service
import emergencyCallService from "./emergencyCallService.js";
```

## ✅ Integration Checklist

- [ ] Python TTS packages installed
- [ ] Local TTS test successful (`npm run test-local-tts`)
- [ ] Laptop speakers working
- [ ] Updated reminder scheduler import
- [ ] Changed method from `makeEmergencyCall` to `handleEmergency`
- [ ] WhatsApp configuration working
- [ ] Audio files being generated in `tts/audio/`

## 🎉 You're Ready!

Your emergency system now plays alerts directly on your laptop while still sending WhatsApp backups to emergency contacts. Perfect for monitoring medication adherence in real-time! 🚨🔊📱
