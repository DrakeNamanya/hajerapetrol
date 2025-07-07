
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  email: string;
  role: string;
  department: string;
  fullName: string;
  inviterName: string;
  businessName: string;
}

// Generate a secure random password
function generatePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Edge function started ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      console.error('Invalid request method:', req.method);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Method ${req.method} not allowed. Use POST.` 
        }), 
        { 
          status: 405, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 1: Validating environment variables...');
    // Validate environment variables first
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error: Missing Supabase credentials" 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    if (!resendApiKey) {
      console.error('Missing Resend API key');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error: Missing email service credentials" 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 2: Parsing request body...');
    // Parse and validate request body
    let requestBody;
    try {
      const bodyText = await req.text();
      if (!bodyText) {
        throw new Error("Empty request body");
      }
      requestBody = JSON.parse(bodyText);
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body" 
        }), 
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 3: Validating request fields...');
    const { email, role, department, fullName, inviterName, businessName }: CreateAccountRequest = requestBody;

    // Validate required fields
    const missingFields = [];
    if (!email) missingFields.push('email');
    if (!role) missingFields.push('role');
    if (!department) missingFields.push('department');
    if (!fullName) missingFields.push('fullName');
    if (!inviterName) missingFields.push('inviterName');
    if (!businessName) missingFields.push('businessName');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        }), 
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid email format" 
        }), 
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 4: Validating authorization...');
    // Get the inviter's ID from the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header required' 
        }), 
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 5: Initializing Supabase admin client...');
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const token = authHeader.replace('Bearer ', '');
    console.log('Step 6: Verifying inviter token...');
    
    const { data: { user: inviter }, error: inviterError } = await supabaseAdmin.auth.getUser(token);
    
    if (inviterError || !inviter) {
      console.error('Invalid authorization token:', inviterError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid authorization token: ${inviterError?.message || 'User not found'}` 
        }), 
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 7: Checking if email already exists...');
    // Check if email already exists
    const { data: existingUser, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (existingUserError) {
      console.error('Error checking existing users:', existingUserError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to check existing users: ${existingUserError.message}` 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const emailExists = existingUser?.users?.some(user => user.email?.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      console.error('Email already exists:', email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `An account with email ${email} already exists` 
        }), 
        { 
          status: 409, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 8: Generating password and creating user...');
    // Generate secure password
    const temporaryPassword = generatePassword(12);

    // Create user account directly using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create user account: ${authError.message}` 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    if (!authData.user) {
      console.error('User creation failed - no user data returned');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User creation failed - no user data returned' 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 9: Creating user profile...');
    // Create profile directly
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: role as any,
        department: department as any,
        created_by: inviter.id,
        is_active: true
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Failed to cleanup user after profile error:', deleteError);
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create user profile: ${profileError.message}` 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 10: Storing temporary credentials...');
    // Store temporary credentials
    const { error: credentialsError } = await supabaseAdmin
      .from('account_credentials')
      .insert({
        user_id: authData.user.id,
        email,
        temporary_password: temporaryPassword,
        is_password_changed: false
      });

    if (credentialsError) {
      console.error('Credentials storage error:', credentialsError);
      // Clean up on error
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Failed to cleanup user after credentials error:', deleteError);
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to store credentials: ${credentialsError.message}` 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log('Step 11: Sending credentials email...');
    // Initialize Resend client and send email
    const resend = new Resend(resendApiKey);

    try {
      const emailResponse = await resend.emails.send({
        from: "HIPEMART OILS <noreply@hipemartoils.com>",
        to: [email],
        subject: `Your ${businessName} Account Has Been Created`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${businessName}</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">BUKHALIHA ROAD, BUSIA</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e5e5;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to the Team!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hello <strong>${fullName}</strong>! <strong>${inviterName}</strong> has created your account for the <strong>${businessName}</strong> Multi-Department POS System.
              </p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0;">Your Account Details:</h3>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Role:</strong> ${role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Department:</strong> ${department.charAt(0).toUpperCase() + department.slice(1)}</p>
              </div>
              
              <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0;">🔐 Your Login Credentials:</h3>
                <p style="margin: 5px 0; color: #1e40af;"><strong>Email:</strong> <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e;">${email}</code></p>
                <p style="margin: 5px 0; color: #1e40af;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e;">${temporaryPassword}</code></p>
              </div>
              
              <h3 style="color: #1f2937; margin: 25px 0 15px 0;">📋 Getting Started:</h3>
              <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                <li><strong>Visit the login page</strong> - Go to the POS system website</li>
                <li><strong>Use your credentials</strong> - Login with the email and password above</li>
                <li><strong>Change your password</strong> - You'll be prompted to create a new password on first login</li>
                <li><strong>Start working</strong> - Access your department's features immediately</li>
              </ol>
              
              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>🔒 Security Notice:</strong> For security reasons, please change your password immediately after your first login. Keep your credentials secure and do not share them with anyone.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
                If you have any questions or issues with your account, please contact your system administrator.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>Powered by <strong>DATACOLLECTORS LTD</strong> | 0701634653</p>
            </div>
          </div>
        `,
      });

      if (emailResponse.error) {
        console.error("Email sending failed:", emailResponse.error);
        console.error("Full email response:", JSON.stringify(emailResponse, null, 2));
        
        // Check for specific Resend errors
        let errorMessage = `Failed to send credentials email: ${emailResponse.error.message}`;
        
        if (emailResponse.error.message?.includes('You can only send testing emails to your own email address')) {
          errorMessage = `🚫 Resend Sandbox Limitation

You can only send emails to: drnamanya@gmail.com

To send to other emails, you need to:
1. Verify your domain at resend.com/domains 
2. Upgrade to a paid plan at resend.com/settings/billing

For testing, please use: drnamanya@gmail.com`;
        }
        
        // Clean up created account if email fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('Failed to cleanup user after email error:', deleteError);
        }
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMessage
          }), 
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }

      console.log("Step 12: Success! Account created and email sent");
      console.log("Account creation email sent successfully:", emailResponse.data);

      const successResponse = {
        success: true, 
        message: "Account created successfully and credentials sent via email",
        userId: authData.user.id,
        email: email,
        emailId: emailResponse.data?.id
      };

      console.log('=== Edge function completed successfully ===');

      return new Response(JSON.stringify(successResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (emailError: any) {
      console.error("Email sending error:", emailError);
      // Clean up created account if email fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Failed to cleanup user after email error:', deleteError);
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send credentials email: ${emailError.message}` 
        }), 
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

  } catch (error: any) {
    console.error("=== Edge function error ===");
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return a proper error response
    const errorMessage = error.message || 'An unexpected error occurred';
    const statusCode = error.message?.includes('Authorization') ? 401 :
                      error.message?.includes('Method') && error.message?.includes('not allowed') ? 405 :
                      error.message?.includes('Missing required fields') ? 400 :
                      error.message?.includes('already exists') ? 409 : 500;

    const errorResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };

    console.log('Error response:', errorResponse);
    console.log('=== Edge function completed with error ===');

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: statusCode,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
