import 'server-only'
import { resend } from '@/lib/email/client'
import { env } from '@/env'

// Table-based layout + inline styles only — email clients (Outlook desktop
// especially) don't support flexbox/grid or <style> blocks reliably. System
// font stack, not Plus Jakarta Sans: @font-face support in email is too
// inconsistent to depend on.
function resetPasswordEmailHtml(url: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reset your Pipfolio password</title>
</head>
<body style="margin:0;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1E8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background-color:#FAF8F3;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 8px;text-align:center;">
            <span style="display:inline-block;width:40px;height:40px;line-height:40px;border-radius:10px;background-color:#C25E3A;color:#FAF8F3;font-weight:700;font-size:18px;">P</span>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 0;text-align:center;">
            <h1 style="margin:0;font-size:20px;line-height:1.3;color:#15140F;">Reset your password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 32px 0;text-align:center;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#6B6558;">
              Someone requested a password reset for your Pipfolio account. Click below to choose a new one — this link expires in 1 hour.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;text-align:center;">
            <a href="${url}" style="display:inline-block;padding:12px 28px;border-radius:10px;background-color:#C25E3A;color:#FAF8F3;font-size:14px;font-weight:600;text-decoration:none;">
              Reset password
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#948C7A;">
              If you didn't request this, you can safely ignore this email — your password won't change.
            </p>
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
        <tr>
          <td style="padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;line-height:1.6;color:#948C7A;">Pipfolio · XAU/USD trading journal</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim()
}

function resetPasswordEmailText(url: string): string {
  return [
    'Reset your Pipfolio password',
    '',
    'Someone requested a password reset for your Pipfolio account. Open the link below to choose a new one — it expires in 1 hour.',
    '',
    url,
    '',
    "If you didn't request this, you can safely ignore this email — your password won't change.",
  ].join('\n')
}

export async function sendResetPasswordEmail({ to, url }: { to: string; url: string }) {
  // resend.emails.send() returns an { error } object on failure rather than
  // throwing — surface it explicitly, otherwise a failed send looks identical
  // to a successful one to both better-auth and the caller.
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Reset your Pipfolio password',
    html: resetPasswordEmailHtml(url),
    text: resetPasswordEmailText(url),
  })
  if (error) throw new Error(`Failed to send reset password email: ${error.message}`)
}
