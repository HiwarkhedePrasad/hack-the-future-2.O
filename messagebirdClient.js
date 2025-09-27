// messagebirdClient.js - MessageBird client configuration
import messagebird from 'messagebird';
import dotenv from 'dotenv';

dotenv.config();

// Initialize MessageBird client
const messageBirdClient = messagebird(process.env.MESSAGEBIRD_API_KEY);

// Debug: Check what's available in the client
console.log('🔍 MessageBird client initialized');
console.log('Available methods:', Object.keys(messageBirdClient));
if (messageBirdClient.voice) {
    console.log('Voice API available:', Object.keys(messageBirdClient.voice));
    if (messageBirdClient.voice.calls) {
        console.log('Voice calls API available:', Object.keys(messageBirdClient.voice.calls));
    }
} else {
    console.log('⚠️  Voice API not found in MessageBird client');
}

export default messageBirdClient;
