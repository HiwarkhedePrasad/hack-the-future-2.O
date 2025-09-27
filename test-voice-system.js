// test-voice-system.js - Test the integrated voice system
import voiceSystemService from './services/voiceSystemService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testVoiceSystem() {
    console.log('🎤 MEDIPING VOICE SYSTEM TEST\n');
    
    try {
        // Step 1: Check system status
        console.log('📊 Step 1: Checking Voice System Status...');
        const status = await voiceSystemService.getVoiceSystemStatus();
        console.log('Voice System Status:', JSON.stringify(status, null, 2));
        
        if (!status.pythonAvailable) {
            console.error('❌ Python not available. Please install Python.');
            return;
        }
        
        if (!status.voiceSystemExists) {
            console.error('❌ Voice system files not found.');
            return;
        }
        
        console.log('✅ System components ready\n');
        
        // Step 2: Check available COM ports
        console.log('📡 Step 2: Checking Available COM Ports...');
        const ports = await voiceSystemService.getAvailablePorts();
        
        if (ports.success && ports.ports.length > 0) {
            console.log('Available COM Ports:');
            ports.ports.forEach((port, index) => {
                console.log(`${index + 1}. ${port.device} - ${port.description}`);
            });
        } else {
            console.log('No COM ports detected or not on Windows');
        }
        console.log();
        
        // Step 3: Test GSM module (if available)
        console.log('📶 Step 3: Testing GSM Module...');
        const gsmTest = await voiceSystemService.testGSMModule('COM3');
        
        if (gsmTest.success) {
            console.log('✅ GSM module test successful');
            console.log('GSM Output:', gsmTest.output.substring(0, 200) + '...');
        } else {
            console.log('⚠️ GSM module test failed (this is normal if no GSM module connected)');
            console.log('GSM Error:', gsmTest.error.substring(0, 200) + '...');
        }
        console.log();
        
        // Step 4: Check database
        console.log('🗄️ Step 4: Checking Database...');
        const dbInfo = await voiceSystemService.getDatabaseInfo();
        
        if (dbInfo.exists) {
            console.log(`✅ Database found: ${dbInfo.path}`);
            console.log(`📊 Size: ${(dbInfo.size / 1024).toFixed(1)} KB`);
            console.log(`📅 Modified: ${dbInfo.modified.toLocaleString()}`);
        } else {
            console.log('⚠️ Database not found (will be created on first run)');
        }
        console.log();
        
        // Step 5: Install dependencies (optional)
        const shouldInstallDeps = process.argv.includes('--install-deps');
        
        if (shouldInstallDeps) {
            console.log('📦 Step 5: Installing Dependencies...');
            const installResult = await voiceSystemService.installDependencies();
            
            if (installResult.success) {
                console.log('✅ Dependencies installed successfully');
            } else {
                console.log('❌ Dependency installation failed');
                console.log('Error:', installResult.error);
            }
            console.log();
        }
        
        // Step 6: Start voice system (optional)
        const shouldStartSystem = process.argv.includes('--start-system');
        
        if (shouldStartSystem) {
            console.log('🚀 Step 6: Starting Voice System...');
            console.log('⚠️ This will start the interactive voice system');
            console.log('🎤 Make sure your microphone and speakers are ready');
            console.log('⏰ Starting in 5 seconds...\n');
            
            // Countdown
            for (let i = 5; i > 0; i--) {
                console.log(`⏰ ${i}...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const startResult = await voiceSystemService.startVoiceSystem({
                gsmPort: 'COM3',
                enableGSM: true,
                testMode: false
            });
            
            if (startResult.success) {
                console.log('✅ Voice system started successfully!');
                console.log(`🔢 Process ID: ${startResult.pid}`);
                console.log('🎤 Voice system is now running...');
                console.log('🛑 Press Ctrl+C to stop');
                
                // Keep the process running
                process.on('SIGINT', async () => {
                    console.log('\n🛑 Stopping voice system...');
                    await voiceSystemService.stopVoiceSystem();
                    process.exit(0);
                });
                
                // Keep alive
                setInterval(() => {
                    // Check if voice system is still running
                    const currentStatus = voiceSystemService.getVoiceSystemStatus();
                    if (!currentStatus.running) {
                        console.log('⚠️ Voice system stopped unexpectedly');
                        process.exit(1);
                    }
                }, 5000);
                
            } else {
                console.log('❌ Failed to start voice system');
                console.log('Error:', startResult.error);
            }
        }
        
        // Test Summary
        console.log('🎉 VOICE SYSTEM TEST COMPLETED!\n');
        console.log('📋 Test Results:');
        console.log(`✅ Python Available: ${status.pythonAvailable ? 'YES' : 'NO'}`);
        console.log(`✅ Voice System Files: ${status.voiceSystemExists ? 'YES' : 'NO'}`);
        console.log(`✅ COM Ports Detected: ${ports.success ? ports.ports.length : 0}`);
        console.log(`✅ GSM Module Test: ${gsmTest.success ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Database: ${dbInfo.exists ? 'EXISTS' : 'WILL BE CREATED'}`);
        
        console.log('\n💡 Next Steps:');
        console.log('1. Install dependencies: node test-voice-system.js --install-deps');
        console.log('2. Start voice system: node test-voice-system.js --start-system');
        console.log('3. Connect GSM module to enable SMS and voice calls');
        console.log('4. Test with real users in village environment');
        
        console.log('\n🎯 Voice System Features:');
        console.log('• Complete voice-to-voice interaction');
        console.log('• Offline user registration');
        console.log('• Voice-based medicine management');
        console.log('• Automatic medication reminders');
        console.log('• GSM SMS and voice call support');
        console.log('• Emergency alert system');
        console.log('• Multi-language support');
        console.log('• Offline database operations');
        
    } catch (error) {
        console.error('❌ Voice system test failed:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure Python is installed and in PATH');
        console.log('2. Install required packages: pip install -r voice/requirements.txt');
        console.log('3. Check microphone and speaker permissions');
        console.log('4. Ensure GSM module is properly connected (if using)');
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Test interrupted by user');
    
    // Stop voice system if running
    try {
        await voiceSystemService.stopVoiceSystem();
    } catch (error) {
        // Ignore errors during shutdown
    }
    
    process.exit(0);
});

// Run the test
testVoiceSystem().catch(console.error);
