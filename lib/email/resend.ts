import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactElement;
  from?: string;
}

export async function sendEmail({ 
  to, 
  subject, 
  html, 
  react,
  from = process.env.RESEND_FROM_EMAIL || 'notifications@turnsmanagement.com' 
}: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
      react,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendBatch(emails: EmailOptions[]) {
  try {
    const results = await Promise.all(
      emails.map(email => sendEmail(email))
    );
    return results;
  } catch (error) {
    console.error('Error sending batch emails:', error);
    return [];
  }
}