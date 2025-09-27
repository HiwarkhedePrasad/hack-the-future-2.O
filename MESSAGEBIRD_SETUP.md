# 📞 MessageBird Voice Calls Setup Guide

## Overview
Your emergency calling system now uses **MessageBird** for voice calls instead of Twilio. MessageBird offers excellent voice quality and global coverage for emergency calls.

## 🔧 Setup Steps

### 1. Get MessageBird Account
1. Go to [MessageBird.com](https://messagebird.com)
2. Sign up for an account
3. Verify your account and add credits

### 2. Get API Key
1. Login to MessageBird Dashboard
2. Go to **Developers** → **API Access**
3. Copy your **Live API Key**
4. Add it to your `.env` file:
   ```env
   MESSAGEBIRD_API_KEY=your_actual_api_key_here
   ```

### 3. Get Phone Number (Optional)
1. In MessageBird Dashboard, go to **Phone Numbers**
2. Buy a phone number for your country
3. Add it to `.env` (without + sign):
   ```env
   MESSAGEBIRD_PHONE_NUMBER=14155238886
   ```

### 4. Install Dependencies
```bash
npm install messagebird
```

## 📋 Complete .env Configuration

```env
# Twilio (for WhatsApp only)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# MessageBird (for Voice Calls)
MESSAGEBIRD_API_KEY=your_messagebird_api_key
MESSAGEBIRD_PHONE_NUMBER=14155238886

# Other settings
NODE_ENV=live
BASE_URL=https://your-domain.com
```

## 🧪 Testing

### Run the Test Script
```bash
npm run test-call
```

### What the Test Does
1. Makes a real voice call using MessageBird
2. Plays emergency message about patient not responding
3. Sends WhatsApp backup message via Twilio
4. Shows call status and duration

### Expected Voice Message
```
"Hello, this is an urgent message from MediPing, 
the medication reminder service.

Your contact, Test Patient Prasad, has not responded 
to their medicine reminder for Vitamin D.

They were supposed to take their Vitamin D at 12:00 PM, 
but have not confirmed taking it.

Please check on Test Patient Prasad to ensure they are 
okay and have taken their medication..."
```

## 🔄 How It Works

### Emergency Escalation Flow
1. **Patient misses reminder** → 7-minute timer starts
2. **Timer expires** → MessageBird voice call initiated
3. **Voice call made** → Professional emergency message played
4. **WhatsApp backup** → Twilio sends written message
5. **Status tracking** → Call completion monitored

### MessageBird Features Used
- **Voice API**: For making calls
- **Text-to-Speech**: Female voice, English
- **Call Flow**: Structured message with pause
- **Webhooks**: Status updates to your server
- **No Recording**: Privacy-compliant

## 💰 Pricing (Approximate)
- **Voice calls to India**: ~$0.02-0.05 per minute
- **Voice calls to US/EU**: ~$0.01-0.03 per minute
- **WhatsApp backup**: ~$0.005 per message (via Twilio)

## 🚨 Production Deployment

### 1. Update Environment
```env
NODE_ENV=live
MESSAGEBIRD_API_KEY=live_api_key_here
BASE_URL=https://your-production-domain.com
```

### 2. Configure Webhooks
MessageBird will send call status updates to:
```
POST https://your-domain.com/messagebird-call-status
```

### 3. Test Emergency Flow
1. Set a medicine reminder
2. Don't respond to WhatsApp reminder
3. Wait 7 minutes
4. Emergency contact should receive voice call

## 🔧 Troubleshooting

### ❌ Authentication Error
```
Check MESSAGEBIRD_API_KEY in .env
Make sure it's the Live API key, not Test key
```

### ❌ Phone Number Error
```
Remove + from phone numbers (MessageBird format)
Example: 919284905505 (not +919284905505)
```

### ❌ Insufficient Balance
```
Add credits to your MessageBird account
Check account balance in dashboard
```

### ❌ Call Not Connecting
```
Verify destination number format
Check MessageBird call logs in dashboard
Ensure number can receive calls
```

## 📊 Monitoring

### Call Status Updates
Your server receives webhooks with:
- `answered`: Call was answered
- `busy`: Line was busy
- `no-answer`: No one answered
- `failed`: Call failed
- `completed`: Call completed successfully

### Logs to Monitor
```
📞 MessageBird call initiated: mb_call_123456
✅ Emergency voice call completed: 45s duration
📱 Backup WhatsApp message sent to +919876543210
```

## 🎯 Benefits of MessageBird

✅ **Better Voice Quality**: Crystal clear emergency messages  
✅ **Global Coverage**: Reliable calls worldwide  
✅ **Cost Effective**: Competitive pricing  
✅ **Easy Integration**: Simple API  
✅ **Webhook Support**: Real-time status updates  
✅ **Privacy Compliant**: No call recording  

## 🔄 Hybrid System

Your system now uses:
- **MessageBird**: Voice calls for emergencies
- **Twilio**: WhatsApp messages for reminders and backup
- **Best of Both**: Reliability and coverage

This gives you the best voice calling experience for critical emergency situations! 📞🚨
