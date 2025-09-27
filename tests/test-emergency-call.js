// tests/test-emergency-call.js - Demo script to test emergency voice calling
import dotenv from 'dotenv';
import emergencyCallService from '../services/emergencyCallService.js';

dotenv.config();

/**
 * Demo script to test emergency voice calling functionality
 * This will make a real voice call to test the system
 */
async function testEmergencyCall() {
    console.log('🧪 Starting Emergency Call Test...\n');
    
    // Test patient information
    const testPatient = {
        name: 'Test Patient John',
        phone: '+919284905505'
    };
    
    // Test reminder information  
    const testReminder = {
        medicine: 'Test Vitamin D',
        time: '12:00 PM'
    };
    
    // Emergency contact number (CHANGE THIS TO YOUR TEST NUMBER)
    const emergencyNumber = '+919284905505'; // Replace with your test number
    
    console.log('📋 Test Details:');
    console.log(`👤 Patient: ${testPatient.name}`);
    console.log(`💊 Medicine: ${testReminder.medicine}`);
    console.log(`⏰ Time: ${testReminder.time}`);
    console.log(`🚨 Emergency Contact: ${emergencyNumber}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log('');
    
    if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Currently in DEVELOPMENT mode - no actual call will be made');
        console.log('💡 To test real calls, set NODE_ENV=live in .env file');
        console.log('');
    }
    
    try {
        console.log('📞 Initiating emergency call test...');
        
        const result = await emergencyCallService.makeEmergencyCall(
            testPatient,
            testReminder,
            emergencyNumber
        );
        
        console.log('\n✅ Call Test Results:');
        console.log(`Success: ${result.success}`);
        console.log(`Message: ${result.message}`);
        
        if (result.callSid) {
            console.log(`Call SID: ${result.callSid}`);
            console.log('📱 Check your phone for the incoming call!');
        }
        
        if (result.error) {
            console.log(`Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 20003) {
            console.log('\n💡 Authentication Error - Check your Twilio credentials:');
            console.log('   - TWILIO_ACCOUNT_SID');
            console.log('   - TWILIO_AUTH_TOKEN');
        }
        
        if (error.code === 21212) {
            console.log('\n💡 Phone Number Error - Check:');
            console.log('   - Emergency number format (+country code)');
            console.log('   - Twilio phone number configuration');
        }
    }
    
    console.log('\n🏁 Emergency call test completed!');
}

/**
 * Test the voice message generation
 */
function testVoiceMessage() {
    console.log('\n🎙️  Testing Voice Message Generation...\n');
    
    const testPatient = { name: 'John Smith', phone: '+919284905505' };
    const testReminder = { medicine: 'Aspirin', time: '8:00 AM' };
    
    const twimlMessage = emergencyCallService.createEmergencyVoiceMessage(testPatient, testReminder);
    
    console.log('📝 Generated TwiML Voice Message:');
    console.log('=' .repeat(50));
    console.log(twimlMessage);
    console.log('=' .repeat(50));
    
    // Extract just the text content for readability
    const textContent = twimlMessage
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    console.log('\n🔊 Voice Message (Text Only):');
    console.log('"' + textContent + '"');
}

/**
 * Interactive test menu
 */
async function runTests() {
    console.log('🚨 Emergency Call System Test Suite\n');
    
    // Check environment variables
    console.log('🔧 Environment Check:');
    console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
    console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`TWILIO_WHATSAPP_NUMBER: ${process.env.TWILIO_WHATSAPP_NUMBER || '❌ Missing'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    
    // Test voice message generation (safe)
    testVoiceMessage();
    
    // Ask user if they want to test actual call
    console.log('\n⚠️  WARNING: The next test will make a REAL PHONE CALL');
    console.log('📞 Make sure to update the emergency number in the script to your test number');
    console.log('💰 This will use Twilio credits and may incur charges');
    
    if (process.env.NODE_ENV === 'live') {
        console.log('\n🔴 LIVE MODE DETECTED - Real call will be made!');
        await testEmergencyCall();
    } else {
        console.log('\n🟡 DEV MODE - Only simulation will run');
        await testEmergencyCall();
    }
}

// Run the tests
runTests().catch(console.error);
