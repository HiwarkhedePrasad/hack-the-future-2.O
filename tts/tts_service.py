#!/usr/bin/env python3
"""
Text-to-Speech Service for MediPing Emergency Calls
Supports both offline (pyttsx3) and online (gTTS) TTS engines
"""

import os
import sys
import json
import argparse
import tempfile
from pathlib import Path
import time
import threading
import subprocess
import platform

# Set UTF-8 encoding for Windows
if platform.system() == "Windows":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    print("Warning: pyttsx3 not available. Install with: pip install pyttsx3")

try:
    from gtts import gTTS
    import requests
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    print("Warning: gTTS not available. Install with: pip install gtts requests")

try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False
    print("Warning: pygame not available. Install with: pip install pygame")

class TTSService:
    def __init__(self):
        self.audio_dir = Path(__file__).parent / "audio"
        self.audio_dir.mkdir(exist_ok=True)
        
        # Initialize offline TTS engine
        self.offline_engine = None
        if PYTTSX3_AVAILABLE:
            try:
                self.offline_engine = pyttsx3.init()
                self._configure_offline_engine()
            except Exception as e:
                print(f"Warning: Could not initialize pyttsx3: {e}")
                self.offline_engine = None
        
        # Initialize pygame for audio playback
        if PYGAME_AVAILABLE:
            try:
                pygame.mixer.init()
            except Exception as e:
                print(f"Warning: Could not initialize pygame: {e}")
    
    def _configure_offline_engine(self):
        """Configure the offline TTS engine settings"""
        if not self.offline_engine:
            return
            
        try:
            # Set speech rate (words per minute)
            self.offline_engine.setProperty('rate', 150)
            
            # Set volume (0.0 to 1.0)
            self.offline_engine.setProperty('volume', 0.9)
            
            # Try to set a clear voice
            voices = self.offline_engine.getProperty('voices')
            if voices:
                # Prefer female voice for emergency calls (often clearer)
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        self.offline_engine.setProperty('voice', voice.id)
                        break
                else:
                    # Use first available voice
                    self.offline_engine.setProperty('voice', voices[0].id)
        except Exception as e:
            print(f"Warning: Could not configure TTS engine: {e}")
    
    def create_emergency_message(self, patient_name, medicine, time, emergency_contact_name=""):
        """Create emergency message text"""
        message = f"""
        Hello, this is an urgent message from MediPing, the medication reminder service.
        
        Your contact, {patient_name}, has not responded to their medicine reminder for {medicine}.
        
        They were supposed to take their {medicine} at {time}, but have not confirmed taking it.
        
        Please check on {patient_name} to ensure they are okay and have taken their medication.
        
        If this is an emergency, please call emergency services immediately.
        
        Thank you for being their emergency contact.
        """
        return message.strip()
    
    def text_to_speech_offline(self, text, filename):
        """Convert text to speech using offline engine (pyttsx3)"""
        if not self.offline_engine:
            raise Exception("Offline TTS engine not available")
        
        try:
            audio_path = self.audio_dir / filename
            self.offline_engine.save_to_file(text, str(audio_path))
            self.offline_engine.runAndWait()
            
            if audio_path.exists():
                return str(audio_path)
            else:
                raise Exception("Audio file was not created")
                
        except Exception as e:
            raise Exception(f"Offline TTS failed: {e}")
    
    def text_to_speech_online(self, text, filename, language='en'):
        """Convert text to speech using online service (gTTS)"""
        if not GTTS_AVAILABLE:
            raise Exception("Online TTS (gTTS) not available")
        
        try:
            # Test internet connection
            requests.get('https://www.google.com', timeout=5)
            
            tts = gTTS(text=text, lang=language, slow=False)
            audio_path = self.audio_dir / filename
            tts.save(str(audio_path))
            
            if audio_path.exists():
                return str(audio_path)
            else:
                raise Exception("Audio file was not created")
                
        except requests.RequestException:
            raise Exception("No internet connection for online TTS")
        except Exception as e:
            raise Exception(f"Online TTS failed: {e}")
    
    def play_audio(self, audio_path):
        """Play audio file"""
        audio_path = Path(audio_path)
        if not audio_path.exists():
            raise Exception(f"Audio file not found: {audio_path}")
        
        system = platform.system().lower()
        
        try:
            if PYGAME_AVAILABLE:
                # Use pygame (cross-platform)
                pygame.mixer.music.load(str(audio_path))
                pygame.mixer.music.play()
                
                # Wait for playback to complete
                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)
                    
            elif system == "windows":
                # Use Windows Media Player
                os.system(f'start /wait "" "{audio_path}"')
                
            elif system == "darwin":  # macOS
                subprocess.run(['afplay', str(audio_path)], check=True)
                
            elif system == "linux":
                # Try different Linux audio players
                players = ['aplay', 'paplay', 'mpg123', 'mpv', 'vlc']
                for player in players:
                    try:
                        subprocess.run([player, str(audio_path)], check=True, 
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        break
                    except (subprocess.CalledProcessError, FileNotFoundError):
                        continue
                else:
                    raise Exception("No suitable audio player found on Linux")
            else:
                raise Exception(f"Unsupported operating system: {system}")
                
        except Exception as e:
            raise Exception(f"Audio playback failed: {e}")
    
    def generate_emergency_audio(self, patient_name, medicine, scheduled_time, play_immediately=True, 
                                use_online=False, language='en'):
        """Generate emergency audio message"""
        try:
            # Create message text
            message_text = self.create_emergency_message(patient_name, medicine, scheduled_time)
            
            # Generate filename
            import time as time_module
            timestamp = int(time_module.time())
            filename = f"emergency_{patient_name.replace(' ', '_')}_{timestamp}.mp3"
            
            # Try to generate audio
            audio_path = None
            errors = []
            
            if use_online and GTTS_AVAILABLE:
                try:
                    audio_path = self.text_to_speech_online(message_text, filename, language)
                    print(f"[SUCCESS] Online TTS successful: {audio_path}")
                except Exception as e:
                    errors.append(f"Online TTS: {e}")
                    print(f"[ERROR] Online TTS failed: {e}")
            
            # Fallback to offline TTS
            if not audio_path and PYTTSX3_AVAILABLE:
                try:
                    # For offline TTS, use .wav format
                    offline_filename = filename.replace('.mp3', '.wav')
                    audio_path = self.text_to_speech_offline(message_text, offline_filename)
                    print(f"[SUCCESS] Offline TTS successful: {audio_path}")
                except Exception as e:
                    errors.append(f"Offline TTS: {e}")
                    print(f"[ERROR] Offline TTS failed: {e}")
            
            if not audio_path:
                error_msg = "All TTS methods failed: " + "; ".join(errors)
                raise Exception(error_msg)
            
            # Play audio if requested
            if play_immediately:
                try:
                    print(f"[PLAYING] Playing emergency audio...")
                    self.play_audio(audio_path)
                    print(f"[SUCCESS] Audio playback completed")
                except Exception as e:
                    print(f"[ERROR] Audio playback failed: {e}")
                    # Don't raise exception here, audio file was created successfully
            
            return {
                "success": True,
                "audio_path": audio_path,
                "message": f"Emergency audio generated successfully",
                "text": message_text
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to generate emergency audio"
            }
    
    def list_available_voices(self):
        """List available TTS voices"""
        voices_info = {
            "offline_available": PYTTSX3_AVAILABLE,
            "online_available": GTTS_AVAILABLE,
            "offline_voices": [],
            "online_languages": ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
        }
        
        if self.offline_engine:
            try:
                voices = self.offline_engine.getProperty('voices')
                for voice in voices:
                    voices_info["offline_voices"].append({
                        "id": voice.id,
                        "name": voice.name,
                        "languages": getattr(voice, 'languages', [])
                    })
            except Exception as e:
                print(f"Could not get offline voices: {e}")
        
        return voices_info

def main():
    parser = argparse.ArgumentParser(description='MediPing TTS Service')
    parser.add_argument('--patient-name', help='Patient name')
    parser.add_argument('--medicine', help='Medicine name')
    parser.add_argument('--time', help='Scheduled time')
    parser.add_argument('--play', action='store_true', help='Play audio immediately')
    parser.add_argument('--online', action='store_true', help='Use online TTS (gTTS)')
    parser.add_argument('--language', default='en', help='Language code (default: en)')
    parser.add_argument('--list-voices', action='store_true', help='List available voices')
    parser.add_argument('--test', action='store_true', help='Test TTS installation')
    
    args = parser.parse_args()
    
    tts = TTSService()
    
    if args.list_voices or args.test:
        voices = tts.list_available_voices()
        print(json.dumps(voices, indent=2))
        return
    
    # Check if required arguments are provided for audio generation
    if not args.patient_name or not args.medicine or not args.time:
        print(json.dumps({
            "success": False,
            "error": "Missing required arguments: --patient-name, --medicine, --time",
            "available_engines": {
                "offline": PYTTSX3_AVAILABLE,
                "online": GTTS_AVAILABLE,
                "audio_playback": PYGAME_AVAILABLE
            }
        }, indent=2))
        sys.exit(1)
    
    # Generate emergency audio
    result = tts.generate_emergency_audio(
        patient_name=args.patient_name,
        medicine=args.medicine,
        scheduled_time=args.time,
        play_immediately=args.play,
        use_online=args.online,
        language=args.language
    )
    
    print(json.dumps(result, indent=2))
    
    if result["success"]:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
