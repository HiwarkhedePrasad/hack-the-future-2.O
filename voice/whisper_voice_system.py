#!/usr/bin/env python3
"""
Enhanced Voice System with Whisper AI for Better Indian Accent Recognition
Uses OpenAI Whisper for superior speech recognition and Gemini for conversation
"""

import os
import sys
import json
import sqlite3
import time
import threading
import platform
import requests
import tempfile
import wave
from datetime import datetime, timedelta
from pathlib import Path

# Set UTF-8 encoding for Windows
if platform.system() == "Windows":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Import required packages
try:
    import whisper
    WHISPER_AVAILABLE = True
    print("[WHISPER] OpenAI Whisper loaded successfully")
except ImportError:
    WHISPER_AVAILABLE = False
    print("Warning: OpenAI Whisper not available")

try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    print("Warning: PyAudio not available")

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    print("Warning: pyttsx3 not available")

try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    SOUNDFILE_AVAILABLE = False
    print("Warning: soundfile not available")

class WhisperSpeechRecognizer:
    """Advanced speech recognition using OpenAI Whisper"""
    
    def __init__(self):
        self.whisper_model = None
        self.audio_format = pyaudio.paInt16
        self.channels = 1
        self.rate = 16000  # Whisper works best with 16kHz
        self.chunk = 1024
        self.record_seconds = 10
        
        # Initialize Whisper model
        self.init_whisper()
        
        # Initialize PyAudio
        if PYAUDIO_AVAILABLE:
            self.audio = pyaudio.PyAudio()
        else:
            self.audio = None
    
    def init_whisper(self):
        """Initialize Whisper model"""
        if WHISPER_AVAILABLE:
            try:
                print("[WHISPER] Loading Whisper model (this may take a moment)...")
                # Use base model for good balance of speed and accuracy
                self.whisper_model = whisper.load_model("base")
                print("[WHISPER] Whisper model loaded successfully")
            except Exception as e:
                print(f"[ERROR] Failed to load Whisper model: {e}")
                self.whisper_model = None
        else:
            self.whisper_model = None
    
    def record_audio(self, duration=10):
        """Record audio from microphone"""
        if not self.audio:
            print("[ERROR] PyAudio not available")
            return None
        
        try:
            print(f"[RECORDING] Recording for {duration} seconds... Speak now!")
            
            # Open stream
            stream = self.audio.open(
                format=self.audio_format,
                channels=self.channels,
                rate=self.rate,
                input=True,
                frames_per_buffer=self.chunk
            )
            
            frames = []
            
            # Record audio
            for i in range(0, int(self.rate / self.chunk * duration)):
                data = stream.read(self.chunk)
                frames.append(data)
            
            # Stop and close stream
            stream.stop_stream()
            stream.close()
            
            print("[RECORDING] Recording completed")
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            
            with wave.open(temp_file.name, 'wb') as wf:
                wf.setnchannels(self.channels)
                wf.setsampwidth(self.audio.get_sample_size(self.audio_format))
                wf.setframerate(self.rate)
                wf.writeframes(b''.join(frames))
            
            return temp_file.name
            
        except Exception as e:
            print(f"[ERROR] Recording failed: {e}")
            return None
    
    def transcribe_audio(self, audio_file):
        """Transcribe audio using Whisper"""
        if not self.whisper_model:
            print("[ERROR] Whisper model not available")
            return None
        
        try:
            print("[WHISPER] Transcribing audio...")
            
            # Transcribe with Whisper
            result = self.whisper_model.transcribe(
                audio_file,
                language='hi',  # Hindi/Indian languages
                task='transcribe',
                fp16=False  # Better compatibility
            )
            
            text = result['text'].strip()
            confidence = result.get('confidence', 0.8)
            
            print(f"[WHISPER] Transcribed: '{text}' (confidence: {confidence:.2f})")
            
            # Clean up temp file
            try:
                os.unlink(audio_file)
            except:
                pass
            
            return text if text else None
            
        except Exception as e:
            print(f"[ERROR] Whisper transcription failed: {e}")
            return None
    
    def listen(self, duration=10, retries=3):
        """Listen and transcribe speech with retries"""
        for attempt in range(retries):
            try:
                print(f"[LISTENING] Attempt {attempt + 1}/{retries}")
                
                # Record audio
                audio_file = self.record_audio(duration)
                if not audio_file:
                    continue
                
                # Transcribe
                text = self.transcribe_audio(audio_file)
                if text and len(text.strip()) > 0:
                    return text.strip()
                
                if attempt < retries - 1:
                    print("[RETRY] Didn't catch that clearly. Please speak again...")
                    time.sleep(1)
                
            except Exception as e:
                print(f"[ERROR] Listen attempt {attempt + 1} failed: {e}")
        
        return None

class GeminiConversationAI:
    """Enhanced Gemini AI for better Indian language understanding"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.conversation_history = []
    
    def understand_user_intent(self, user_input, current_context=""):
        """Enhanced understanding for Indian languages and accents"""
        
        # Enhanced system prompt for Indian context
        system_prompt = f"""You are MediPing, a voice-based medication reminder system designed for Indian users. You understand Hindi, English, and Hinglish (Hindi-English mix) very well.

Current context: {current_context}

The user said: "{user_input}"

Analyze this input and respond with JSON:
{{
    "intent": "register|login|add_medicine|check_reminders|took_medicine|emergency|help|exit|general_query",
    "confidence": 0.0-1.0,
    "extracted_data": {{
        "name": "full name if mentioned",
        "phone": "phone number if mentioned", 
        "medicine": "medicine name (translate to English if in Hindi)",
        "time": "time in HH:MM format if mentioned",
        "dosage": "dosage information",
        "frequency": "how many times per day"
    }},
    "response": "Natural response in simple Hindi-English mix that Indians understand",
    "next_action": "what to do next"
}}

Understanding rules:
- "mera naam" = "my name is"
- "medicine" = "dawa" = "tablet" = "goli"
- "time" = "samay" = "baje" 
- "morning" = "subah" = "savere"
- "evening" = "shaam" = "sham"
- "BP" = "blood pressure"
- "diabetes" = "sugar" = "madhumeh"
- "add karna hai" = "want to add"
- "kya hai" = "what is"
- "batao" = "tell me"

Be very flexible with Indian English patterns and Hindi words mixed in English sentences."""

        try:
            payload = {
                "contents": [{
                    "parts": [{"text": system_prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.3,  # Lower temperature for more consistent responses
                    "maxOutputTokens": 1000
                }
            }
            
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Extract JSON from response
                try:
                    start = text_response.find('{')
                    end = text_response.rfind('}') + 1
                    json_str = text_response[start:end]
                    parsed_response = json.loads(json_str)
                    
                    # Store in conversation history
                    self.conversation_history.append({
                        'user': user_input,
                        'response': parsed_response,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    return parsed_response
                except Exception as e:
                    print(f"[GEMINI] JSON parsing error: {e}")
                    return self._create_fallback_response(user_input)
            else:
                print(f"[GEMINI] API error: {response.status_code}")
                return self._create_fallback_response(user_input)
                
        except Exception as e:
            print(f"[GEMINI] Request failed: {e}")
            return self._create_fallback_response(user_input)
    
    def _create_fallback_response(self, user_input):
        """Create fallback response when Gemini fails"""
        user_lower = user_input.lower()
        
        # Simple keyword matching for fallback
        if any(word in user_lower for word in ['naam', 'name', 'mera', 'my']):
            return {
                "intent": "register",
                "confidence": 0.7,
                "extracted_data": {},
                "response": "Aapka naam kya hai? Please tell me your name.",
                "next_action": "get_name"
            }
        elif any(word in user_lower for word in ['medicine', 'dawa', 'tablet', 'add']):
            return {
                "intent": "add_medicine",
                "confidence": 0.7,
                "extracted_data": {},
                "response": "Kaunsi medicine add karni hai? Which medicine do you want to add?",
                "next_action": "get_medicine_name"
            }
        elif any(word in user_lower for word in ['check', 'dekho', 'batao', 'kya']):
            return {
                "intent": "check_reminders",
                "confidence": 0.7,
                "extracted_data": {},
                "response": "Main aapki medicines check kar raha hun. Let me check your medicines.",
                "next_action": "show_reminders"
            }
        else:
            return {
                "intent": "general_query",
                "confidence": 0.5,
                "extracted_data": {},
                "response": "Main samjha nahi. Aap register karna chahte hain ya medicine add karni hai? I didn't understand. Do you want to register or add medicine?",
                "next_action": "ask_for_clarification"
            }

class WhisperVoiceSystem:
    """Complete voice system with Whisper AI and Gemini"""
    
    def __init__(self):
        self.db_path = Path(__file__).parent / "mediping_whisper.db"
        self.audio_dir = Path(__file__).parent / "audio"
        self.audio_dir.mkdir(exist_ok=True)
        
        # Initialize Whisper speech recognizer
        self.speech_recognizer = WhisperSpeechRecognizer()
        
        # Initialize Gemini AI
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if self.gemini_api_key:
            self.gemini_ai = GeminiConversationAI(self.gemini_api_key)
            print("[AI] Gemini AI initialized for Indian language understanding")
        else:
            self.gemini_ai = None
            print("[WARNING] No Gemini API key found")
        
        # Initialize TTS
        self.tts_engine = None
        self.init_tts()
        
        # System state
        self.current_user = None
        self.conversation_state = "greeting"
        self.conversation_context = {}
        
        # Initialize database
        self.init_database()
        
        print("[SYSTEM] Whisper Voice System initialized")
    
    def init_database(self):
        """Initialize database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT UNIQUE,
                    language TEXT DEFAULT 'hi',
                    emergency_contact TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS medicines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    medicine_name TEXT NOT NULL,
                    dosage TEXT,
                    time_slots TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    user_input TEXT,
                    ai_response TEXT,
                    intent TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            conn.commit()
            conn.close()
            print("[DATABASE] Database initialized")
            
        except Exception as e:
            print(f"[ERROR] Database initialization failed: {e}")
    
    def init_tts(self):
        """Initialize TTS with Indian settings"""
        if PYTTSX3_AVAILABLE:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', 140)  # Slower for Indian users
                self.tts_engine.setProperty('volume', 0.9)
                
                # Try to find best voice for Indian users
                voices = self.tts_engine.getProperty('voices')
                if voices:
                    for voice in voices:
                        if 'zira' in voice.name.lower() or 'female' in voice.name.lower():
                            self.tts_engine.setProperty('voice', voice.id)
                            print(f"[TTS] Using voice: {voice.name}")
                            break
                
                print("[TTS] TTS initialized for Indian users")
                
            except Exception as e:
                print(f"[ERROR] TTS initialization failed: {e}")
                self.tts_engine = None
    
    def speak(self, text):
        """Speak text with natural pauses"""
        try:
            print(f"[SYSTEM] {text}")
            
            if self.tts_engine:
                # Add natural pauses for Indian users
                enhanced_text = text.replace(',', ', ').replace('.', '. ').replace('?', '? ')
                self.tts_engine.say(enhanced_text)
                self.tts_engine.runAndWait()
            
        except Exception as e:
            print(f"[ERROR] TTS failed: {e}")
    
    def listen(self, duration=8):
        """Listen using Whisper AI"""
        if not self.speech_recognizer.whisper_model:
            print("[ERROR] Whisper model not available")
            return None
        
        return self.speech_recognizer.listen(duration=duration, retries=2)
    
    def process_conversation(self, user_input):
        """Process conversation with Gemini AI"""
        if not user_input:
            return {
                "response": "Mujhe sunai nahi diya. Please speak again.",
                "next_action": "listen_again"
            }
        
        context = f"Current state: {self.conversation_state}, User: {self.current_user['name'] if self.current_user else 'Not logged in'}"
        
        if self.gemini_ai:
            ai_response = self.gemini_ai.understand_user_intent(user_input, context)
        else:
            ai_response = {
                "intent": "general_query",
                "response": "Main aapki madad kar sakta hun medicines ke saath. I can help with your medicines.",
                "next_action": "continue"
            }
        
        # Log conversation
        self.log_conversation(user_input, ai_response)
        
        # Handle intent
        return self.handle_intent(ai_response)
    
    def handle_intent(self, ai_response):
        """Handle AI detected intent"""
        intent = ai_response.get('intent', 'general_query')
        extracted_data = ai_response.get('extracted_data', {})
        
        if intent == 'register':
            return self.handle_registration(extracted_data, ai_response)
        elif intent == 'add_medicine':
            return self.handle_add_medicine(extracted_data, ai_response)
        elif intent == 'check_reminders':
            return self.handle_check_reminders()
        elif intent == 'took_medicine':
            return self.handle_medicine_taken(extracted_data)
        elif intent == 'exit':
            return {"response": "Dhanyawad! Take care of your health!", "next_action": "exit"}
        else:
            return {
                "response": ai_response.get('response', "Main aapki madad kar sakta hun. How can I help?"),
                "next_action": "continue"
            }
    
    def handle_registration(self, extracted_data, ai_response):
        """Handle user registration"""
        if 'name' in extracted_data and extracted_data['name']:
            # Complete registration
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO users (name, language)
                    VALUES (?, ?)
                ''', (extracted_data['name'], 'hi'))
                
                user_id = cursor.lastrowid
                conn.commit()
                conn.close()
                
                self.current_user = {
                    'id': user_id,
                    'name': extracted_data['name']
                }
                
                return {
                    "response": f"Namaste {extracted_data['name']}! Aap register ho gaye hain. Ab aap medicines add kar sakte hain. You are now registered!",
                    "next_action": "continue"
                }
                
            except Exception as e:
                return {
                    "response": "Registration mein problem hui. Please try again.",
                    "next_action": "retry"
                }
        else:
            return {
                "response": ai_response.get('response', "Aapka naam kya hai? What is your name?"),
                "next_action": "get_name"
            }
    
    def handle_add_medicine(self, extracted_data, ai_response):
        """Handle adding medicine"""
        if not self.current_user:
            return {
                "response": "Pehle register kijiye. Please register first.",
                "next_action": "suggest_register"
            }
        
        medicine = extracted_data.get('medicine', '')
        time_slot = extracted_data.get('time', '08:00')
        
        if medicine:
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO medicines (user_id, medicine_name, time_slots)
                    VALUES (?, ?, ?)
                ''', (self.current_user['id'], medicine, json.dumps([time_slot])))
                
                conn.commit()
                conn.close()
                
                return {
                    "response": f"Bahut accha! {medicine} add ho gayi {time_slot} par. Great! Medicine added successfully!",
                    "next_action": "continue"
                }
                
            except Exception as e:
                return {
                    "response": "Medicine add karne mein problem hui. Please try again.",
                    "next_action": "retry"
                }
        else:
            return {
                "response": ai_response.get('response', "Kaunsi medicine add karni hai? Which medicine?"),
                "next_action": "get_medicine"
            }
    
    def handle_check_reminders(self):
        """Handle checking reminders"""
        if not self.current_user:
            return {
                "response": "Pehle register kijiye. Please register first.",
                "next_action": "suggest_register"
            }
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT medicine_name, time_slots
                FROM medicines
                WHERE user_id = ?
            ''', (self.current_user['id'],))
            
            medicines = cursor.fetchall()
            conn.close()
            
            if not medicines:
                return {
                    "response": "Abhi tak koi medicine add nahi ki hai. No medicines added yet.",
                    "next_action": "suggest_add_medicine"
                }
            
            response = f"Aapki medicines:\n"
            for medicine, time_slots in medicines:
                times = json.loads(time_slots) if time_slots else ['Not set']
                response += f"• {medicine} - {', '.join(times)} par\n"
            
            return {"response": response, "next_action": "continue"}
            
        except Exception as e:
            return {
                "response": "Medicines check karne mein problem hui. Error checking medicines.",
                "next_action": "continue"
            }
    
    def handle_medicine_taken(self, extracted_data):
        """Handle medicine taken confirmation"""
        medicine = extracted_data.get('medicine', 'medicine')
        return {
            "response": f"Bahut accha! {medicine} le li hai aapne. Good job taking your medicine!",
            "next_action": "continue"
        }
    
    def log_conversation(self, user_input, ai_response):
        """Log conversation to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO conversations (user_id, user_input, ai_response, intent)
                VALUES (?, ?, ?, ?)
            ''', (
                self.current_user['id'] if self.current_user else None,
                user_input,
                ai_response.get('response', ''),
                ai_response.get('intent', '')
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"[ERROR] Failed to log conversation: {e}")
    
    def run_system(self):
        """Run the Whisper voice system"""
        self.speak("Namaste! Main MediPing hun. Aap Hindi, English ya Hinglish mein baat kar sakte hain. I understand Indian accents very well!")
        
        if not WHISPER_AVAILABLE:
            self.speak("Sorry, Whisper AI is not available. Please install it first.")
            return
        
        if not self.speech_recognizer.whisper_model:
            self.speak("Speech recognition model is not loaded. Please check installation.")
            return
        
        self.speak("Aap naturally baat kar sakte hain. Apna naam batayiye ya koi medicine add karna hai to bolo. You can speak naturally!")
        
        while True:
            try:
                # Listen with Whisper
                user_input = self.listen(duration=8)
                
                if user_input:
                    print(f"[USER SAID] {user_input}")
                    
                    # Process with Gemini AI
                    result = self.process_conversation(user_input)
                    
                    # Respond
                    self.speak(result['response'])
                    
                    # Check exit condition
                    if result.get('next_action') == 'exit':
                        break
                else:
                    self.speak("Kuch nahi suna. Please speak again.")
                
                time.sleep(1)
                
            except KeyboardInterrupt:
                self.speak("Alvida! Apna khayal rakhiye! Goodbye!")
                break
            except Exception as e:
                print(f"[ERROR] System error: {e}")
                self.speak("Thoda sa problem hua. Let's continue.")
        
        print("[SYSTEM] Whisper voice system shutdown")

def main():
    """Main function"""
    print("MediPing Whisper Voice System for Indian Users")
    print("=" * 50)
    
    # Load environment
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except:
        print("Warning: Could not load .env file")
    
    # Initialize system
    whisper_system = WhisperVoiceSystem()
    
    # Run system
    whisper_system.run_system()

if __name__ == "__main__":
    main()
