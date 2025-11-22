import { env } from '../env.js';

type SmsParams = {
  to: string;
  body: string;
  idempotencyKey?: string;
};

async function sendSms({ to, body, idempotencyKey }: SmsParams) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials missing');
  }

  const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;
  const from = env.TWILIO_FROM_NUMBER;

  if (!messagingServiceSid && !from) {
    throw new Error('TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER is required');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');

  const form = new URLSearchParams();
  form.set('To', to);
  form.set('Body', body);
  if (messagingServiceSid) form.set('MessagingServiceSid', messagingServiceSid);
  if (!messagingServiceSid && from) form.set('From', from);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
    },
    body: form.toString()
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio SMS failed: ${res.status} ${text}`);
  }
}

export const notifications = {
  async sendCustomerSchedulingLink(input: {
    to: string;
    schedulingUrl: string;
    merchantName?: string;
    productTitle?: string;
    idempotencyKey?: string;
  }) {
    const body = [
      input.merchantName ? `${input.merchantName} - installation booking` : 'Installation booking',
      input.productTitle ? `Item: ${input.productTitle}` : undefined,
      `Schedule here: ${input.schedulingUrl}`
    ]
      .filter(Boolean)
      .join('\n');

    await sendSms({ to: input.to, body, idempotencyKey: input.idempotencyKey });
  },

  async sendMerchantMatchNotification(input: {
    to: string;
    leadId: string;
    bestTradeName?: string;
    idempotencyKey?: string;
  }) {
    const body = [
      'New installation lead matched',
      `Lead: ${input.leadId}`,
      input.bestTradeName ? `Assigned: ${input.bestTradeName}` : undefined
    ]
      .filter(Boolean)
      .join('\n');

    await sendSms({ to: input.to, body, idempotencyKey: input.idempotencyKey });
  },

  async sendInstallerAssignment(input: {
    to: string;
    leadId: string;
    schedulingUrl?: string;
    idempotencyKey?: string;
  }) {
    const body = [
      'New install job assigned',
      `Lead: ${input.leadId}`,
      input.schedulingUrl ? `Customer scheduling: ${input.schedulingUrl}` : undefined
    ]
      .filter(Boolean)
      .join('\n');

    await sendSms({ to: input.to, body, idempotencyKey: input.idempotencyKey });
  },

  async sendReminder(input: {
    to: string;
    leadId: string;
    scheduledStart?: string;
    idempotencyKey?: string;
  }) {
    const body = [
      'Reminder: installation upcoming',
      `Lead: ${input.leadId}`,
      input.scheduledStart ? `Start: ${input.scheduledStart}` : undefined
    ]
      .filter(Boolean)
      .join('\n');

    await sendSms({ to: input.to, body, idempotencyKey: input.idempotencyKey });
  },

  async sendSlaBreachAlert(input: {
    to: string;
    leadId: string;
    idempotencyKey?: string;
  }) {
    const body = [`SLA alert: installation not booked`, `Lead: ${input.leadId}`].join('\n');
    await sendSms({ to: input.to, body, idempotencyKey: input.idempotencyKey });
  }
};
