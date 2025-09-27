#!/usr/bin/env python3
"""
Test script to verify voice system setup
"""

import sys
import os

def test_imports():
    """Test if all required packages can be imported"""
    print("🧪 Testing Voice System Setup...")
    print("=" * 40)
    
    results = {}
    
    # Test SpeechRecognition
    try:
        import speech_recognition as sr
        results['speech_recognition'] = True
        print("✅ SpeechRecognition - OK")
    except ImportError as e:
        results['speech_recognition'] = False
        print(f"❌ SpeechRecognition - Failed: {e}")
    
    # Test pyttsx3
    try:
        import pyttsx3
        results['pyttsx3'] = True
        print("✅ pyttsx3 (Text-to-Speech) - OK")
    except ImportError as e:
        results['pyttsx3'] = False
        print(f"❌ pyttsx3 - Failed: {e}")
    
    # Test gtts
    try:
        from gtts import gTTS
        results['gtts'] = True
        print("✅ gTTS (Google TTS) - OK")
    except ImportError as e:
        results['gtts'] = False
        print(f"❌ gTTS - Failed: {e}")
    
    # Test pygame
    try:
        import pygame
        results['pygame'] = True
        print("✅ pygame (Audio) - OK")
    except ImportError as e:
        results['pygame'] = False
        print(f"❌ pygame - Failed: {e}")
    
    # Test requests
    try:
        import requests
        results['requests'] = True
        print("✅ requests (HTTP) - OK")
    except ImportError as e:
        results['requests'] = False
        print(f"❌ requests - Failed: {e}")
    
    # Test python-dotenv
    try:
        from dotenv import load_dotenv
        results['dotenv'] = True
        print("✅ python-dotenv (Environment) - OK")
    except ImportError as e:
        results['dotenv'] = False
        print(f"❌ python-dotenv - Failed: {e}")
    
    print("\n📊 Setup Summary:")
    print("=" * 40)
    
    working_count = sum(results.values())
    total_count = len(results)
    
    print(f"Working packages: {working_count}/{total_count}")
    
    if working_count == total_count:
        print("🎉 ALL PACKAGES INSTALLED SUCCESSFULLY!")
        print("✅ Voice system is ready to use")
    else:
        print("⚠️ Some packages failed to install")
        print("❌ Voice system may not work properly")
    
    return results

def test_basic_functionality():
    """Test basic TTS functionality"""
    print("\n🎤 Testing Basic TTS Functionality...")
    print("=" * 40)
    
    try:
        import pyttsx3
        
        # Initialize TTS engine
        engine = pyttsx3.init()
        
        # Test basic settings
        engine.setProperty('rate', 150)
        engine.setProperty('volume', 0.9)
        
        # Get available voices
        voices = engine.getProperty('voices')
        print(f"📢 Available voices: {len(voices)}")
        
        for i, voice in enumerate(voices[:3]):  # Show first 3 voices
            print(f"  {i+1}. {voice.name}")
        
        print("✅ TTS engine initialized successfully")
        print("🔊 TTS is ready for voice output")
        
        return True
        
    except Exception as e:
        print(f"❌ TTS test failed: {e}")
        return False

def test_speech_recognition():
    """Test speech recognition setup"""
    print("\n🎙️ Testing Speech Recognition Setup...")
    print("=" * 40)
    
    try:
        import speech_recognition as sr
        
        # Initialize recognizer
        recognizer = sr.Recognizer()
        
        # Check for microphone
        try:
            microphone = sr.Microphone()
            print("✅ Microphone detected")
            
            # Test microphone access
            with microphone as source:
                print("🎙️ Testing microphone access...")
                recognizer.adjust_for_ambient_noise(source, duration=1)
            
            print("✅ Speech recognition is ready")
            return True
            
        except Exception as e:
            print(f"⚠️ Microphone issue: {e}")
            print("🎙️ Speech recognition available but microphone needs setup")
            return True
            
    except Exception as e:
        print(f"❌ Speech recognition test failed: {e}")
        return False

def check_environment():
    """Check environment setup"""
    print("\n🌍 Checking Environment...")
    print("=" * 40)
    
    # Check Python version
    python_version = sys.version_info
    print(f"🐍 Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version.major >= 3 and python_version.minor >= 7:
        print("✅ Python version is compatible")
    else:
        print("❌ Python 3.7+ required")
    
    # Check for .env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        print("✅ .env file found")
        
        # Check for Gemini API key
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
            
            if os.getenv('GEMINI_API_KEY'):
                print("✅ GEMINI_API_KEY found in environment")
            else:
                print("⚠️ GEMINI_API_KEY not found in .env")
        except:
            print("⚠️ Could not load .env file")
    else:
        print("⚠️ .env file not found")

def main():
    """Main test function"""
    print("🎤 MediPing Voice System Setup Test")
    print("=" * 50)
    
    # Test imports
    import_results = test_imports()
    
    # Test basic functionality
    if import_results.get('pyttsx3', False):
        test_basic_functionality()
    
    # Test speech recognition
    if import_results.get('speech_recognition', False):
        test_speech_recognition()
    
    # Check environment
    check_environment()
    
    print("\n🎯 Next Steps:")
    print("=" * 40)
    
    if all(import_results.values()):
        print("✅ Setup is complete!")
        print("🚀 You can now run: npm run enhanced-demo")
        print("🎤 Or directly: python enhanced_voice_system.py")
    else:
        print("🔧 Fix the failed packages above")
        print("💡 Try: pip install <package_name>")
    
    print("\n🎉 Setup test completed!")

if __name__ == "__main__":
    main()
