const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  try {
    console.log('Step 1: Adding permission column to listings table...');
    
    // Use raw SQL query to add the permission column
    const { error: addColumnError } = await supabase
      .from('listings')
      .select('permission')
      .limit(1);
    
    if (addColumnError && addColumnError.message.includes('column "permission" does not exist')) {
      console.log('Permission column does not exist, need to add it manually via Supabase dashboard');
      console.log('Please go to your Supabase dashboard > Database > Tables > listings');
      console.log('And add a new column:');
      console.log('  - Name: permission');
      console.log('  - Type: text');
      console.log('  - Default value: private');
      console.log('  - Check constraint: permission IN (\'private\', \'link_only\', \'public\')');
      process.exit(1);
    } else if (addColumnError) {
      console.error('Unexpected error:', addColumnError);
      process.exit(1);
    } else {
      console.log('Permission column already exists!');
      console.log('Migration completed successfully!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();