// play-emergency-now.js - Immediately play emergency TTS on laptop
import emergencyCallServiceLocalTTS from './services/emergencyCallServiceLocalTTS.js';
import dotenv from 'dotenv';

dotenv.config();

async function playEmergencyNow() {
    console.log('🚨 EMERGENCY ALERT - PLAYING NOW ON LAPTOP! 🚨\n');
    
    const patientInfo = {
        name: 'John Smith',
        phone: '+919284905505'
    };
    
    const reminderInfo = {
        medicine: 'Blood Pressure Medicine',
        time: '8:00 AM'
    };
    
    console.log('📢 EMERGENCY SITUATION:');
    console.log(`👤 Patient: ${patientInfo.name}`);
    console.log(`💊 Missed Medicine: ${reminderInfo.medicine}`);
    console.log(`⏰ Scheduled Time: ${reminderInfo.time}`);
    console.log('🔊 Playing emergency alert on your laptop speakers...\n');
    
    try {
        const result = await emergencyCallServiceLocalTTS.playEmergencyAlertNow(
            patientInfo,
            reminderInfo,
            { useOnlineTTS: false, language: 'en' }
        );
        
        if (result.success) {
            console.log('\n✅ EMERGENCY ALERT PLAYED SUCCESSFULLY!');
            console.log('🔊 The emergency message should have played on your laptop');
            console.log(`📁 Audio saved to: ${result.audio_path}`);
        } else {
            console.error('\n❌ Emergency alert failed:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error playing emergency alert:', error);
    }
}

// Run immediately
playEmergencyNow().catch(console.error);
