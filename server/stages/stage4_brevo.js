import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildEmail(contact, seedDomain, env) {
  const firstName = contact.first_name || contact.full_name.split(' ')[0];
  const company = contact.company_name || contact.company_domain;

  return {
    subject: `Quick question for you, ${firstName}`,
    htmlContent: `
      <p>Hi ${firstName},</p>
      <p>I came across <strong>${company}</strong> while researching companies similar to <strong>${seedDomain}</strong>.</p>
      <p>We help sales teams automate lead sourcing and outreach end-to-end — one domain in, verified emails out, pipeline fired automatically.</p>
      <p>Would a <strong>15-minute call</strong> make sense? No pitch, just a conversation.</p>
      <p>Best,<br/>${env.SENDER_NAME}<br/>${env.SENDER_EMAIL}</p>
    `.trim(),
  };
}

export async function sendOutreachEmails(contacts, seedDomain, env) {
  const results = [];

  for (const contact of contacts) {
    const { subject, htmlContent } = buildEmail(contact, seedDomain, env);
    try {
      const res = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: env.SENDER_NAME, email: env.SENDER_EMAIL },
          to: [{ email: contact.email, name: contact.full_name }],
          subject,
          htmlContent,
          tags: ['outreach-pipeline'],
        },
        {
          headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );
      results.push({ email: contact.email, name: contact.full_name, success: true, messageId: res.data.messageId });
    } catch (err) {
      results.push({ email: contact.email, name: contact.full_name, success: false, error: err.response?.data?.message || err.message });
    }
    await sleep(300);
  }

  return results;
}
