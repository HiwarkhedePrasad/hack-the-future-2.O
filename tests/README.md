# MediPing Test Suite

This folder contains all test files for the MediPing enhanced medicine reminder system.

## 📋 Test Files Overview

### **Core Functionality Tests**

#### **Medicine Reminder Tests**
- **`test-reminder.js`** - Basic medicine reminder functionality
- **`test-enhanced-reminders.js`** - Comprehensive enhanced reminder system testing
- **`test-simple-reminder.js`** - Simple reminder flow testing
- **`test-existing-user-reminder.js`** - Reminder testing with existing users
- **`test-local-reminders.js`** - Local testing without Twilio (bypasses message limits)

#### **User Registration Tests**
- **`test-registration.js`** - User registration flow testing
- **`test-complete-flow.js`** - End-to-end user journey testing
- **`test-whatsapp-phone.js`** - WhatsApp phone number handling testing

#### **Language Support Tests**
- **`test-indian-languages.js`** - Indian language options testing
- **`test-language-prompt.js`** - Language prompt verification
- **`test-specific-languages.js`** - Specific Indian language testing

### **Database & Setup Tests**

#### **Database Management**
- **`setup.js`** - Database setup and initial data population
- **`update-database.js`** - Database schema migration for enhanced reminders
- **`cleanup-duplicates.js`** - Clean up duplicate phone number entries

#### **Verification Tests**
- **`verify-reminders.js`** - Database verification for medicine reminders
- **`verify-enhanced-reminders.js`** - Enhanced reminder database verification

## 🚀 How to Run Tests

### **Prerequisites**
1. Ensure your `.env` file is configured with database and API credentials
2. Make sure the database is running
3. Install dependencies: `npm install`

### **Running Individual Tests**

```bash
# From the project root directory
node tests/setup.js                    # Setup database
node tests/test-enhanced-reminders.js  # Test enhanced reminder system
node tests/test-local-reminders.js     # Local testing (no Twilio)
node tests/verify-enhanced-reminders.js # Verify database state
```

### **Running All Tests (Recommended Order)**

```bash
# 1. Setup database
node tests/setup.js

# 2. Update database schema (if needed)
node tests/update-database.js

# 3. Test core functionality
node tests/test-enhanced-reminders.js
node tests/test-local-reminders.js

# 4. Test user registration
node tests/test-registration.js
node tests/test-complete-flow.js

# 5. Test WhatsApp integration
node tests/test-whatsapp-phone.js

# 6. Test language support
node tests/test-indian-languages.js

# 7. Verify results
node tests/verify-enhanced-reminders.js
```

## 📊 Test Categories

### **✅ Functional Tests**
- Medicine reminder creation and storage
- User registration flow
- WhatsApp phone number handling
- Language selection

### **✅ Integration Tests**
- Database operations
- API interactions
- State management
- Error handling

### **✅ Verification Tests**
- Data integrity checks
- Database schema validation
- Relationship verification

## 🔧 Test Environment

### **Database Setup**
- Uses the same database configuration as production
- Creates test users and data
- Cleans up after testing

### **API Testing**
- Tests Gemini AI integration
- Tests Twilio WhatsApp integration
- Includes local testing options

### **State Management**
- Tests conversation state tracking
- Tests user registration state
- Tests medicine reminder state

## 📝 Test Results

### **Expected Outcomes**
- All tests should pass without errors
- Database should contain expected test data
- Enhanced reminder fields should be populated
- User relationships should be maintained

### **Common Issues**
- **Twilio Daily Limit**: Use `test-local-reminders.js` for local testing
- **Database Connection**: Ensure MySQL is running and credentials are correct
- **API Keys**: Verify Gemini and Twilio API keys are valid

## 🎯 Test Coverage

### **Core Features Tested**
- ✅ Enhanced medicine reminder system (5 types)
- ✅ Interactive user flow
- ✅ Date and time validation
- ✅ Notes system
- ✅ WhatsApp integration
- ✅ Indian language support
- ✅ Database schema updates
- ✅ Phone number normalization

### **Edge Cases Tested**
- ✅ Invalid input handling
- ✅ Error recovery
- ✅ State management
- ✅ Data validation
- ✅ Duplicate handling

## 📞 Support

If you encounter issues with any tests:
1. Check the database connection
2. Verify API credentials
3. Ensure all dependencies are installed
4. Review the test output for specific error messages

---

**Note**: Some tests may require Twilio API access. Use local testing options when Twilio daily limits are reached.
