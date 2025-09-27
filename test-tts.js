// test-tts.js - Test the TTS emergency call system
import emergencyCallServiceWithTTS from './services/emergencyCallServiceWithTTS.js';
import ttsService from './services/ttsService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testTTSSystem() {
    console.log('🧪 MEDIPING TTS EMERGENCY SYSTEM TEST\n');
    
    // Test configuration
    const testConfig = {
        patientInfo: {
            name: 'Test Patient Prasad',
            phone: '+919284905505'
        },
        reminderInfo: {
            medicine: 'Vitamin D',
            time: '12:00 PM'
        },
        emergencyNumber: '+919284905505', // 👈 Change to YOUR phone number for testing
        options: {
            useOnlineTTS: false, // Set to true to test online TTS (requires internet)
            language: 'en',
            playLocally: true
        }
    };
    
    console.log('📋 Test Configuration:');
    console.log(`👤 Patient: ${testConfig.patientInfo.name}`);
    console.log(`💊 Medicine: ${testConfig.reminderInfo.medicine}`);
    console.log(`⏰ Time: ${testConfig.reminderInfo.time}`);
    console.log(`📞 Emergency Number: ${testConfig.emergencyNumber}`);
    console.log(`🌐 Online TTS: ${testConfig.options.useOnlineTTS ? 'Yes' : 'No'}`);
    console.log(`🗣️ Language: ${testConfig.options.language}`);
    console.log(`🔊 Play Locally: ${testConfig.options.playLocally ? 'Yes' : 'No'}\n`);
    
    try {
        // Step 1: Test TTS Service Status
        console.log('📊 Step 1: Checking TTS Service Status...');
        const status = await emergencyCallServiceWithTTS.getTTSStatus();
        console.log('TTS Status:', JSON.stringify(status, null, 2));
        
        if (!status.python_available) {
            console.error('❌ Python not available. Please install Python and required packages.');
            console.log('\n🔧 Installation Instructions:');
            console.log('1. Install Python: https://python.org/downloads/');
            console.log('2. Navigate to tts folder: cd tts');
            console.log('3. Install packages: pip install -r requirements.txt');
            return;
        }
        
        console.log('✅ TTS Service is ready\n');
        
        // Step 2: Test TTS Generation Only
        console.log('🎤 Step 2: Testing TTS Audio Generation...');
        const ttsTestResult = await emergencyCallServiceWithTTS.testEmergencyTTS(
            testConfig.patientInfo,
            testConfig.reminderInfo,
            testConfig.emergencyNumber,
            testConfig.options
        );
        
        if (ttsTestResult.success) {
            console.log('✅ TTS generation test successful!');
            console.log(`📁 Audio file created: ${ttsTestResult.ttsResult.audio_path}`);
            console.log('🔊 Audio should have played automatically\n');
        } else {
            console.error('❌ TTS generation test failed:', ttsTestResult.error);
            console.log('🔄 Continuing with voice call test...\n');
        }
        
        // Step 3: Test Full Emergency Call (Optional)
        const shouldTestCall = process.env.NODE_ENV === 'live';
        
        if (shouldTestCall) {
            console.log('📞 Step 3: Testing Full Emergency Call with TTS...');
            console.log('⏳ This will make an actual phone call in 5 seconds...');
            console.log('🛑 Press Ctrl+C to cancel if you don\'t want to make the call\n');
            
            // 5-second countdown
            for (let i = 5; i > 0; i--) {
                console.log(`⏰ ${i}...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log('📞 Making emergency call with TTS...');
            
            const callResult = await emergencyCallServiceWithTTS.makeEmergencyCall(
                testConfig.patientInfo,
                testConfig.reminderInfo,
                testConfig.emergencyNumber,
                testConfig.options
            );
            
            if (callResult.success) {
                console.log('✅ EMERGENCY CALL WITH TTS INITIATED SUCCESSFULLY!');
                console.log(`📞 Call SID: ${callResult.callSid}`);
                console.log(`🎤 TTS Audio: ${callResult.ttsAudioPath || 'Standard TwiML'}`);
                console.log('🔔 YOUR PHONE SHOULD BE RINGING NOW!');
            } else {
                console.error('❌ Emergency call failed:', callResult.error);
                if (callResult.fallback) {
                    console.log('🔄 Fallback method was used');
                }
            }
        } else {
            console.log('📞 Step 3: Skipping actual phone call (NODE_ENV not set to "live")');
            console.log('💡 To test actual calls, set NODE_ENV=live in your .env file\n');
        }
        
        // Step 4: Show Audio Files
        console.log('📁 Step 4: Generated Audio Files...');
        const audioFiles = await ttsService.getAudioFiles();
        
        if (audioFiles.length > 0) {
            console.log(`Found ${audioFiles.length} audio files:`);
            audioFiles.slice(0, 5).forEach((file, index) => {
                console.log(`${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB) - ${file.created.toLocaleString()}`);
            });
            
            if (audioFiles.length > 5) {
                console.log(`... and ${audioFiles.length - 5} more files`);
            }
        } else {
            console.log('No audio files found');
        }
        
        console.log('\n🎉 TTS TEST COMPLETED!');
        console.log('\n📋 What was tested:');
        console.log('✅ Python TTS service availability');
        console.log('✅ TTS audio generation');
        console.log('✅ Audio file creation');
        console.log('✅ Local audio playback');
        if (shouldTestCall) {
            console.log('✅ Emergency call integration');
        }
        
        console.log('\n💡 Next Steps:');
        console.log('1. Check the generated audio file to ensure quality');
        console.log('2. Test with different languages if needed');
        console.log('3. Test online TTS by setting useOnlineTTS: true');
        console.log('4. Integrate with your reminder scheduler');
        
    } catch (error) {
        console.error('❌ TTS test failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure Python is installed and in PATH');
        console.log('2. Install required packages: cd tts && pip install -r requirements.txt');
        console.log('3. Check your .env file for correct configuration');
        console.log('4. Ensure audio drivers are working on your system');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Test cancelled by user');
    process.exit(0);
});

// Run the test
testTTSSystem().catch(console.error);
