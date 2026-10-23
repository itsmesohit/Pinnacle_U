import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Pinnacle University <auth@codingspark.in>';

// Initialize Resend if valid key provided
const resend = resendApiKey && resendApiKey.startsWith('re_') && !resendApiKey.includes('placeholder')
  ? new Resend(resendApiKey)
  : null;

interface SendOtpEmailParams {
  toEmail: string;
  name?: string;
  otp: string;
  purpose: 'REGISTER' | 'FORGOT_PASSWORD' | 'LOGIN';
}

export async function sendOtpEmail({
  toEmail,
  name = 'User',
  otp,
  purpose,
}: SendOtpEmailParams): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const isRegister = purpose === 'REGISTER';
  const isLogin = purpose === 'LOGIN';
  const subject = isRegister
    ? `🔐 ${otp} is your Pinnacle University Account Verification Code`
    : isLogin
    ? `🔐 ${otp} is your Pinnacle University Login Code`
    : `🔑 ${otp} is your Pinnacle University Password Reset Code`;

  const title = isRegister
    ? 'Verify Your Account'
    : isLogin
    ? 'One-Time Login Code'
    : 'Reset Your Password';

  const subtitle = isRegister
    ? 'Thank you for registering at Pinnacle University. Use the single-use OTP below to complete your account setup.'
    : isLogin
    ? 'Use the single-use verification code below to sign in to your Pinnacle University portal.'
    : 'We received a request to reset your Pinnacle University account password. Use this OTP to set your new password.';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
          .container { max-width: 520px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .logo-sub { font-size: 13px; color: #c7d2fe; font-weight: 500; margin-top: 4px; }
          .content { padding: 32px 28px; text-align: center; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
          .subtitle { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
          .otp-card { background-color: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; font-family: 'SF Mono', Monaco, Consolas, monospace; }
          .expiry-note { font-size: 12px; color: #cbd5e1; margin-top: 6px; }
          .footer { background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎓 Pinnacle University</div>
            <div class="logo-sub">Student & Academic Management System</div>
          </div>
          <div class="content">
            <div class="title">${title}</div>
            <div class="subtitle">
              Hello <strong>${name}</strong>,<br/>
              ${subtitle}
            </div>
            <div class="otp-card">
              <div class="otp-code">${otp}</div>
              <div class="expiry-note">⏱ Valid for 10 minutes only</div>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              If you did not request this code, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Pinnacle University SIS • Secured with Resend & Supabase
          </div>
        </div>
      </body>
    </html>
  `;

  // If real Resend client is initialized
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: resendFromEmail,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      if (response.error) {
        console.error('❌ Resend email error:', response.error);
        return { success: false, error: response.error.message };
      }

      console.log(`✉️ [Resend] Successfully sent OTP (${purpose}) to: ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error sending email via Resend:', err);
      return { success: false, error: err?.message || 'Failed to send email' };
    }
  }

  // Fallback simulator for local development / before user pastes API key
  console.log('\n======================================================');
  console.log(`🔔 [OTP SIMULATION - RESEND KEY NOT CONFIGURED YET]`);
  console.log(`📧 To: ${toEmail}`);
  console.log(`🎯 Purpose: ${purpose}`);
  console.log(`🔑 ONE-TIME CODE (OTP): >>> ${otp} <<<`);
  console.log(`⏱ Expires in 10 minutes`);
  console.log(`💡 Once you add RESEND_API_KEY in .env, real emails will be sent!`);
  console.log('======================================================\n');

  return { success: true, simulated: true };
}
