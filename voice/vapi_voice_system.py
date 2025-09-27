#!/usr/bin/env python3
"""
MediPing Voice System with Supabase Integration
Real-time voice-to-voice conversation with comprehensive medical database
"""

import os
import sys
import json
import time
import platform
import requests
import uuid
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from supabase import create_client, Client
from typing import Optional, List, Dict, Any

# Set UTF-8 encoding for Windows
if platform.system() == "Windows":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

class MediPingSupabaseServer:
    """MediPing Backend Server with Supabase Integration"""

    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)

        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Supabase configuration
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')

        if not self.supabase_url or not self.supabase_key:
            self.logger.error("SUPABASE_URL or SUPABASE_ANON_KEY not found in environment")
            self.logger.error("Please add these to your .env file")
            sys.exit(1)

        # Initialize Supabase client
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

        # Vapi API configuration
        self.vapi_api_key = os.getenv('VAPI_API_KEY')
        self.vapi_base_url = "https://api.vapi.ai"
        self.assistant_id = None

        # Current session tracking
        self.current_sessions = {}

        # Initialize routes and assistant
        self.setup_routes()
        self.assistant_id = self.get_or_create_assistant()

        self.logger.info("MediPing Supabase Server initialized")
        if self.vapi_api_key:
            self.logger.info(f"Using Vapi API key: {self.vapi_api_key[:10]}...")

    def setup_routes(self):
        """Set up Flask routes"""

        @self.app.route('/')
        def index():
            """Serve the web interface"""
            return render_template_string(WEB_INTERFACE_TEMPLATE, 
                                        assistant_id=self.assistant_id or "99becbc5-75c1-4292-8339-79f53a8b63e2",
                                        public_key=os.getenv('VAPI_PUBLIC_KEY', '75e169a6-d1f6-45ff-b787-561171e140a0'))

        @self.app.route('/vapi/functions', methods=['POST'])
        def handle_vapi_functions():
            """Handle function calls from Vapi"""
            try:
                data = request.json
                self.logger.info(f"Received function call: {data}")

                # Extract function call data
                message = data.get('message', {})
                function_call = message.get('functionCall', {})
                call_id = data.get('call', {}).get('id', 'unknown')

                function_name = function_call.get('name')
                parameters = function_call.get('parameters', {})

                if not function_name:
                    return jsonify({"error": "No function name provided"}), 400

                # Handle the function call with session context
                result = self.handle_function_call(function_name, parameters, call_id)

                return jsonify({"result": result})

            except Exception as e:
                self.logger.error(f"Function call error: {e}")
                return jsonify({"error": str(e)}), 500

        @self.app.route('/api/assistant-id')
        def get_assistant_id():
            """Get the assistant ID for frontend"""
            return jsonify({
                "assistantId": self.assistant_id or "99becbc5-75c1-4292-8339-79f53a8b63e2",
                "publicKey": os.getenv('VAPI_PUBLIC_KEY', '75e169a6-d1f6-45ff-b787-561171e140a0')
            })

        @self.app.route('/health')
        def health_check():
            """Health check endpoint"""
            try:
                # Test Supabase connection
                test_result = self.supabase.table('profiles').select('id').limit(1).execute()
                supabase_status = "connected"
            except Exception as e:
                supabase_status = f"error: {str(e)}"

            return jsonify({
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "database": supabase_status,
                "vapi_configured": bool(self.vapi_api_key)
            })

    def get_or_create_assistant(self):
        """Get existing assistant or create new one"""
        if not self.vapi_api_key:
            return "99becbc5-75c1-4292-8339-79f53a8b63e2"  # Default assistant ID

        try:
            # Try to get existing assistants
            headers = {
                "Authorization": f"Bearer {self.vapi_api_key}",
                "Content-Type": "application/json"
            }

            response = requests.get(
                f"{self.vapi_base_url}/assistant",
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                assistants = response.json()

                # Look for existing MediPing assistant
                for assistant in assistants:
                    if assistant.get('name') == 'MediPing Medical Assistant':
                        self.logger.info(f"Found existing assistant: {assistant['id']}")
                        return assistant['id']

            # Create new assistant if none found
            return self.create_vapi_assistant()

        except Exception as e:
            self.logger.error(f"Error getting assistant: {e}")
            return "99becbc5-75c1-4292-8339-79f53a8b63e2"

    def create_vapi_assistant(self):
        """Create a new Vapi assistant configured for medical use"""
        
        server_url = os.getenv('SERVER_URL', 'http://localhost:5000')
        
        assistant_config = {
            "name": "MediPing Medical Assistant",
            "model": {
                "provider": "openai",
                "model": "gpt-4",
                "temperature": 0.2,
                "systemMessage": """You are MediPing, an advanced voice-based medical assistant for Indian patients. You understand Hindi, English, and Hinglish perfectly.

Your capabilities:
- Patient registration and profile management
- Prescription tracking and medication reminders
- Medical history management
- Allergy tracking
- Doctor and clinic information

Key behaviors:
1. Be professional yet conversational - healthcare requires trust
2. Understand Indian medical terminology and local language patterns
3. Always prioritize patient safety and accuracy
4. Extract medical information carefully and confirm details
5. Be patient with elderly users and those with limited tech experience
6. Handle emergency situations with urgency and care

Medical terminology understanding:
- "BP" = blood pressure, "sugar" = diabetes
- "dawa/medicine/tablet/goli" = medication
- "doctor sahab/doc" = doctor
- "clinic/hospital" = healthcare facility
- "allergy/reaction" = allergic reactions
- "emergency contact" = family contact for emergencies

When handling medical data:
- Always confirm medication names, dosages, and timings
- Verify allergy information carefully
- Ensure emergency contacts are valid
- Handle prescription data with precision
- Maintain patient confidentiality

Respond naturally in Hindi-English mix that Indians understand. Always confirm critical medical information before processing."""
            },
            "voice": {
                "provider": "11labs",
                "voiceId": "pNInz6obpgDQGcFmaJgB",
                "stability": 0.6,
                "similarityBoost": 0.8,
                "style": 0.2,
                "useSpeakerBoost": True
            },
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-2",
                "language": "en-IN",
                "smartFormat": True,
                "keywords": ["medicine", "dawa", "tablet", "BP", "diabetes", "doctor", "allergy", "prescription"]
            },
            "firstMessage": "Namaste! Main MediPing hun, aapka medical assistant. Aap apni health, medicines, aur prescriptions ke baare mein Hindi ya English mein baat kar sakte hain. How can I help you today?",
            "endCallMessage": "Apna khayal rakhiye aur medicines time par lena. If any emergency, immediately contact your doctor. Take care!",
            "recordingEnabled": True,
            "hipaaEnabled": True,
            "serverUrl": f"{server_url}/vapi/functions",
            "serverUrlSecret": "mediping_medical_secret_2024",
            "functions": [
                {
                    "name": "register_patient",
                    "description": "Register a new patient with complete medical profile",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Patient's full name"},
                            "mobile_number": {"type": "string", "description": "Patient's mobile number"},
                            "age": {"type": "integer", "description": "Patient's age"},
                            "gender": {"type": "string", "enum": ["male", "female", "other"], "description": "Patient's gender"},
                            "emergency_contact": {"type": "string", "description": "Emergency contact number"},
                            "blood_group": {"type": "string", "description": "Patient's blood group"},
                            "timezone_offset": {"type": "integer", "description": "Timezone offset in hours (default +5:30 for India)"}
                        },
                        "required": ["name", "mobile_number", "age", "gender", "emergency_contact"]
                    }
                },
                {
                    "name": "check_medications",
                    "description": "Get current medications and reminders for a patient",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_mobile": {"type": "string", "description": "Patient's mobile number"}
                        },
                        "required": ["patient_mobile"]
                    }
                }
            ]
        }

        try:
            headers = {
                "Authorization": f"Bearer {self.vapi_api_key}",
                "Content-Type": "application/json"
            }

            response = requests.post(
                f"{self.vapi_base_url}/assistant",
                headers=headers,
                json=assistant_config,
                timeout=30
            )

            if response.status_code == 201:
                assistant = response.json()
                self.logger.info(f"Medical assistant created: {assistant['id']}")
                return assistant['id']
            else:
                self.logger.error(f"Failed to create assistant: {response.status_code}")
                self.logger.error(f"Response: {response.text}")
                return None

        except Exception as e:
            self.logger.error(f"Assistant creation failed: {e}")
            return None

    def handle_function_call(self, function_name: str, parameters: Dict[str, Any], call_id: str):
        """Handle function calls from Vapi assistant"""

        try:
            if function_name == "register_patient":
                return self.register_patient(parameters, call_id)

            elif function_name == "check_medications":
                return self.check_medications(parameters)

            else:
                return {"error": f"Unknown function: {function_name}"}

        except Exception as e:
            self.logger.error(f"Function execution error: {e}")
            return {"error": f"Function execution failed: {str(e)}"}

    def register_patient(self, params: Dict[str, Any], call_id: str):
        """Register a new patient in the system"""
        try:
            mobile_number = params.get('mobile_number')
            name = params.get('name')
            age = params.get('age')
            gender = params.get('gender', 'other')
            emergency_contact = params.get('emergency_contact')
            blood_group = params.get('blood_group')
            timezone_offset = params.get('timezone_offset', 330)  # IST offset in minutes

            # Check if patient already exists
            existing = self.supabase.table('profiles').select('*').eq('mobile_number', mobile_number).execute()

            if existing.data:
                # Store session info for existing user
                self.current_sessions[call_id] = {
                    'patient_id': existing.data[0]['id'],
                    'mobile_number': mobile_number,
                    'name': existing.data[0]['name']
                }

                return {
                    "success": True,
                    "message": f"Welcome back {existing.data[0]['name']}! Aap already registered hain.",
                    "patient_id": existing.data[0]['id']
                }

            # Create new profile
            profile_data = {
                'mobile_number': mobile_number,
                'name': name,
                'age': age,
                'gender': gender,
                'role': 'patient'
            }

            profile_result = self.supabase.table('profiles').insert(profile_data).execute()

            if not profile_result.data:
                raise Exception("Failed to create profile")

            patient_id = profile_result.data[0]['id']

            # Store session info
            self.current_sessions[call_id] = {
                'patient_id': patient_id,
                'mobile_number': mobile_number,
                'name': name
            }

            self.logger.info(f"Patient registered: {name} ({mobile_number})")

            return {
                "success": True,
                "message": f"Welcome {name}! Aap successfully register ho gaye hain MediPing mein. Ab aap apni medicines aur prescriptions manage kar sakte hain.",
                "patient_id": patient_id
            }

        except Exception as e:
            self.logger.error(f"Patient registration failed: {e}")
            return {
                "success": False,
                "message": "Registration mein problem hui. Phir se try kijiye."
            }

    def check_medications(self, params: Dict[str, Any]):
        """Get current medications for a patient - simplified for demo"""
        try:
            patient_mobile = params.get('patient_mobile')

            # Find patient
            patient_result = self.supabase.table('profiles').select('id, name').eq('mobile_number', patient_mobile).execute()

            if not patient_result.data:
                return {
                    "success": False,
                    "message": "Patient nahi mila. Mobile number check kijiye."
                }

            patient_name = patient_result.data[0]['name']

            return {
                "success": True,
                "message": f"{patient_name}, aapki medications check kar raha hun. Abhi demo mode mein hai, jaldi hi complete system ready hoga.",
                "medications": []
            }

        except Exception as e:
            self.logger.error(f"Check medications failed: {e}")
            return {
                "success": False,
                "message": "Medications check karne mein problem hui."
            }

    def run(self, host='0.0.0.0', port=5000, debug=False):
        """Run the Flask server"""
        self.logger.info(f"Starting MediPing Supabase Server on {host}:{port}")
        self.logger.info(f"Supabase URL: {self.supabase_url}")
        self.app.run(host=host, port=port, debug=debug)

# Simple Web Interface Template
WEB_INTERFACE_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediPing - Medical Voice Assistant</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh; padding: 20px;
        }
        .container {
            max-width: 800px; margin: 0 auto;
            background: rgba(255,255,255,0.1); border-radius: 24px; padding: 40px;
            backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { text-align: center; font-size: 3rem; margin-bottom: 15px; }
        .subtitle { text-align: center; font-size: 1.4rem; margin-bottom: 40px; opacity: 0.9; }
        .status { text-align: center; margin: 30px 0; font-size: 1.3rem; min-height: 40px; }
        .voice-button {
            display: block; margin: 30px auto; padding: 20px 40px; font-size: 1.4rem;
            background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white;
            border: none; border-radius: 50px; cursor: pointer; font-weight: 700; min-width: 250px;
        }
        .voice-button:hover { transform: translateY(-3px); }
        .voice-button:disabled { background: #666; cursor: not-allowed; }
        .instructions {
            background: rgba(255,255,255,0.1); border-radius: 16px; padding: 30px; margin: 30px 0;
        }
        .instructions h3 { margin-bottom: 20px; color: #fdcb6e; text-align: center; }
        .instructions ul { list-style: none; }
        .instructions li { margin: 12px 0; padding: 12px 15px; background: rgba(255,255,255,0.05); border-radius: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏥 MediPing</h1>
        <div class="subtitle">Voice-Powered Medical Assistant</div>
        <div class="status" id="status">Loading medical system...</div>
        <button class="voice-button" id="voiceButton" onclick="startVoiceChat()" disabled>🔄 Loading...</button>
        
        <div class="instructions">
            <h3>🗣️ How to Use MediPing:</h3>
            <ul>
                <li>"Namaste, mera naam Rajesh hai" - Register yourself</li>
                <li>"Kya medicines hain mere paas?" - Check your medications</li>
                <li>Mix Hindi-English naturally as you speak!</li>
            </ul>
        </div>
    </div>

    <script type="module">
        import Vapi from 'https://cdn.skypack.dev/@vapi-ai/web-sdk';
        
        class MediPingVoiceAssistant {
            constructor() {
                this.vapi = null;
                this.isActive = false;
                this.assistantId = "{{ assistant_id }}";
                this.publicKey = "{{ public_key }}";
                
                this.statusEl = document.getElementById('status');
                this.buttonEl = document.getElementById('voiceButton');
                
                this.initializeVapi();
            }

            async initializeVapi() {
                try {
                    this.vapi = new Vapi(this.publicKey);
                    
                    this.vapi.on('call-start', () => {
                        this.updateStatus('🎙️ Voice chat active - Speak naturally!');
                        this.updateButton('🛑 End Chat');
                        this.isActive = true;
                    });

                    this.vapi.on('call-end', () => {
                        this.updateStatus('Voice chat ended. Click to start again.');
                        this.updateButton('🎤 Start Voice Chat');
                        this.isActive = false;
                    });

                    this.vapi.on('error', (error) => {
                        console.error('Vapi error:', error);
                        this.updateStatus('Error occurred. Please try again.');
                        this.updateButton('🎤 Start Voice Chat');
                        this.isActive = false;
                    });

                    this.updateStatus('✅ Ready! Click "Start Voice Chat" to begin');
                    this.updateButton('🎤 Start Voice Chat');
                    this.buttonEl.disabled = false;

                } catch (error) {
                    console.error('Failed to initialize Vapi:', error);
                    this.updateStatus('❌ Failed to load voice system');
                    this.updateButton('❌ System Error');
                }
            }

            async toggleVoiceChat() {
                if (this.isActive) {
                    this.vapi.stop();
                } else {
                    try {
                        this.updateStatus('🔄 Starting voice chat...');
                        await this.vapi.start(this.assistantId);
                    } catch (error) {
                        console.error('Failed to start voice chat:', error);
                        this.updateStatus('❌ Failed to start. Please try again.');
                        this.updateButton('🎤 Start Voice Chat');
                    }
                }
            }

            updateStatus(text) { this.statusEl.textContent = text; }
            updateButton(text) { this.buttonEl.textContent = text; }
        }

        let assistant;
        window.startVoiceChat = function() {
            if (assistant) assistant.toggleVoiceChat();
        };

        document.addEventListener('DOMContentLoaded', () => {
            assistant = new MediPingVoiceAssistant();
        });
    </script>
</body>
</html>
'''

def main():
    """Main function to run the MediPing server"""
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    print("🏥 MediPing Voice System Starting...")
    print("=" * 50)
    
    # Initialize server
    server = MediPingSupabaseServer()
    
    # Run server
    port = int(os.getenv('PORT', 5000))
    print(f"\n🚀 Starting server on port {port}")
    print(f"📱 Open http://localhost:{port} for the medical interface")
    
    server.run(host='0.0.0.0', port=port, debug=True)

if __name__ == "__main__":
    main()
