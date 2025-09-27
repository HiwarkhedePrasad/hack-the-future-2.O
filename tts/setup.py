#!/usr/bin/env python3
"""
Setup script for MediPing TTS Service
Installs required packages and tests the installation
"""

import subprocess
import sys
import os
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, 
                              capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    print(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python 3.7 or higher is required")
        return False
    
    print("✅ Python version is compatible")
    return True

def install_packages():
    """Install required Python packages"""
    packages = [
        "pyttsx3==2.90",
        "gtts==2.4.0", 
        "pygame==2.5.2",
        "playsound==1.3.0",
        "requests==2.31.0"
    ]
    
    print("📦 Installing required packages...")
    
    for package in packages:
        print(f"   Installing {package}...")
        success = run_command(f"{sys.executable} -m pip install {package}", 
                            f"Install {package}")
        if not success:
            print(f"⚠️ Failed to install {package}, trying without version constraint...")
            package_name = package.split('==')[0]
            run_command(f"{sys.executable} -m pip install {package_name}", 
                       f"Install {package_name}")

def test_imports():
    """Test if all required packages can be imported"""
    print("🧪 Testing package imports...")
    
    test_results = {}
    
    # Test pyttsx3
    try:
        import pyttsx3
        engine = pyttsx3.init()
        test_results['pyttsx3'] = True
        print("✅ pyttsx3 (offline TTS) - OK")
    except Exception as e:
        test_results['pyttsx3'] = False
        print(f"❌ pyttsx3 (offline TTS) - Failed: {e}")
    
    # Test gTTS
    try:
        from gtts import gTTS
        import requests
        test_results['gtts'] = True
        print("✅ gTTS (online TTS) - OK")
    except Exception as e:
        test_results['gtts'] = False
        print(f"❌ gTTS (online TTS) - Failed: {e}")
    
    # Test pygame
    try:
        import pygame
        pygame.mixer.init()
        test_results['pygame'] = True
        print("✅ pygame (audio playback) - OK")
    except Exception as e:
        test_results['pygame'] = False
        print(f"❌ pygame (audio playback) - Failed: {e}")
    
    # Test playsound (alternative audio player)
    try:
        import playsound
        test_results['playsound'] = True
        print("✅ playsound (backup audio) - OK")
    except Exception as e:
        test_results['playsound'] = False
        print(f"❌ playsound (backup audio) - Failed: {e}")
    
    return test_results

def test_tts_functionality():
    """Test basic TTS functionality"""
    print("🎤 Testing TTS functionality...")
    
    try:
        # Test offline TTS
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty('rate', 150)
        print("✅ Offline TTS engine initialized")
        
        # Test online TTS (without actually making request)
        from gtts import gTTS
        print("✅ Online TTS library available")
        
        return True
        
    except Exception as e:
        print(f"❌ TTS functionality test failed: {e}")
        return False

def create_test_audio():
    """Create a test audio file"""
    print("🔊 Creating test audio file...")
    
    try:
        import pyttsx3
        import os
        
        engine = pyttsx3.init()
        engine.setProperty('rate', 150)
        engine.setProperty('volume', 0.9)
        
        test_text = "Hello, this is a test of the MediPing TTS system. If you can hear this, the setup was successful."
        test_file = "test_audio.wav"
        
        engine.save_to_file(test_text, test_file)
        engine.runAndWait()
        
        if os.path.exists(test_file):
            file_size = os.path.getsize(test_file)
            print(f"✅ Test audio file created: {test_file} ({file_size} bytes)")
            
            # Try to play the test audio
            try:
                import pygame
                pygame.mixer.init()
                pygame.mixer.music.load(test_file)
                pygame.mixer.music.play()
                
                print("🔊 Test audio is playing...")
                print("   (If you can't hear it, check your audio settings)")
                
                # Wait for playback to complete
                import time
                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)
                
                print("✅ Test audio playback completed")
                
            except Exception as e:
                print(f"⚠️ Audio playback test failed: {e}")
                print("   (Audio file was created successfully)")
            
            # Clean up test file
            try:
                os.remove(test_file)
                print("🗑️ Test file cleaned up")
            except:
                pass
                
            return True
        else:
            print("❌ Test audio file was not created")
            return False
            
    except Exception as e:
        print(f"❌ Test audio creation failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 MediPing TTS Service Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    print()
    
    # Install packages
    install_packages()
    
    print()
    
    # Test imports
    test_results = test_imports()
    
    print()
    
    # Test TTS functionality
    tts_working = test_tts_functionality()
    
    print()
    
    # Create test audio
    audio_working = create_test_audio()
    
    print()
    print("📊 Setup Summary:")
    print("=" * 40)
    
    if test_results.get('pyttsx3', False):
        print("✅ Offline TTS (pyttsx3) - Ready")
    else:
        print("❌ Offline TTS (pyttsx3) - Not available")
    
    if test_results.get('gtts', False):
        print("✅ Online TTS (gTTS) - Ready")
    else:
        print("❌ Online TTS (gTTS) - Not available")
    
    if test_results.get('pygame', False):
        print("✅ Audio Playback (pygame) - Ready")
    else:
        print("❌ Audio Playback (pygame) - Not available")
    
    if tts_working:
        print("✅ TTS Functionality - Working")
    else:
        print("❌ TTS Functionality - Issues detected")
    
    if audio_working:
        print("✅ Audio Generation - Working")
    else:
        print("❌ Audio Generation - Issues detected")
    
    print()
    
    # Overall status
    critical_working = test_results.get('pyttsx3', False) or test_results.get('gtts', False)
    
    if critical_working and (test_results.get('pygame', False) or test_results.get('playsound', False)):
        print("🎉 SETUP SUCCESSFUL!")
        print("   Your TTS system is ready to use.")
        print()
        print("🔧 Next steps:")
        print("1. Run: node test-tts.js")
        print("2. Test emergency calls with TTS")
        print("3. Integrate with your reminder system")
    else:
        print("⚠️ SETUP INCOMPLETE")
        print("   Some components are not working properly.")
        print()
        print("🔧 Troubleshooting:")
        if not test_results.get('pyttsx3', False) and not test_results.get('gtts', False):
            print("- No TTS engines available. Try reinstalling packages.")
        if not test_results.get('pygame', False) and not test_results.get('playsound', False):
            print("- No audio playback available. Check audio drivers.")
        print("- Check error messages above for specific issues.")

if __name__ == "__main__":
    main()
