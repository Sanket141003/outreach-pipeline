/**
 * Email copy — personalized outreach template.
 * Edit this file to change the subject line, tone, and pitch.
 */

export function buildEmailBody(contact, seedDomain) {
  const firstName = contact.first_name || contact.full_name.split(' ')[0];
  const companyName = contact.company_name || contact.company_domain;

  const subject = `Quick question for you, ${firstName}`;

  const textContent = `
Hi ${firstName},

I came across ${companyName} while researching companies similar to ${seedDomain} and was genuinely impressed by what you're building.

I'm reaching out because we help teams like yours automate the parts of sales that eat up the most time — specifically lead sourcing and outreach. We've built a pipeline that takes a company domain and runs the full prospecting cycle autonomously, from finding lookalikes to sending personalized emails.

Would it be worth a 15-minute call to see if there's a fit? Happy to go at your pace — no deck, no pitch, just a conversation.

Best,
${process.env.SENDER_NAME}
${process.env.SENDER_EMAIL}
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi ${firstName},</p>

  <p>
    I came across <strong>${companyName}</strong> while researching companies similar to 
    <strong>${seedDomain}</strong> and was genuinely impressed by what you're building.
  </p>

  <p>
    I'm reaching out because we help teams like yours automate the parts of sales that eat up 
    the most time — specifically lead sourcing and outreach. We've built a pipeline that takes 
    a company domain and runs the full prospecting cycle autonomously, from finding lookalikes 
    to sending personalized emails.
  </p>

  <p>
    Would it be worth a <strong>15-minute call</strong> to see if there's a fit? Happy to go 
    at your pace — no deck, no pitch, just a conversation.
  </p>

  <p>
    Best,<br/>
    <strong>${process.env.SENDER_NAME}</strong><br/>
    <a href="mailto:${process.env.SENDER_EMAIL}">${process.env.SENDER_EMAIL}</a>
  </p>
</body>
</html>
  `.trim();

  return { subject, htmlContent, textContent };
}
