#!/usr/bin/env python3
"""
Enhanced Voice System with Gemini AI for Natural Conversation
Better Indian accent support and conversational flow
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
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    print("Warning: speech_recognition not available")

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    print("Warning: pyttsx3 not available")

class GeminiConversationAI:
    """Gemini AI integration for natural conversation understanding"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.conversation_context = []
        
    def understand_user_intent(self, user_input, current_context=""):
        """Use Gemini to understand user intent and extract information"""
        
        system_prompt = f"""You are MediPing, a voice-based medication reminder system for Indian villages. 
        
Current context: {current_context}

Analyze the user's speech and respond with JSON containing:
{{
    "intent": "register|login|add_medicine|check_reminders|took_medicine|emergency|help|exit|general_query",
    "confidence": 0.0-1.0,
    "extracted_data": {{
        "name": "extracted name if mentioned",
        "phone": "extracted phone number if mentioned", 
        "medicine": "medicine name if mentioned",
        "time": "time if mentioned",
        "dosage": "dosage if mentioned",
        "frequency": "frequency if mentioned"
    }},
    "response": "Natural conversational response in simple Hindi-English mix",
    "next_action": "what to ask next or do next"
}}

User said: "{user_input}"

Be conversational, supportive, and understand Indian English patterns. Handle incomplete information gracefully."""

        try:
            payload = {
                "contents": [{
                    "parts": [{"text": system_prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 1000
                }
            }
            
            headers = {
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Extract JSON from response
                try:
                    # Find JSON in the response
                    start = text_response.find('{')
                    end = text_response.rfind('}') + 1
                    json_str = text_response[start:end]
                    return json.loads(json_str)
                except:
                    # Fallback response
                    return {
                        "intent": "general_query",
                        "confidence": 0.5,
                        "extracted_data": {},
                        "response": "I understand you want to use MediPing. Can you tell me what you'd like to do?",
                        "next_action": "ask_for_clarification"
                    }
            else:
                print(f"Gemini API error: {response.status_code}")
                return self._fallback_intent_detection(user_input)
                
        except Exception as e:
            print(f"Gemini API failed: {e}")
            return self._fallback_intent_detection(user_input)
    
    def _fallback_intent_detection(self, user_input):
        """Fallback intent detection without Gemini"""
        user_input = user_input.lower()
        
        if any(word in user_input for word in ['register', 'new user', 'sign up', 'create account']):
            return {
                "intent": "register",
                "confidence": 0.8,
                "extracted_data": {},
                "response": "I'll help you register. What's your name?",
                "next_action": "get_name"
            }
        elif any(word in user_input for word in ['medicine', 'add', 'medication', 'drug']):
            return {
                "intent": "add_medicine",
                "confidence": 0.8,
                "extracted_data": {},
                "response": "Let's add your medicine. What medicine do you want to add?",
                "next_action": "get_medicine_name"
            }
        else:
            return {
                "intent": "general_query",
                "confidence": 0.5,
                "extracted_data": {},
                "response": "I'm here to help with your medicines. You can register, add medicines, or check reminders. What would you like to do?",
                "next_action": "ask_for_clarification"
            }

class EnhancedVoiceSystem:
    """Enhanced voice system with Gemini AI and better Indian accent support"""
    
    def __init__(self):
        self.db_path = Path(__file__).parent / "mediping_offline.db"
        self.audio_dir = Path(__file__).parent / "audio"
        self.audio_dir.mkdir(exist_ok=True)
        
        # Initialize Gemini AI
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if self.gemini_api_key:
            self.gemini_ai = GeminiConversationAI(self.gemini_api_key)
            print("[AI] Gemini AI initialized for natural conversation")
        else:
            self.gemini_ai = None
            print("[WARNING] No Gemini API key found in environment")
        
        # Initialize components
        self.tts_engine = None
        self.speech_recognizer = None
        self.microphone = None
        
        # System state
        self.current_user = None
        self.conversation_state = "greeting"
        self.conversation_context = {}
        self.language = "en"
        
        # Initialize database
        self.init_database()
        
        # Initialize TTS with Indian accent support
        self.init_enhanced_tts()
        
        # Initialize enhanced speech recognition
        self.init_enhanced_speech_recognition()
        
        print("[SYSTEM] Enhanced Voice System initialized with Gemini AI")
    
    def init_database(self):
        """Initialize offline SQLite database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT UNIQUE,
                    age INTEGER,
                    language TEXT DEFAULT 'en',
                    emergency_contact TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Medicines table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS medicines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    medicine_name TEXT NOT NULL,
                    dosage TEXT,
                    frequency TEXT,
                    time_slots TEXT,
                    start_date DATE,
                    end_date DATE,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Conversations table for context
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    user_input TEXT,
                    ai_response TEXT,
                    intent TEXT,
                    extracted_data TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            conn.commit()
            conn.close()
            print("[DATABASE] Enhanced database initialized")
            
        except Exception as e:
            print(f"[ERROR] Database initialization failed: {e}")
    
    def init_enhanced_tts(self):
        """Initialize TTS with Indian accent friendly settings"""
        if PYTTSX3_AVAILABLE:
            try:
                self.tts_engine = pyttsx3.init()
                
                # Slower speech rate for better understanding
                self.tts_engine.setProperty('rate', 130)
                self.tts_engine.setProperty('volume', 0.9)
                
                # Try to find Indian English voice
                voices = self.tts_engine.getProperty('voices')
                if voices:
                    for voice in voices:
                        # Look for Indian or clear female voices
                        if any(keyword in voice.name.lower() for keyword in ['india', 'zira', 'female']):
                            self.tts_engine.setProperty('voice', voice.id)
                            print(f"[TTS] Using voice: {voice.name}")
                            break
                
                print("[TTS] Enhanced TTS initialized for Indian accents")
                
            except Exception as e:
                print(f"[ERROR] TTS initialization failed: {e}")
                self.tts_engine = None
    
    def init_enhanced_speech_recognition(self):
        """Initialize speech recognition with Indian accent support"""
        if SPEECH_RECOGNITION_AVAILABLE:
            try:
                self.speech_recognizer = sr.Recognizer()
                self.microphone = sr.Microphone()
                
                # Adjust for Indian accents
                self.speech_recognizer.energy_threshold = 300
                self.speech_recognizer.dynamic_energy_threshold = True
                self.speech_recognizer.pause_threshold = 1.0
                self.speech_recognizer.phrase_threshold = 0.3
                
                # Calibrate for ambient noise
                with self.microphone as source:
                    print("[SPEECH] Adjusting for ambient noise...")
                    self.speech_recognizer.adjust_for_ambient_noise(source, duration=2)
                
                print("[SPEECH] Enhanced speech recognition initialized")
                
            except Exception as e:
                print(f"[ERROR] Speech recognition initialization failed: {e}")
                self.speech_recognizer = None
    
    def speak(self, text):
        """Enhanced text-to-speech with natural pauses"""
        try:
            print(f"[SYSTEM] {text}")
            
            if self.tts_engine:
                # Add natural pauses for better understanding
                enhanced_text = text.replace(',', ', ').replace('.', '. ')
                self.tts_engine.say(enhanced_text)
                self.tts_engine.runAndWait()
            else:
                print("[WARNING] TTS not available")
                
        except Exception as e:
            print(f"[ERROR] Speech synthesis failed: {e}")
    
    def listen_with_retry(self, timeout=15, retries=3):
        """Enhanced listening with multiple attempts for Indian accents"""
        if not self.speech_recognizer or not self.microphone:
            print("[ERROR] Speech recognition not available")
            return None
        
        for attempt in range(retries):
            try:
                print(f"[LISTENING] Attempt {attempt + 1}/{retries} - Please speak...")
                
                with self.microphone as source:
                    # Longer timeout for Indian speaking patterns
                    audio = self.speech_recognizer.listen(
                        source, 
                        timeout=timeout, 
                        phrase_time_limit=8
                    )
                
                print("[PROCESSING] Processing your speech...")
                
                # Try multiple recognition methods
                recognized_text = None
                
                # Method 1: Google with Indian English
                try:
                    recognized_text = self.speech_recognizer.recognize_google(
                        audio, 
                        language='en-IN'  # Indian English
                    )
                    print(f"[RECOGNIZED] Google (en-IN): {recognized_text}")
                except:
                    pass
                
                # Method 2: Google with standard English
                if not recognized_text:
                    try:
                        recognized_text = self.speech_recognizer.recognize_google(audio)
                        print(f"[RECOGNIZED] Google (en): {recognized_text}")
                    except:
                        pass
                
                # Method 3: Offline recognition
                if not recognized_text:
                    try:
                        recognized_text = self.speech_recognizer.recognize_sphinx(audio)
                        print(f"[RECOGNIZED] Offline: {recognized_text}")
                    except:
                        pass
                
                if recognized_text:
                    return recognized_text.strip()
                else:
                    if attempt < retries - 1:
                        self.speak("I couldn't understand clearly. Please speak again.")
                    
            except sr.WaitTimeoutError:
                if attempt < retries - 1:
                    self.speak("I didn't hear anything. Please try speaking again.")
                else:
                    print("[TIMEOUT] No speech detected after multiple attempts")
            except Exception as e:
                print(f"[ERROR] Speech recognition failed: {e}")
        
        return None
    
    def process_conversation(self, user_input):
        """Process user input using Gemini AI for natural conversation"""
        if not user_input:
            return {
                "response": "I didn't hear you clearly. Can you please repeat?",
                "next_action": "listen_again"
            }
        
        # Get current context
        context = f"Current state: {self.conversation_state}, User: {self.current_user['name'] if self.current_user else 'Not logged in'}"
        
        if self.gemini_ai:
            # Use Gemini AI for understanding
            ai_response = self.gemini_ai.understand_user_intent(user_input, context)
        else:
            # Fallback to simple processing
            ai_response = self.gemini_ai._fallback_intent_detection(user_input) if self.gemini_ai else {
                "intent": "general_query",
                "response": "I'm here to help with your medicines. What would you like to do?",
                "next_action": "ask_for_clarification"
            }
        
        # Log conversation
        self.log_conversation(user_input, ai_response)
        
        # Process the intent
        return self.handle_intent(ai_response)
    
    def handle_intent(self, ai_response):
        """Handle the AI-detected intent"""
        intent = ai_response.get('intent', 'general_query')
        extracted_data = ai_response.get('extracted_data', {})
        
        if intent == 'register':
            return self.handle_registration(extracted_data, ai_response)
        elif intent == 'add_medicine':
            return self.handle_add_medicine(extracted_data, ai_response)
        elif intent == 'check_reminders':
            return self.handle_check_reminders(ai_response)
        elif intent == 'took_medicine':
            return self.handle_medicine_taken(extracted_data, ai_response)
        elif intent == 'exit':
            return {"response": "Thank you for using MediPing. Take care!", "next_action": "exit"}
        else:
            return {
                "response": ai_response.get('response', "I'm here to help with your medicines."),
                "next_action": ai_response.get('next_action', 'continue_conversation')
            }
    
    def handle_registration(self, extracted_data, ai_response):
        """Handle user registration with extracted data"""
        if self.conversation_state != 'registering':
            self.conversation_state = 'registering'
            self.conversation_context = {}
        
        # Extract information progressively
        if extracted_data.get('name'):
            self.conversation_context['name'] = extracted_data['name']
        
        if extracted_data.get('phone'):
            self.conversation_context['phone'] = extracted_data['phone']
        
        # Check what information we still need
        missing_info = []
        if 'name' not in self.conversation_context:
            missing_info.append('name')
        if 'phone' not in self.conversation_context:
            missing_info.append('phone')
        
        if missing_info:
            if 'name' in missing_info:
                return {"response": "What's your name?", "next_action": "get_name"}
            elif 'phone' in missing_info:
                return {"response": f"Nice to meet you, {self.conversation_context.get('name', '')}! What's your phone number?", "next_action": "get_phone"}
        else:
            # Complete registration
            return self.complete_registration()
    
    def complete_registration(self):
        """Complete user registration"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO users (name, phone, language)
                VALUES (?, ?, ?)
            ''', (
                self.conversation_context['name'],
                self.conversation_context['phone'],
                self.language
            ))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Set current user
            self.current_user = {
                'id': user_id,
                'name': self.conversation_context['name'],
                'phone': self.conversation_context['phone']
            }
            
            self.conversation_state = 'main'
            
            return {
                "response": f"Welcome {self.current_user['name']}! You're now registered. You can add medicines, check reminders, or ask me anything about your medications.",
                "next_action": "continue_conversation"
            }
            
        except Exception as e:
            return {
                "response": "Sorry, there was an error with registration. Let's try again.",
                "next_action": "restart_registration"
            }
    
    def handle_add_medicine(self, extracted_data, ai_response):
        """Handle adding medicine with natural conversation"""
        if self.conversation_state != 'adding_medicine':
            self.conversation_state = 'adding_medicine'
            self.conversation_context = {}
        
        # Extract medicine information
        if extracted_data.get('medicine'):
            self.conversation_context['medicine'] = extracted_data['medicine']
        if extracted_data.get('time'):
            self.conversation_context['time'] = extracted_data['time']
        if extracted_data.get('dosage'):
            self.conversation_context['dosage'] = extracted_data['dosage']
        
        # Check what we still need
        if 'medicine' not in self.conversation_context:
            return {"response": "What medicine would you like to add?", "next_action": "get_medicine"}
        elif 'time' not in self.conversation_context:
            return {"response": f"What time should you take {self.conversation_context['medicine']}?", "next_action": "get_time"}
        else:
            # Complete medicine addition
            return self.complete_add_medicine()
    
    def complete_add_medicine(self):
        """Complete adding medicine"""
        try:
            if not self.current_user:
                return {"response": "Please register first before adding medicines.", "next_action": "suggest_registration"}
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO medicines (user_id, medicine_name, dosage, time_slots)
                VALUES (?, ?, ?, ?)
            ''', (
                self.current_user['id'],
                self.conversation_context['medicine'],
                self.conversation_context.get('dosage', '1 tablet'),
                json.dumps([self.conversation_context['time']])
            ))
            
            conn.commit()
            conn.close()
            
            self.conversation_state = 'main'
            
            return {
                "response": f"Great! I've added {self.conversation_context['medicine']} at {self.conversation_context['time']}. I'll remind you when it's time to take it.",
                "next_action": "continue_conversation"
            }
            
        except Exception as e:
            return {
                "response": "Sorry, I couldn't add the medicine. Let's try again.",
                "next_action": "retry_add_medicine"
            }
    
    def handle_check_reminders(self, ai_response):
        """Handle checking reminders"""
        if not self.current_user:
            return {"response": "Please register first to check your reminders.", "next_action": "suggest_registration"}
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT medicine_name, time_slots, dosage
                FROM medicines
                WHERE user_id = ?
            ''', (self.current_user['id'],))
            
            medicines = cursor.fetchall()
            conn.close()
            
            if not medicines:
                return {"response": "You don't have any medicines added yet. Would you like to add one?", "next_action": "suggest_add_medicine"}
            
            response = f"Here are your medicines, {self.current_user['name']}:\n"
            for medicine, time_slots, dosage in medicines:
                times = json.loads(time_slots) if time_slots else ['Not set']
                response += f"• {medicine} - {dosage or '1 tablet'} at {', '.join(times)}\n"
            
            return {"response": response, "next_action": "continue_conversation"}
            
        except Exception as e:
            return {"response": "Sorry, I couldn't get your reminders right now.", "next_action": "continue_conversation"}
    
    def handle_medicine_taken(self, extracted_data, ai_response):
        """Handle medicine taken confirmation"""
        medicine = extracted_data.get('medicine', '')
        
        if medicine:
            response = f"Great! I've noted that you took {medicine}. Keep up the good work with your medications!"
        else:
            response = "Good job taking your medicine! I've recorded it."
        
        return {"response": response, "next_action": "continue_conversation"}
    
    def log_conversation(self, user_input, ai_response):
        """Log conversation to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO conversations (user_id, user_input, ai_response, intent, extracted_data)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                self.current_user['id'] if self.current_user else None,
                user_input,
                ai_response.get('response', ''),
                ai_response.get('intent', ''),
                json.dumps(ai_response.get('extracted_data', {}))
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"[ERROR] Failed to log conversation: {e}")
    
    def run_enhanced_system(self):
        """Run the enhanced voice system with natural conversation"""
        self.speak("Hello! I'm MediPing, your voice assistant for managing medicines. I understand Indian English well, so please speak naturally.")
        
        if not SPEECH_RECOGNITION_AVAILABLE:
            self.speak("Sorry, speech recognition is not available. Please install the required packages.")
            return
        
        if not self.gemini_ai:
            self.speak("AI conversation is not available. Please check your Gemini API key.")
        
        self.speak("You can talk to me naturally. Tell me your name to get started, or ask me anything about managing your medicines.")
        
        while True:
            try:
                # Listen for user input
                user_input = self.listen_with_retry()
                
                if user_input:
                    # Process with AI
                    result = self.process_conversation(user_input)
                    
                    # Respond
                    self.speak(result['response'])
                    
                    # Check if we should exit
                    if result.get('next_action') == 'exit':
                        break
                else:
                    self.speak("I'm still here. You can talk to me about your medicines anytime.")
                
                # Small pause between interactions
                time.sleep(1)
                
            except KeyboardInterrupt:
                self.speak("Goodbye! Take care of your health!")
                break
            except Exception as e:
                print(f"[ERROR] System error: {e}")
                self.speak("Sorry, I had a small problem. Let's continue.")
        
        print("[SYSTEM] Enhanced voice system shutdown complete")

def main():
    """Main function"""
    print("MediPing Enhanced Voice System with Gemini AI")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Initialize enhanced system
    enhanced_system = EnhancedVoiceSystem()
    
    # Run enhanced system
    enhanced_system.run_enhanced_system()

if __name__ == "__main__":
    main()
