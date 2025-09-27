// Test Supabase connection and schema
import supabase from './config/supabase.js';

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('\n📋 Schema not found. Please run the SQL schema in Supabase:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the contents of supabase_schema.sql');
        return false;
      }
    } else {
      console.log('✅ Supabase connection successful!');
      
      // Test each table
      const tables = [
        'profiles', 'patients', 'doctors', 'specializations',
        'prescription_records', 'prescription_drugs', 'reminder_schedule',
        'drugs', 'allergies_master', 'medical_history'
      ];
      
      console.log('\n🔍 Testing table access...');
      for (const table of tables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (tableError) {
            console.log(`❌ ${table}: ${tableError.message}`);
          } else {
            console.log(`✅ ${table}: OK`);
          }
        } catch (err) {
          console.log(`❌ ${table}: ${err.message}`);
        }
      }
      
      return true;
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Migration test completed successfully!');
    console.log('You can now start the application with: npm start');
  } else {
    console.log('\n⚠️ Please set up the database schema first.');
  }
  process.exit(success ? 0 : 1);
});
