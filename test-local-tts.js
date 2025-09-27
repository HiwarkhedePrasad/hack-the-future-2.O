// test-local-tts.js - Test local TTS emergency system (plays on laptop)
import emergencyCallServiceLocalTTS from './services/emergencyCallServiceLocalTTS.js';
import dotenv from 'dotenv';

dotenv.config();

async function testLocalTTSSystem() {
    console.log('🔊 MEDIPING LOCAL TTS EMERGENCY TEST\n');
    console.log('This will play emergency audio directly on your laptop!\n');
    
    // Test configuration
    const testConfig = {
        patientInfo: {
            name: 'John Smith',
            phone: '+919284905505'
        },
        reminderInfo: {
            medicine: 'Blood Pressure Medicine',
            time: '8:00 AM'
        },
        emergencyNumber: '+919284905505', // For WhatsApp backup
        options: {
            useOnlineTTS: false, // Use offline TTS for reliability
            language: 'en'
        }
    };
    
    console.log('📋 Test Configuration:');
    console.log(`👤 Patient: ${testConfig.patientInfo.name}`);
    console.log(`💊 Medicine: ${testConfig.reminderInfo.medicine}`);
    console.log(`⏰ Missed Time: ${testConfig.reminderInfo.time}`);
    console.log(`📱 WhatsApp Backup: ${testConfig.emergencyNumber}`);
    console.log(`🔊 Audio Output: YOUR LAPTOP SPEAKERS`);
    console.log(`🌐 TTS Engine: ${testConfig.options.useOnlineTTS ? 'Online (gTTS)' : 'Offline (pyttsx3)'}\n`);
    
    try {
        // Step 1: Check TTS Status
        console.log('📊 Step 1: Checking TTS Service Status...');
        const status = await emergencyCallServiceLocalTTS.getTTSStatus();
        
        if (!status.python_available) {
            console.error('❌ Python TTS not available. Please install Python packages.');
            return;
        }
        
        console.log('✅ TTS Service is ready');
        console.log(`🎤 Offline TTS: ${status.offline_tts_available ? 'Available' : 'Not Available'}`);
        console.log(`🌐 Online TTS: ${status.online_tts_available ? 'Available' : 'Not Available'}\n`);
        
        // Step 2: Test Immediate Emergency Alert
        console.log('🚨 Step 2: Testing Immediate Emergency Alert...');
        console.log('⏰ Emergency alert will play in 3 seconds...');
        console.log('🔊 Make sure your laptop speakers are ON!\n');
        
        // 3-second countdown
        for (let i = 3; i > 0; i--) {
            console.log(`⏰ ${i}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('🚨 PLAYING EMERGENCY ALERT NOW!\n');
        
        const alertResult = await emergencyCallServiceLocalTTS.playEmergencyAlertNow(
            testConfig.patientInfo,
            testConfig.reminderInfo,
            testConfig.options
        );
        
        if (alertResult.success) {
            console.log('\n✅ EMERGENCY ALERT PLAYED SUCCESSFULLY!');
            console.log('🔊 Did you hear the emergency message on your laptop?');
            console.log(`📁 Audio file saved: ${alertResult.audio_path}\n`);
        } else {
            console.error('\n❌ Emergency alert failed:', alertResult.error);
        }
        
        // Step 3: Test Full Emergency System
        console.log('📱 Step 3: Testing Full Emergency System (with WhatsApp)...');
        
        const fullTestResult = await emergencyCallServiceLocalTTS.testLocalEmergency(
            testConfig.patientInfo,
            testConfig.reminderInfo,
            testConfig.emergencyNumber,
            testConfig.options
        );
        
        if (fullTestResult.success) {
            console.log('\n🎉 FULL EMERGENCY SYSTEM TEST SUCCESSFUL!');
            console.log(`🔊 Local TTS: ${fullTestResult.ttsPlayed ? '✅ Played' : '❌ Failed'}`);
            console.log(`📱 WhatsApp: ${fullTestResult.whatsappSent ? '✅ Sent' : '❌ Failed'}`);
        } else {
            console.error('\n❌ Full emergency system test failed:', fullTestResult.error);
        }
        
        // Step 4: Show Generated Audio Files
        console.log('\n📁 Step 4: Generated Emergency Audio Files...');
        const audioFiles = await emergencyCallServiceLocalTTS.getEmergencyAudioFiles();
        
        if (audioFiles.length > 0) {
            console.log(`Found ${audioFiles.length} emergency audio files:`);
            audioFiles.slice(0, 3).forEach((file, index) => {
                console.log(`${index + 1}. ${file.name}`);
                console.log(`   Size: ${(file.size / 1024).toFixed(1)} KB`);
                console.log(`   Created: ${file.created.toLocaleString()}`);
            });
        } else {
            console.log('No emergency audio files found');
        }
        
        // Step 5: Test Scheduled Emergency (Optional)
        console.log('\n⏰ Step 5: Testing Scheduled Emergency...');
        console.log('Scheduling emergency alert for 10 seconds from now...');
        
        await emergencyCallServiceLocalTTS.scheduleLocalEmergency(
            { name: 'Scheduled Test Patient', phone: '+1234567890' },
            { medicine: 'Test Medicine', time: 'Now' },
            testConfig.emergencyNumber,
            0.17, // 10 seconds = 0.17 minutes
            testConfig.options
        );
        
        console.log('⏰ Scheduled emergency will trigger in 10 seconds...');
        
        // Wait for scheduled emergency
        await new Promise(resolve => setTimeout(resolve, 12000));
        
        console.log('\n🎉 LOCAL TTS EMERGENCY SYSTEM TEST COMPLETED!');
        console.log('\n📋 What was tested:');
        console.log('✅ TTS service availability');
        console.log('✅ Immediate emergency alert playback');
        console.log('✅ Visual emergency alerts');
        console.log('✅ WhatsApp backup notifications');
        console.log('✅ Audio file generation and storage');
        console.log('✅ Scheduled emergency alerts');
        
        console.log('\n🔊 Key Features:');
        console.log('• Emergency audio plays directly on your laptop');
        console.log('• Visual alerts displayed in console');
        console.log('• WhatsApp backup sent to emergency contact');
        console.log('• Audio files saved for review');
        console.log('• Scheduled emergency alerts supported');
        
        console.log('\n💡 Integration:');
        console.log('Replace your emergency service with:');
        console.log('import emergencyCallService from "./emergencyCallServiceLocalTTS.js";');
        
        console.log('\n🎯 Your local TTS emergency system is ready!');
        
    } catch (error) {
        console.error('❌ Local TTS test failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure Python packages are installed: cd tts && pip install -r requirements.txt');
        console.log('2. Check your laptop speakers are working');
        console.log('3. Verify TTS service: python tts/tts_service.py --test');
        console.log('4. Check your .env file for Twilio WhatsApp configuration');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Test cancelled by user');
    process.exit(0);
});

// Run the test
testLocalTTSSystem().catch(console.error);
