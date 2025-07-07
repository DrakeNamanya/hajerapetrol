
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  role: string;
  department: string;
  inviterName: string;
  businessName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, department, inviterName, businessName }: InvitationEmailRequest = await req.json();

    console.log('Sending invitation email to:', email);

    const emailResponse = await resend.emails.send({
      from: "HIPEMART OILS <noreply@hipemartoils.com>",
      to: [email],
      subject: `Invitation to join ${businessName} POS System`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${businessName}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">BUKHALIHA ROAD, BUSIA</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e5e5;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">You're Invited to Join Our Team!</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hello! <strong>${inviterName}</strong> has invited you to join the <strong>${businessName}</strong> Multi-Department POS System.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0;">Your Role Assignment:</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Role:</strong> ${role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Department:</strong> ${department.charAt(0).toUpperCase() + department.slice(1)}</p>
            </div>
            
            <h3 style="color: #1f2937; margin: 25px 0 15px 0;">📋 Getting Started Instructions:</h3>
            <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
              <li><strong>Visit the signup page</strong> - Go to the POS system website</li>
              <li><strong>Use this exact email</strong> - Sign up using: <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px; color: #92400e;">${email}</code></li>
              <li><strong>Create your password</strong> - Choose a secure password (minimum 6 characters)</li>
              <li><strong>Confirm your email</strong> - Check your inbox for the confirmation link</li>
              <li><strong>Access granted</strong> - Once confirmed, you'll automatically receive your assigned role</li>
            </ol>
            
            <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>⚠️ Important:</strong> You must use the exact email address <strong>${email}</strong> when signing up. Using a different email will not grant you access to the system.
              </p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏰ Expiry Notice:</strong> This invitation expires in 7 days. Please complete your registration within this timeframe.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e5e5; padding-top: 20px;">
              If you have any questions or issues with the signup process, please contact the system administrator.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>Powered by <strong>DATACOLLECTORS LTD</strong> | 0701634653</p>
          </div>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invitation email sent successfully",
      data: emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
