import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalReminderRequest {
  type: 'sales' | 'expenses' | 'purchase_orders';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type }: ApprovalReminderRequest = await req.json();

    console.log(`Sending reminder for ${type}...`);

    // Get pending items based on type
    let pendingItems = [];
    let approversToNotify = [];

    if (type === 'sales') {
      // Get pending sales and find who needs to approve them
      const { data: pendingSales } = await supabase
        .from('sales')
        .select('*')
        .in('status', ['pending', 'accountant_approved']);

      if (pendingSales && pendingSales.length > 0) {
        // Get accountants for pending sales
        const accountantPendingSales = pendingSales.filter(sale => sale.status === 'pending');
        if (accountantPendingSales.length > 0) {
          const { data: accountants } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'accountant')
            .eq('is_active', true);
          
          if (accountants) {
            approversToNotify.push(...accountants.map(acc => ({
              ...acc,
              itemType: 'sales',
              count: accountantPendingSales.length,
              message: `You have ${accountantPendingSales.length} sales transactions pending your approval.`
            })));
          }
        }

        // Get managers for accountant-approved sales
        const managerPendingSales = pendingSales.filter(sale => sale.status === 'accountant_approved');
        if (managerPendingSales.length > 0) {
          const { data: managers } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'manager')
            .eq('is_active', true);
          
          if (managers) {
            approversToNotify.push(...managers.map(mgr => ({
              ...mgr,
              itemType: 'sales',
              count: managerPendingSales.length,
              message: `You have ${managerPendingSales.length} sales transactions pending your final approval.`
            })));
          }
        }
      }
    }

    if (type === 'expenses') {
      // Get pending expenses
      const { data: pendingExpenses } = await supabase
        .from('expenses')
        .select('*')
        .in('status', ['pending', 'accountant_approved', 'manager_approved']);

      if (pendingExpenses && pendingExpenses.length > 0) {
        // Notify accountants
        const accountantPending = pendingExpenses.filter(exp => exp.status === 'pending');
        if (accountantPending.length > 0) {
          const { data: accountants } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'accountant')
            .eq('is_active', true);
          
          if (accountants) {
            approversToNotify.push(...accountants.map(acc => ({
              ...acc,
              itemType: 'expenses',
              count: accountantPending.length,
              message: `You have ${accountantPending.length} expense requests pending your approval.`
            })));
          }
        }

        // Notify managers
        const managerPending = pendingExpenses.filter(exp => exp.status === 'accountant_approved');
        if (managerPending.length > 0) {
          const { data: managers } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'manager')
            .eq('is_active', true);
          
          if (managers) {
            approversToNotify.push(...managers.map(mgr => ({
              ...mgr,
              itemType: 'expenses',
              count: managerPending.length,
              message: `You have ${managerPending.length} expense requests pending your approval.`
            })));
          }
        }

        // Notify directors
        const directorPending = pendingExpenses.filter(exp => exp.status === 'manager_approved');
        if (directorPending.length > 0) {
          const { data: directors } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'director')
            .eq('is_active', true);
          
          if (directors) {
            approversToNotify.push(...directors.map(dir => ({
              ...dir,
              itemType: 'expenses',
              count: directorPending.length,
              message: `You have ${directorPending.length} expense requests pending your final approval.`
            })));
          }
        }
      }
    }

    // Send reminder emails
    const emailPromises = approversToNotify.map(async (approver) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "HIPEMART OILS <onboarding@resend.dev>",
          to: [approver.email],
          subject: `Approval Reminder - ${approver.count} ${approver.itemType} pending`,
          html: `
            <h2>HIPEMART OILS - Approval Reminder</h2>
            <p>Dear ${approver.full_name},</p>
            
            <p>${approver.message}</p>
            
            <p>Please log in to the system to review and process these pending approvals:</p>
            
            <a href="${supabaseUrl.replace('//', '//id-preview--')}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
              Access Dashboard
            </a>
            
            <p>Best regards,<br>
            HIPEMART OILS Management System</p>
            
            <hr>
            <small>This is an automated reminder. Please do not reply to this email.</small>
          `,
        });

        console.log(`Reminder sent to ${approver.email}:`, emailResponse);
        return { email: approver.email, success: true };
      } catch (error) {
        console.error(`Failed to send reminder to ${approver.email}:`, error);
        return { email: approver.email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Sent ${successful} reminders successfully, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      sent: successful,
      failed: failed,
      results: results
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-reminder function:", error);
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