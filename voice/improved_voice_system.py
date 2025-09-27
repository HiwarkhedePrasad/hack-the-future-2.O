#!/usr/bin/env python3
"""
Improved Voice System with Better Indian Accent Support
Uses Google Speech Recognition with Indian English and Gemini AI for conversation
"""

import os
import sys
import json
import sqlite3
import time
import threading
import platform
import requests
from datetime import datetime, timedelta
from pathlib import Path

# Set UTF-8 encoding for Windows
if platform.system() == "Windows":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Import speech recognition and TTS
try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
    print("[SPEECH] SpeechRecognition loaded successfully")
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    print("Warning: SpeechRecognition not available")

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
    print("[TTS] pyttsx3 loaded successfully")
except ImportError:
    PYTTSX3_AVAILABLE = False
    print("Warning: pyttsx3 not available")

class ImprovedSpeechRecognizer:
    """Improved speech recognition with better Indian accent support"""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = None
        
        # Optimize settings for Indian accents
        self.recognizer.energy_threshold = 200  # Lower threshold for softer voices
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 1.2  # Longer pause for Indian speaking patterns
        self.recognizer.phrase_threshold = 0.2  # Shorter phrase threshold
        self.recognizer.non_speaking_duration = 0.5  # Better silence detection
        
        # Initialize microphone
        if SPEECH_RECOGNITION_AVAILABLE:
            try:
                self.microphone = sr.Microphone()
                # Calibrate for ambient noise
                with self.microphone as source:
                    print("[SPEECH] Calibrating for ambient noise...")
                    self.recognizer.adjust_for_ambient_noise(source, duration=2)
                print("[SPEECH] Speech recognition optimized for Indian accents")
            except Exception as e:
                print(f"[ERROR] Microphone initialization failed: {e}")
                self.microphone = None
    
    def listen_with_multiple_attempts(self, timeout=12, phrase_time_limit=8, max_attempts=3):
        """Listen with multiple recognition attempts and methods"""
        if not self.microphone:
            print("[ERROR] Microphone not available")
            return None
        
        for attempt in range(max_attempts):
            try:
                print(f"[LISTENING] Attempt {attempt + 1}/{max_attempts} - Please speak clearly...")
                
                with self.microphone as source:
                    # Listen for audio with longer timeout for Indian users
                    audio = self.recognizer.listen(
                        source, 
                        timeout=timeout, 
                        phrase_time_limit=phrase_time_limit
                    )
                
                print("[PROCESSING] Processing your speech...")
                
                # Try multiple recognition methods in order of preference
                recognition_methods = [
                    ("Google (Indian English)", lambda: self.recognizer.recognize_google(audio, language='en-IN')),
                    ("Google (Hindi)", lambda: self.recognizer.recognize_google(audio, language='hi-IN')),
                    ("Google (English)", lambda: self.recognizer.recognize_google(audio, language='en-US')),
                    ("Google (Auto)", lambda: self.recognizer.recognize_google(audio))
                ]
                
                for method_name, method_func in recognition_methods:
                    try:
                        result = method_func()
                        if result and len(result.strip()) > 0:
                            print(f"[SUCCESS] {method_name}: '{result}'")
                            return result.strip()
                    except sr.UnknownValueError:
                        continue
                    except sr.RequestError as e:
                        print(f"[WARNING] {method_name} failed: {e}")
                        continue
                
                # If no method worked, try offline recognition as last resort
                try:
                    result = self.recognizer.recognize_sphinx(audio)
                    if result and len(result.strip()) > 0:
                        print(f"[OFFLINE] Sphinx: '{result}'")
                        return result.strip()
                except:
                    pass
                
                if attempt < max_attempts - 1:
                    print("[RETRY] Couldn't understand clearly. Please speak again...")
                    time.sleep(1)
                
            except sr.WaitTimeoutError:
                if attempt < max_attempts - 1:
                    print("[TIMEOUT] No speech detected. Please try again...")
                else:
                    print("[TIMEOUT] No speech detected after multiple attempts")
            except Exception as e:
                print(f"[ERROR] Recognition attempt {attempt + 1} failed: {e}")
        
        return None

class GeminiConversationAI:
    """Enhanced Gemini AI for Indian language understanding"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.conversation_history = []
    
    def understand_user_intent(self, user_input, current_context=""):
        """Enhanced understanding for Indian languages and speech patterns"""
        
        system_prompt = f"""You are MediPing, a voice-based medication reminder system for Indian users. You understand Hindi, English, and mixed Hindi-English (Hinglish) very well.

Current context: {current_context}
User said: "{user_input}"

Analyze this input and respond with JSON:
{{
    "intent": "register|login|add_medicine|check_reminders|took_medicine|emergency|help|exit|general_query",
    "confidence": 0.0-1.0,
    "extracted_data": {{
        "name": "full name if mentioned",
        "phone": "phone number if mentioned", 
        "medicine": "medicine name (translate Hindi to English)",
        "time": "time in HH:MM format",
        "dosage": "dosage information",
        "frequency": "frequency per day"
    }},
    "response": "Natural response in simple Hindi-English mix",
    "next_action": "what to do next"
}}

Common Indian speech patterns to understand:
- "mera naam" = "my name is"
- "medicine/dawa/tablet/goli" = medicine
- "subah/morning" = morning, "shaam/evening" = evening
- "BP" = blood pressure, "sugar" = diabetes
- "add karna hai" = want to add
- "kya hai" = what is, "batao" = tell me
- "le liya" = took it, "kha liya" = ate/took
- Numbers in Hindi: "ek"=1, "do"=2, "teen"=3, "char"=4, "paanch"=5, "che"=6, "saat"=7, "aath"=8

Be very flexible and understanding with Indian English and mixed language patterns."""

        try:
            payload = {
                "contents": [{
                    "parts": [{"text": system_prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.2,  # Lower for more consistent responses
                    "maxOutputTokens": 800
                }
            }
            
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Extract JSON
                try:
                    start = text_response.find('{')
                    end = text_response.rfind('}') + 1
                    json_str = text_response[start:end]
                    parsed_response = json.loads(json_str)
                    
                    # Store conversation
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
        """Enhanced fallback with better Indian language understanding"""
        user_lower = user_input.lower()
        
        # Enhanced keyword matching for Indian speech patterns
        if any(word in user_lower for word in ['naam', 'name', 'mera', 'my', 'main', 'i am']):
            # Try to extract name
            name = None
            words = user_input.split()
            for i, word in enumerate(words):
                if word.lower() in ['naam', 'name'] and i + 1 < len(words):
                    name = words[i + 1]
                    break
                elif word.lower() in ['mera', 'my'] and i + 1 < len(words) and words[i + 1].lower() in ['naam', 'name'] and i + 2 < len(words):
                    name = words[i + 2]
                    break
            
            return {
                "intent": "register",
                "confidence": 0.8,
                "extracted_data": {"name": name} if name else {},
                "response": f"Namaste {name}! Aap register ho gaye hain." if name else "Aapka naam kya hai? What is your name?",
                "next_action": "complete_registration" if name else "get_name"
            }
            
        elif any(word in user_lower for word in ['medicine', 'dawa', 'tablet', 'goli', 'add', 'bp', 'sugar', 'diabetes']):
            # Try to extract medicine name
            medicine = None
            if 'bp' in user_lower:
                medicine = 'Blood Pressure Medicine'
            elif any(word in user_lower for word in ['sugar', 'diabetes']):
                medicine = 'Diabetes Medicine'
            
            return {
                "intent": "add_medicine",
                "confidence": 0.8,
                "extracted_data": {"medicine": medicine} if medicine else {},
                "response": f"{medicine} add kar di hai!" if medicine else "Kaunsi medicine add karni hai? Which medicine?",
                "next_action": "complete_add_medicine" if medicine else "get_medicine_name"
            }
            
        elif any(word in user_lower for word in ['check', 'dekho', 'batao', 'kya', 'reminder', 'list']):
            return {
                "intent": "check_reminders",
                "confidence": 0.8,
                "extracted_data": {},
                "response": "Aapki medicines check kar raha hun. Checking your medicines.",
                "next_action": "show_reminders"
            }
            
        elif any(word in user_lower for word in ['le liya', 'kha liya', 'took', 'taken', 'had']):
            return {
                "intent": "took_medicine",
                "confidence": 0.8,
                "extracted_data": {},
                "response": "Bahut accha! Medicine le li hai. Good job taking your medicine!",
                "next_action": "mark_taken"
            }
            
        else:
            return {
                "intent": "general_query",
                "confidence": 0.5,
                "extracted_data": {},
                "response": "Main samjha nahi. Aap register karna chahte hain ya medicine add karni hai? I didn't understand. Do you want to register or add medicine?",
                "next_action": "ask_for_clarification"
            }

class ImprovedVoiceSystem:
    """Complete improved voice system"""
    
    def __init__(self):
        self.db_path = Path(__file__).parent / "mediping_improved.db"
        
        # Initialize speech recognizer
        self.speech_recognizer = ImprovedSpeechRecognizer()
        
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
        
        # Initialize database
        self.init_database()
        
        print("[SYSTEM] Improved Voice System initialized")
    
    def init_database(self):
        """Initialize database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT,
                    language TEXT DEFAULT 'hi',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS medicines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    medicine_name TEXT NOT NULL,
                    time_slots TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            conn.commit()
            conn.close()
            print("[DATABASE] Database initialized")
            
        except Exception as e:
            print(f"[ERROR] Database initialization failed: {e}")
    
    def init_tts(self):
        """Initialize TTS"""
        if PYTTSX3_AVAILABLE:
            try:
                self.tts_engine = pyttsx3.init()
                self.tts_engine.setProperty('rate', 130)  # Slower for Indian users
                self.tts_engine.setProperty('volume', 0.9)
                
                # Find best voice
                voices = self.tts_engine.getProperty('voices')
                if voices:
                    for voice in voices:
                        if 'zira' in voice.name.lower():
                            self.tts_engine.setProperty('voice', voice.id)
                            print(f"[TTS] Using voice: {voice.name}")
                            break
                
                print("[TTS] TTS initialized for Indian users")
                
            except Exception as e:
                print(f"[ERROR] TTS initialization failed: {e}")
                self.tts_engine = None
    
    def speak(self, text):
        """Speak text"""
        try:
            print(f"[SYSTEM] {text}")
            
            if self.tts_engine:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
            
        except Exception as e:
            print(f"[ERROR] TTS failed: {e}")
    
    def listen(self):
        """Listen using improved speech recognition"""
        return self.speech_recognizer.listen_with_multiple_attempts(
            timeout=12, 
            phrase_time_limit=8, 
            max_attempts=2
        )
    
    def process_conversation(self, user_input):
        """Process conversation"""
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
                "response": "Main aapki madad kar sakta hun. I can help you.",
                "next_action": "continue"
            }
        
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
            return self.handle_medicine_taken()
        elif intent == 'exit':
            return {"response": "Dhanyawad! Apna khayal rakhiye! Take care!", "next_action": "exit"}
        else:
            return {
                "response": ai_response.get('response', "Main aapki madad kar sakta hun. How can I help?"),
                "next_action": "continue"
            }
    
    def handle_registration(self, extracted_data, ai_response):
        """Handle registration"""
        name = extracted_data.get('name', '')
        
        if name:
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO users (name, language)
                    VALUES (?, ?)
                ''', (name, 'hi'))
                
                user_id = cursor.lastrowid
                conn.commit()
                conn.close()
                
                self.current_user = {'id': user_id, 'name': name}
                
                return {
                    "response": f"Namaste {name}! Aap register ho gaye hain. Ab aap medicines add kar sakte hain. You are registered!",
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
        
        if medicine:
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO medicines (user_id, medicine_name, time_slots)
                    VALUES (?, ?, ?)
                ''', (self.current_user['id'], medicine, json.dumps(['08:00'])))
                
                conn.commit()
                conn.close()
                
                return {
                    "response": f"Bahut accha! {medicine} add ho gayi 8 AM par. Medicine added successfully!",
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
                times = json.loads(time_slots) if time_slots else ['8:00 AM']
                response += f"• {medicine} - {', '.join(times)} par\n"
            
            return {"response": response, "next_action": "continue"}
            
        except Exception as e:
            return {
                "response": "Medicines check karne mein problem hui.",
                "next_action": "continue"
            }
    
    def handle_medicine_taken(self):
        """Handle medicine taken"""
        return {
            "response": "Bahut accha! Medicine le li hai. Good job!",
            "next_action": "continue"
        }
    
    def run_system(self):
        """Run the improved voice system"""
        self.speak("Namaste! Main MediPing hun. Aap Hindi, English ya dono mein baat kar sakte hain. I understand Indian accents well!")
        
        if not SPEECH_RECOGNITION_AVAILABLE:
            self.speak("Sorry, speech recognition is not available.")
            return
        
        if not self.speech_recognizer.microphone:
            self.speak("Microphone is not available.")
            return
        
        self.speak("Aap naturally baat kar sakte hain. Apna naam batayiye ya medicine add karna hai to bolo.")
        
        while True:
            try:
                # Listen
                user_input = self.listen()
                
                if user_input:
                    print(f"[USER SAID] {user_input}")
                    
                    # Process
                    result = self.process_conversation(user_input)
                    
                    # Respond
                    self.speak(result['response'])
                    
                    # Check exit
                    if result.get('next_action') == 'exit':
                        break
                else:
                    self.speak("Kuch nahi suna. Main sun raha hun.")
                
                time.sleep(1)
                
            except KeyboardInterrupt:
                self.speak("Alvida! Apna khayal rakhiye!")
                break
            except Exception as e:
                print(f"[ERROR] System error: {e}")
                self.speak("Thoda problem hua. Chaliye continue karte hain.")
        
        print("[SYSTEM] System shutdown")

def main():
    """Main function"""
    print("MediPing Improved Voice System for Indian Users")
    print("=" * 50)
    
    # Load environment
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except:
        print("Warning: Could not load .env file")
    
    # Initialize system
    improved_system = ImprovedVoiceSystem()
    
    # Run system
    improved_system.run_system()

if __name__ == "__main__":
    main()
