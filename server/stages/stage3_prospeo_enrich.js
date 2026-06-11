import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Stage 3 — Email resolution
 *
 * Prospeo's search-person already returns email in the person object
 * when the email is revealed. We check that first.
 * If not revealed, we call enrich-person with the person_id.
 *
 * Prospeo enrich-person body: { id: "person_id_value" }  (field is "id" not "person_id")
 */
async function resolveEmail(prospect, env) {
  // Best case: email already present from Stage 2 search result
  if (prospect.email) {
    console.log(`✓ Email already present for ${prospect.full_name}: ${prospect.email}`);
    return prospect;
  }

  // Try enrich-person with id field (correct field name per Prospeo docs)
  if (prospect.person_id) {
    try {
      await sleep(2000); // respect rate limit
      const res = await axios.post(
        'https://api.prospeo.io/enrich-person',
        { id: prospect.person_id },
        {
          headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
          timeout: 20000,
        }
      );

      console.log(`Enrich ${prospect.full_name}:`, res.data.error ? res.data.error_code : 'ok');

      if (!res.data.error) {
        const email = res.data.person?.email?.email;
        if (email) {
          return {
            ...prospect,
            email,
            first_name: res.data.person?.first_name || prospect.first_name,
            full_name: res.data.person?.full_name || prospect.full_name,
          };
        }
        console.log(`No email revealed for ${prospect.full_name} — not in Prospeo database`);
      }
    } catch (err) {
      console.log(`Enrich error for ${prospect.full_name}:`, err.response?.data || err.message);
    }
  }

  console.log(`✗ Could not resolve email for ${prospect.full_name}`);
  return null;
}

export async function resolveEmails(prospects, env) {
  const contacts = [];
  console.log(`Resolving emails for ${prospects.length} prospects...`);

  for (const p of prospects) {
    const c = await resolveEmail(p, env);
    if (c) contacts.push(c);
  }

  console.log(`Resolved ${contacts.length}/${prospects.length} emails`);
  return contacts;
}
