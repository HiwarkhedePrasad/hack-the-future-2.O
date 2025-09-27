# 🎤 MediPing TTS (Text-to-Speech) System

A comprehensive text-to-speech system for emergency calls in the MediPing medication reminder service.

## 🌟 Features

- **Dual TTS Engines**: Offline (pyttsx3) and Online (gTTS) support
- **Cross-Platform Audio**: Works on Windows, macOS, and Linux
- **Emergency Message Generation**: Automated emergency call messages
- **Audio File Management**: Automatic cleanup and file management
- **Node.js Integration**: Seamless integration with the main application
- **Fallback System**: Multiple fallback options for reliability

## 🚀 Quick Setup

### 1. Install Python Dependencies
```bash
# Navigate to TTS folder
cd tts

# Install required packages
pip install -r requirements.txt

# Or run the setup script
python setup.py
```

### 2. Test the System
```bash
# Test TTS functionality
npm run test-tts

# Or test Python directly
python tts_service.py --patient-name "John Doe" --medicine "Aspirin" --time "8:00 AM" --play
```

## 📦 Dependencies

### Python Packages
- **pyttsx3**: Offline text-to-speech engine
- **gTTS**: Google Text-to-Speech (online)
- **pygame**: Audio playback
- **playsound**: Backup audio player
- **requests**: HTTP requests for online TTS

### System Requirements
- Python 3.7 or higher
- Audio drivers (for playback)
- Internet connection (for online TTS only)

## 🎯 Usage

### Basic TTS Generation
```javascript
import ttsService from './services/ttsService.js';

const result = await ttsService.generateEmergencyAudio(
    { name: 'John Doe' },
    { medicine: 'Aspirin', time: '8:00 AM' },
    { playImmediately: true }
);
```

### Emergency Call with TTS
```javascript
import emergencyCallServiceWithTTS from './services/emergencyCallServiceWithTTS.js';

const result = await emergencyCallServiceWithTTS.makeEmergencyCall(
    { name: 'John Doe', phone: '+1234567890' },
    { medicine: 'Aspirin', time: '8:00 AM' },
    '+1111111111', // Emergency contact
    { useOnlineTTS: false, language: 'en' }
);
```

### Python Direct Usage
```bash
# Generate and play emergency audio
python tts_service.py \
    --patient-name "John Doe" \
    --medicine "Aspirin" \
    --time "8:00 AM" \
    --play \
    --online

# List available voices
python tts_service.py --list-voices
```

## 🔧 Configuration Options

### TTS Options
- `useOnlineTTS`: Use Google TTS (requires internet)
- `language`: Language code (en, es, fr, de, etc.)
- `playImmediately`: Play audio after generation
- `playLocally`: Play on server (for testing)

### Voice Settings (Offline TTS)
- Speech rate: 150 words per minute
- Volume: 90%
- Voice preference: Female voices (clearer for emergencies)

## 📁 File Structure

```
tts/
├── tts_service.py          # Main Python TTS service
├── setup.py                # Setup and installation script
├── requirements.txt        # Python dependencies
├── audio/                  # Generated audio files
│   ├── emergency_*.mp3     # Emergency audio files
│   └── emergency_*.wav     # Offline TTS audio files
└── README.md              # This file

services/
├── ttsService.js           # Node.js TTS integration
└── emergencyCallServiceWithTTS.js  # Emergency calls with TTS
```

## 🧪 Testing

### Test TTS System
```bash
# Full TTS system test
npm run test-tts

# Test with actual phone calls (set NODE_ENV=live)
NODE_ENV=live npm run test-tts
```

### Test Python Setup
```bash
# Run setup and test script
npm run setup-tts

# Or directly
cd tts && python setup.py
```

### Manual Testing
```bash
# Test offline TTS
python tts_service.py --patient-name "Test" --medicine "Test Med" --time "12:00 PM" --play

# Test online TTS
python tts_service.py --patient-name "Test" --medicine "Test Med" --time "12:00 PM" --play --online

# Test different languages
python tts_service.py --patient-name "Test" --medicine "Test Med" --time "12:00 PM" --play --language es
```

## 🔊 Audio Formats

- **Offline TTS**: WAV format (uncompressed, high quality)
- **Online TTS**: MP3 format (compressed, smaller size)
- **Playback**: Supports both formats across platforms

## 🌍 Language Support

### Supported Languages
- English (en) - Default
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)

### Usage
```javascript
// Spanish emergency message
const result = await ttsService.generateEmergencyAudio(
    patientInfo, 
    reminderInfo, 
    { language: 'es' }
);
```

## 🛠️ Troubleshooting

### Common Issues

#### Python Not Found
```bash
# Windows
python --version
# If not found, install from python.org

# macOS
python3 --version
brew install python3

# Linux
python3 --version
sudo apt install python3 python3-pip
```

#### Audio Playback Issues
```bash
# Windows: Install audio drivers
# macOS: Should work out of the box
# Linux: Install audio packages
sudo apt install alsa-utils pulseaudio
```

#### Package Installation Errors
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Install packages individually
pip install pyttsx3
pip install gtts
pip install pygame
```

#### TTS Engine Initialization Failed
```bash
# Windows: Install SAPI5 voices
# macOS: Use built-in voices
# Linux: Install espeak
sudo apt install espeak espeak-data
```

### Error Messages

#### "No TTS engines available"
- Install pyttsx3 for offline TTS
- Check internet connection for online TTS

#### "Audio playback failed"
- Check audio drivers
- Try different audio players
- Test with system audio

#### "Python process failed"
- Check Python installation
- Verify package installations
- Check file permissions

## 📊 Performance

### Audio Generation Times
- **Offline TTS**: 2-5 seconds (no internet required)
- **Online TTS**: 3-8 seconds (requires internet)
- **File Size**: 200KB-2MB depending on message length

### Resource Usage
- **Memory**: 50-100MB during generation
- **CPU**: Low usage after initialization
- **Storage**: Auto-cleanup after 24 hours

## 🔒 Security & Privacy

- **No Recording**: Emergency calls are not recorded
- **Local Processing**: Offline TTS keeps data local
- **Auto Cleanup**: Audio files deleted after 24 hours
- **No Personal Data**: Only medical reminder info in audio

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=live                    # Enable actual calls
TWILIO_PHONE_NUMBER=+1234567890  # For voice calls
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### Recommended Settings
- Use offline TTS for reliability
- Enable auto-cleanup for storage management
- Monitor TTS service status
- Set up fallback to standard voice calls

## 📈 Monitoring

### TTS Service Status
```javascript
const status = await emergencyCallServiceWithTTS.getTTSStatus();
console.log(status);
```

### Audio File Management
```javascript
// Get audio files
const files = await ttsService.getAudioFiles();

// Cleanup old files
const deletedCount = await ttsService.cleanupOldAudioFiles();
```

## 🤝 Integration

### With Reminder Scheduler
```javascript
// In reminderScheduler.js
import emergencyCallServiceWithTTS from './emergencyCallServiceWithTTS.js';

// Replace standard emergency service
const emergencyResult = await emergencyCallServiceWithTTS.makeEmergencyCall(
    patientInfo, 
    reminderInfo, 
    emergencyNumber
);
```

### With Express Routes
```javascript
// Add TTS status endpoint
app.get('/tts-status', async (req, res) => {
    const status = await emergencyCallServiceWithTTS.getTTSStatus();
    res.json(status);
});
```

## 📞 Emergency Call Flow

1. **Patient misses reminder** → Timeout reached
2. **TTS generation** → Create emergency audio message
3. **Voice call** → Call emergency contact with TTS
4. **Backup message** → Send WhatsApp if call fails
5. **Audio cleanup** → Remove old files automatically

## 🎉 Success Indicators

- ✅ Python TTS service running
- ✅ Audio files generated successfully
- ✅ Emergency calls with custom voice messages
- ✅ Automatic fallback to standard calls
- ✅ WhatsApp backup messages sent
- ✅ Audio cleanup working

Your TTS emergency system is now ready to provide personalized voice messages for critical medication reminders! 🚨🎤
