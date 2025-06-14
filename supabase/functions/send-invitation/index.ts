
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    console.log('Edge function started');
    
    // Use the API key directly for now
    const apiKey = "re_7BNBJN1e_ETaUfmqz2oTJU88eTSZAF11c";
    console.log('Using API key');

    const resend = new Resend(apiKey);

    const { email, role, department, inviterName, businessName }: InvitationEmailRequest = await req.json();

    console.log('Sending invitation email to:', email);

    const roleDisplay = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const departmentDisplay = department.charAt(0).toUpperCase() + department.slice(1);

    // Get the application URL - you can customize this based on your deployment
    const appUrl = "https://id-preview--f49e1457-bccf-4906-b3ff-cde5c8c01dc1.lovable.app";

    const emailResponse = await resend.emails.send({
      from: `${businessName} <onboarding@resend.dev>`,
      to: [email],
      subject: `You're invited to join ${businessName} team!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Team Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #5a6fd8; }
            .info-box { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .cta-section { text-align: center; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited!</h1>
              <p>Join the ${businessName} team</p>
            </div>
            <div class="content">
              <p>Hello!</p>
              
              <p><strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a <strong>${roleDisplay}</strong> in the <strong>${departmentDisplay}</strong> department.</p>
              
              <div class="info-box">
                <h3>Your Role Details:</h3>
                <ul>
                  <li><strong>Position:</strong> ${roleDisplay}</li>
                  <li><strong>Department:</strong> ${departmentDisplay}</li>
                  <li><strong>Company:</strong> ${businessName}</li>
                </ul>
              </div>
              
              <div class="cta-section">
                <p><strong>Ready to get started?</strong></p>
                <a href="${appUrl}" class="button">Join ${businessName} Team</a>
                <p><small>Click the button above to access the registration page</small></p>
              </div>
              
              <p>To accept this invitation and create your account:</p>
              
              <ol>
                <li>Click the "Join ${businessName} Team" button above, or visit: <br><a href="${appUrl}">${appUrl}</a></li>
                <li>Click "Sign Up" and use <strong>this exact email address</strong>: <code>${email}</code></li>
                <li>Complete the registration process</li>
                <li>You'll automatically be assigned your role and department</li>
              </ol>
              
              <p><strong>Important:</strong> You must sign up using the email address <code>${email}</code> to be automatically assigned your role.</p>
              
              <div class="info-box">
                <p><strong>⏰ This invitation expires in 7 days.</strong></p>
                <p>If you don't sign up within 7 days, please contact ${inviterName} for a new invitation.</p>
              </div>
              
              <p>We're excited to have you join our team!</p>
              
              <p>Best regards,<br>
              The ${businessName} Team</p>
            </div>
            <div class="footer">
              <p>This is an automated invitation email from ${businessName}.</p>
              <p>If you have trouble with the button above, copy and paste this link: ${appUrl}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
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
