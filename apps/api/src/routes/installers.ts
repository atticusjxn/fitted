import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { env } from '../env.js';

const installerBody = z.object({
  fullName: z.string().min(1),
  businessName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(4),
  mobile: z.string().min(4),
  source: z.string().optional()
});

async function sendNotificationEmail(payload: {
  fullName: string;
  businessName: string;
  email?: string;
  phone: string;
  mobile?: string;
}) {
  if (!env.RESEND_API_KEY || !env.INSTALLER_SIGNUP_FROM_EMAIL) return;

  const toAddress = env.INSTALLER_SIGNUP_NOTIFY_EMAIL;
  const subject = `New installer signup: ${payload.businessName}`;
  const lines = [
    `Name: ${payload.fullName}`,
    `Business: ${payload.businessName}`,
    `Mobile: ${payload.mobile ?? 'n/a'}`,
    `Phone: ${payload.phone}`
  ];

  if (payload.email) {
    lines.push(`Email: ${payload.email}`);
  }

  const textBody = lines.join('\n');

  if (toAddress) {
    await sendResendEmail({
      to: toAddress,
      subject,
      text: textBody
    });
  }

  if (payload.email) {
    await sendResendEmail({
      to: payload.email,
      subject: 'Thanks for joining the Fitted installer network',
      text:
        'Thanks for registering with Fitted. We match you with customers right after checkout when intent is highest. We’ll review your details and reach out to confirm your coverage areas and booking link. — Team Fitted'
    });
  }
}

async function sendResendEmail(input: { to: string; subject: string; text: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: env.INSTALLER_SIGNUP_FROM_EMAIL ?? env.INSTALLER_SIGNUP_NOTIFY_EMAIL,
      to: input.to,
      subject: input.subject,
      text: input.text
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${message}`);
  }
}

export async function installerRoutes(app: FastifyInstance) {
  app.post('/installers', async (request, reply) => {
    const parsed = installerBody.safeParse(request.body);

    if (!parsed.success) {
      return reply.badRequest('Invalid installer signup payload');
    }

    const data = parsed.data;

    const { error } = await supabase.from('installer_signups').insert({
      full_name: data.fullName,
      business_name: data.businessName,
      email: data.email ?? null,
      phone: data.phone,
      mobile: data.mobile ?? null,
      source: data.source ?? 'landing',
      created_at: new Date().toISOString()
    });

    if (error) {
      app.log.error(error, 'Failed to store installer signup');
      return reply.status(500).send({ message: 'Could not save your details. Please try again.' });
    }

    try {
      await sendNotificationEmail(data);
    } catch (err) {
      app.log.error(err, 'Failed to send installer notification email');
    }

    return reply.send({ message: 'Thanks for registering. We will be in touch shortly.' });
  });
}
