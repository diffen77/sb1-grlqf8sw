import { supabase } from './supabase';

async function createAdminUser() {
  try {
    // Create the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'diffen@me.com',
      password: 'Password8',
    });

    if (signUpError) throw signUpError;
    
    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Update the profile to admin role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id);

    if (updateError) throw updateError;

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();