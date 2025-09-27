# Supabase Migration Guide

## Overview
This document outlines the migration from MySQL/Sequelize to Supabase (PostgreSQL) for the MediPing application.

## Migration Summary

### What Changed
1. **Database**: Migrated from MySQL to PostgreSQL (Supabase)
2. **ORM**: Replaced Sequelize with direct Supabase client calls
3. **Schema**: Updated to use the new comprehensive medical schema
4. **Models**: Completely rewritten to use Supabase patterns

### New Database Schema
The new schema includes:
- `profiles` - User profiles (patients, doctors, admins)
- `patients` - Patient-specific information
- `doctors` - Doctor-specific information with specializations
- `prescription_records` - Prescription records
- `prescription_drugs` - Individual drugs in prescriptions
- `reminder_schedule` - Scheduled medication reminders
- `reminder_attempts` - Tracking of reminder delivery attempts
- `medical_history` - Patient medical history
- `specializations` - Medical specializations
- `allergies_master` - Master list of allergies
- `drugs` - Master list of drugs

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
npm uninstall mysql2 sequelize
```

### 2. Environment Configuration
Copy `env-template.txt` to `.env` and update with your Supabase credentials:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Execute the provided SQL schema in your Supabase SQL editor to create all tables and relationships.

### 4. Data Migration (if needed)
If you have existing data, you'll need to:
1. Export data from MySQL
2. Transform it to match the new schema
3. Import into Supabase

## File Changes

### New Files Created
- `config/supabase.js` - Supabase client configuration
- `model/profiles.js` - Profile model
- `model/patients.js` - Patient model
- `model/doctors.js` - Doctor model
- `model/prescriptions.js` - Prescription models
- `model/reminders.js` - Reminder models
- `model/specializations.js` - Specialization model
- `model/allergies.js` - Allergies model
- `model/medicalHistory.js` - Medical history model

### Modified Files
- `package.json` - Updated dependencies
- `model/index.js` - New model exports with legacy compatibility
- `controller/remainder_controller.js` - Updated to ES6 modules
- `services/reminderScheduler.js` - Updated to use Supabase models
- `services/responseTracker.js` - Updated imports
- `index.js` - Minor updates for error handling
- `env-template.txt` - Updated for Supabase

### Removed Dependencies
- `mysql2`
- `sequelize`

## Legacy Compatibility

The migration includes legacy compatibility layers:
- `User` class maps to `Profile` + `Patient`
- `MedicineReminder` class maps to the new reminder system
- Existing API endpoints continue to work

## Key Differences

### Before (Sequelize)
```javascript
const user = await User.findOne({ where: { PhoneNumber: phone } });
```

### After (Supabase)
```javascript
const user = await Patient.findByMobileNumber(phone);
```

## Testing

1. **Install dependencies**: `npm install`
2. **Set up environment**: Configure `.env` with Supabase credentials
3. **Run the application**: `npm start`
4. **Test endpoints**:
   - GET `/users` - Should return users
   - GET `/reminder-status` - Should return reminder status
   - POST `/register` - Should register new users

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set

2. **Schema not created**
   - Run the provided SQL schema in Supabase SQL editor

3. **Permission errors**
   - Check Row Level Security (RLS) policies in Supabase
   - Ensure your service key has proper permissions

4. **Legacy code issues**
   - Some legacy patterns may need additional updates
   - Check console for specific error messages

## Next Steps

1. **Test thoroughly** - Verify all functionality works
2. **Update RLS policies** - Set up proper security in Supabase
3. **Optimize queries** - Review and optimize Supabase queries
4. **Add indexes** - Add database indexes for performance
5. **Monitor performance** - Use Supabase dashboard for monitoring

## Benefits of Migration

1. **Better Schema Design** - More normalized and comprehensive
2. **Real-time Features** - Supabase provides real-time subscriptions
3. **Built-in Auth** - Supabase auth system available
4. **Better Scaling** - PostgreSQL scales better than MySQL
5. **Modern Tooling** - Better development experience

## Support

For issues with this migration:
1. Check the console logs for specific errors
2. Verify Supabase configuration
3. Ensure all SQL schema is properly applied
4. Test individual model methods in isolation

---

**Note**: This migration maintains backward compatibility where possible, but some advanced features may require additional updates to fully utilize the new schema capabilities.
