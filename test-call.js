// test-call.js - Simple emergency call test script using MessageBird REST API
import dotenv from 'dotenv';
import emergencyCallService from './services/emergencyCallServiceMessageBirdREST.js';

dotenv.config();

// 🔧 CONFIGURATION - UPDATE THESE VALUES
const TEST_CONFIG = {
    // Change this to YOUR phone number to receive the test call
    emergencyNumber: '+919284905505', // 👈 UPDATE THIS TO YOUR NUMBER
    
    // Test patient info
    patientName: 'Test Patient Prasad',
    medicineName: 'Vitamin D',
    medicineTime: '12:00 PM'
};

/**
 * Create test patient and reminder info
 */
function createTestData() {
    const testPatient = {
        name: TEST_CONFIG.patientName,
        phone: '+919284905505'
    };
    
    const testReminder = {
        medicine: TEST_CONFIG.medicineName,
        time: TEST_CONFIG.medicineTime
    };
    
    return { testPatient, testReminder };
}

/**
 * Make the test emergency call
 */
async function makeTestCall() {
    console.log('🧪 EMERGENCY CALL TEST STARTING...\n');
    
    console.log('📋 Test Configuration:');
    console.log(`📞 Calling: ${TEST_CONFIG.emergencyNumber}`);
    console.log(`👤 Patient: ${TEST_CONFIG.patientName}`);
    console.log(`💊 Medicine: ${TEST_CONFIG.medicineName}`);
    console.log(`⏰ Time: ${TEST_CONFIG.medicineTime}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log('');
    
    // Check if we have required credentials
    if (!process.env.MESSAGEBIRD_API_KEY) {
        console.error('❌ Missing MessageBird credentials in .env file');
        console.log('Please ensure you have:');
        console.log('- MESSAGEBIRD_API_KEY');
        console.log('- MESSAGEBIRD_PHONE_NUMBER (optional)');
        return;
    }
    
    try {
        const { testPatient, testReminder } = createTestData();
        
        console.log('📞 Making test emergency call via MessageBird...');
        console.log('⏳ Please wait for your phone to ring...\n');
        
        const fromNumber = process.env.MESSAGEBIRD_PHONE_NUMBER || '+14155238886';
        
        console.log(`📱 Calling FROM: ${fromNumber}`);
        console.log(`📱 Calling TO: ${TEST_CONFIG.emergencyNumber}`);
        console.log(`🎙️  Provider: MessageBird Voice API`);
        
        const result = await emergencyCallService.makeEmergencyCall(
            testPatient,
            testReminder,
            TEST_CONFIG.emergencyNumber
        );
        
        console.log('\n✅ TEST CALL RESULTS:');
        console.log(`Success: ${result.success}`);
        console.log(`Provider: ${result.provider}`);
        console.log(`Message: ${result.message}`);
        
        if (result.callId) {
            console.log(`Call ID: ${result.callId}`);
            console.log('🔔 YOUR PHONE SHOULD BE RINGING NOW!');
            console.log('🎙️  You should hear the emergency message when you answer');
            
            // Wait a bit and then check call status
            setTimeout(async () => {
                try {
                    const callDetails = await emergencyCallService.getCallDetails(result.callId);
                    if (callDetails) {
                        console.log(`\n📈 Call Status Update: ${callDetails.status}`);
                        if (callDetails.duration) {
                            console.log(`⏱️  Duration: ${callDetails.duration} seconds`);
                        }
                    }
                } catch (error) {
                    console.log('⚠️  Could not fetch call status update');
                }
            }, 15000); // Check after 15 seconds
        }
        
        if (result.error) {
            console.log(`Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ TEST CALL FAILED:');
        console.error(`Error: ${error.message}`);
        console.error(`Code: ${error.code}`);
        
        // Provide specific help based on error types
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
            console.log('\n💡 AUTHENTICATION ERROR:');
            console.log('   Check your MESSAGEBIRD_API_KEY in .env');
            console.log('   Make sure the API key is valid and active');
        } else if (error.message.includes('phone') || error.message.includes('number')) {
            console.log('\n💡 PHONE NUMBER ERROR:');
            console.log('   - Make sure emergency number includes country code (91...)');
            console.log('   - Verify your MessageBird phone number is configured correctly');
            console.log('   - Remove + from phone numbers (MessageBird expects numbers without +)');
        } else if (error.message.includes('balance') || error.message.includes('credit')) {
            console.log('\n💡 INSUFFICIENT BALANCE:');
            console.log('   - Check your MessageBird account balance');
            console.log('   - Add credits to your MessageBird account');
        }
        
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Verify MESSAGEBIRD_API_KEY in .env file');
        console.log('2. Check MessageBird account balance');
        console.log('3. Ensure phone numbers are in correct format (without +)');
        console.log('4. Try with a different test number');
        console.log('5. Check MessageBird dashboard for call logs');
    }
}

// Show instructions and run test
console.log('🚨 MEDIPING EMERGENCY CALL TEST\n');
console.log('⚠️  IMPORTANT: Update TEST_CONFIG.emergencyNumber to YOUR phone number!');
console.log('💰 This will make a real call and may use Twilio credits\n');

if (TEST_CONFIG.emergencyNumber === '+919284905505') {
    console.log('🔴 WARNING: Using default number - please update emergencyNumber in the script!');
}

console.log('Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');

setTimeout(() => {
    makeTestCall();
}, 3000);
