
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
  console.log('Edge function called with method:', req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error("Invalid JSON in request body");
    }

    const { email, role, department, fullName, inviterName, businessName }: CreateAccountRequest = requestBody;

    // Validate required fields
    if (!email || !role || !department || !fullName || !inviterName || !businessName) {
      throw new Error("Missing required fields: email, role, department, fullName, inviterName, businessName");
    }

    console.log('Creating account for:', email, 'with role:', role, 'department:', department);

    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      throw new Error("Server configuration error: Missing Supabase credentials");
    }

    if (!resendApiKey) {
      console.error('Missing Resend API key');
      throw new Error("Server configuration error: Missing email service credentials");
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the inviter's ID from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: inviter }, error: inviterError } = await supabaseAdmin.auth.getUser(token);
    
    if (inviterError || !inviter) {
      console.error('Invalid authorization token:', inviterError);
      throw new Error('Invalid authorization token');
    }

    console.log('Inviter verified:', inviter.id);

    // Generate secure password
    const temporaryPassword = generatePassword(12);
    console.log('Generated temporary password for:', email);

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
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned');
    }

    console.log('Auth user created successfully:', authData.user.id);

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
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log('Profile created successfully');

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
      throw new Error(`Failed to store credentials: ${credentialsError.message}`);
    }

    console.log('Credentials stored successfully');

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Send credentials email using verified Resend domain
    try {
      const emailResponse = await resend.emails.send({
        from: "HIPEMART OILS <onboarding@resend.dev>", // Using verified Resend domain
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
        // Clean up created account if email fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          console.error('Failed to cleanup user after email error:', deleteError);
        }
        throw new Error(`Failed to send credentials email: ${emailResponse.error.message}`);
      }

      console.log("Account creation email sent successfully:", emailResponse.data);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Account created successfully and credentials sent via email",
        userId: authData.user.id,
        email: email,
        emailId: emailResponse.data?.id
      }), {
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
      throw new Error(`Failed to send credentials email: ${emailError.message}`);
    }

  } catch (error: any) {
    console.error("Error in create-team-account function:", error);
    
    // Return a proper error response
    const errorMessage = error.message || 'An unexpected error occurred';
    const statusCode = error.message?.includes('Authorization') ? 401 :
                      error.message?.includes('Method not allowed') ? 405 :
                      error.message?.includes('Missing required fields') ? 400 : 500;

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
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
