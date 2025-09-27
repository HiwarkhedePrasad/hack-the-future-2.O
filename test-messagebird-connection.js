// test-messagebird-connection.js - Test MessageBird API connection and capabilities
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testMessageBirdConnection() {
    console.log('🧪 Testing MessageBird API Connection...\n');
    
    const apiKey = process.env.MESSAGEBIRD_API_KEY;
    
    if (!apiKey) {
        console.error('❌ MESSAGEBIRD_API_KEY not found in .env file');
        return;
    }
    
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    
    try {
        // Test 1: Check account balance and info
        console.log('📊 Testing account access...');
        const balanceResponse = await axios.get('https://rest.messagebird.com/balance', {
            headers: {
                'Authorization': `AccessKey ${apiKey}`
            }
        });
        
        console.log('✅ Account access successful!');
        console.log(`💰 Balance: €${balanceResponse.data.amount} ${balanceResponse.data.type}`);
        
        // Test 2: Check available services
        console.log('\n🔍 Checking available services...');
        
        // Test Voice API access
        try {
            const voiceResponse = await axios.get('https://voice.messagebird.com/calls', {
                headers: {
                    'Authorization': `AccessKey ${apiKey}`
                }
            });
            console.log('✅ Voice API access: Available');
        } catch (voiceError) {
            console.log('❌ Voice API access: Not available');
            console.log(`   Error: ${voiceError.response?.data?.errors?.[0]?.message || voiceError.message}`);
            console.log('   This might require a different MessageBird plan or setup');
        }
        
        // Test 3: Try SMS API (more commonly available)
        console.log('\n📱 Testing SMS API...');
        try {
            // Just test the endpoint without sending (dry run)
            const smsTest = await axios.post('https://rest.messagebird.com/messages', {
                originator: 'MediPing',
                recipients: '919284905505',
                body: 'Test message - not sent',
                test: true // This prevents actual sending
            }, {
                headers: {
                    'Authorization': `AccessKey ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ SMS API access: Available');
        } catch (smsError) {
            console.log('❌ SMS API access: Limited or not available');
            console.log(`   Error: ${smsError.response?.data?.errors?.[0]?.message || smsError.message}`);
        }
        
        // Test 4: Check account features
        console.log('\n🎯 Account recommendations:');
        console.log('1. For Voice calls: You may need to upgrade your MessageBird plan');
        console.log('2. For SMS alerts: This appears to be available');
        console.log('3. Alternative: Use Twilio for voice calls + MessageBird for SMS');
        
    } catch (error) {
        console.error('❌ MessageBird API connection failed:');
        console.error(`Status: ${error.response?.status}`);
        console.error(`Error: ${error.response?.data?.errors?.[0]?.message || error.message}`);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Authentication failed - check your API key:');
            console.log('1. Make sure you\'re using the Live API key, not Test key');
            console.log('2. Check if the API key is correctly copied');
            console.log('3. Verify your MessageBird account is active');
        } else if (error.response?.status === 403) {
            console.log('\n💡 Access forbidden - account limitations:');
            console.log('1. Your account may not have Voice API access');
            console.log('2. You might need to upgrade your MessageBird plan');
            console.log('3. Contact MessageBird support to enable Voice API');
        }
    }
}

// Run the test
testMessageBirdConnection().catch(console.error);
