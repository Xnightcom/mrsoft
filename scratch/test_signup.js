import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `testuser_${Date.now()}@mrsoft.co`;
  const password = "Password123!";
  
  console.log(`Attempting signup for ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: "Test User", role: "student" }
    }
  });

  if (signUpError) {
    console.error("Signup error:", signUpError);
    return;
  }

  console.log("Signup success! User ID:", signUpData.user?.id);
  console.log("Waiting 3 seconds for database trigger to create profile...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("Fetching profile from database...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signUpData.user?.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
  } else {
    console.log("Profile row created:", profile);
  }
}

run();
