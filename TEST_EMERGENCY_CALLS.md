# 🧪 Testing Emergency Voice Calls

## Quick Test Setup

### 1. Update Test Phone Number
Edit `test-call.js` and change this line:
```javascript
emergencyNumber: '+919284905505', // 👈 Change to YOUR phone number
```

### 2. Make Sure You Have a Twilio Phone Number
Check your `.env` file has:
```env
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number for voice calls
```

If you don't have `TWILIO_PHONE_NUMBER`, the script will try to use your WhatsApp number.

### 3. Run the Test
```bash
npm run test-call
```

## What Should Happen

1. **Script starts** → Shows test configuration
2. **3-second countdown** → Time to cancel if needed
3. **Call initiated** → Your phone should ring
4. **Answer the call** → You'll hear the emergency message
5. **Voice message plays**:
   ```
   "Hello, this is an urgent TEST message from MediPing, 
   the medication reminder service.
   
   Your contact, Test Patient Prasad, has not responded 
   to their medicine reminder for Vitamin D..."
   ```

## Expected Console Output

```
🚨 MEDIPING EMERGENCY CALL TEST

📋 Test Configuration:
📞 Calling: +919876543210
👤 Patient: Test Patient Prasad
💊 Medicine: Vitamin D
⏰ Time: 12:00 PM
🌍 Environment: live

📞 Making test emergency call...
⏳ Please wait for your phone to ring...

✅ TEST CALL INITIATED SUCCESSFULLY!
📞 Call SID: CA1234567890abcdef
📱 Status: queued

🔔 YOUR PHONE SHOULD BE RINGING NOW!
```

## Troubleshooting

### ❌ Authentication Error (Code 20003)
```
Check your .env file:
- TWILIO_ACCOUNT_SID=your_account_sid
- TWILIO_AUTH_TOKEN=your_auth_token
```

### ❌ Phone Number Error (Code 21212)
```
- Make sure emergency number has country code: +919876543210
- Verify the number can receive calls
```

### ❌ Invalid From Number (Code 21614)
```
- Check TWILIO_PHONE_NUMBER in .env
- Make sure the number is verified in Twilio console
- Try using your WhatsApp number without 'whatsapp:' prefix
```

### ❌ No Phone Ringing
```
- Check your phone signal
- Verify the number format
- Check Twilio account balance
- Try a different test number
```

## Test in Different Modes

### Development Mode (Safe)
```env
NODE_ENV=development
```
- Only logs what would happen
- No actual calls made
- Good for testing logic

### Live Mode (Real Calls)
```env
NODE_ENV=live
```
- Makes actual voice calls
- Uses Twilio credits
- Tests the complete system

## Advanced Testing

### Test the Complete Emergency Flow
1. Set a medicine reminder for yourself
2. Don't respond to the WhatsApp reminder
3. Wait 7 minutes
4. Your emergency contact should get a voice call

### Test Call Status Webhook
The system includes a `/call-status` endpoint that receives updates from Twilio about call completion, duration, etc.

## Cost Considerations

- **Voice calls**: ~$0.01-0.05 per minute depending on destination
- **WhatsApp messages**: ~$0.005 per message
- **Test calls**: Usually complete in under 1 minute

## Production Deployment

Once testing is successful:
1. Set `NODE_ENV=live` in production
2. Configure proper webhook URLs
3. Set up monitoring for failed calls
4. Test with real emergency contacts

## Emergency Call Features Tested

✅ **Voice Quality**: Clear, professional message  
✅ **Message Content**: Patient name, medicine, time  
✅ **Call Duration**: ~30-45 seconds  
✅ **Fallback**: WhatsApp backup if call fails  
✅ **Status Tracking**: Call completion monitoring  
✅ **Error Handling**: Graceful failure management  

This test ensures your emergency calling system will work when patients really need it! 🚨📞
