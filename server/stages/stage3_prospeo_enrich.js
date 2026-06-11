import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function resolveEmail(prospect, env) {
  // First check if email was already resolved in Stage 2 enrichment
  if (prospect.email) {
    console.log(`Email already present for ${prospect.full_name}: ${prospect.email}`);
    return prospect;
  }

  if (!prospect.linkedin_url && !prospect.person_id) {
    console.log(`No linkedin_url or person_id for ${prospect.full_name} — skipping`);
    return null;
  }

  // Try enrich-person with person_id first (cheaper)
  if (prospect.person_id) {
    try {
      console.log(`Enriching ${prospect.full_name} with person_id: "${prospect.person_id}"`);
      const res = await axios.post(
        'https://api.prospeo.io/enrich-person',
        { person_id: String(prospect.person_id) },
        {
          headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
          timeout: 20000,
        }
      );

      console.log(`Enrich by person_id ${prospect.full_name}:`, res.data.error ? `${res.data.error_code} — ${res.data.filter_error}` : 'ok');

      if (!res.data.error) {
        const email = res.data.person?.email?.email;
        console.log(`Email for ${prospect.full_name}: ${email || 'not revealed'}`);
        if (email) {
          return {
            ...prospect,
            email,
            first_name: res.data.person?.first_name || prospect.first_name,
            full_name: res.data.person?.full_name || prospect.full_name,
          };
        }
      }
    } catch (err) {
      console.log(`Enrich person_id error for ${prospect.full_name}:`, err.response?.data || err.message);
    }
    await sleep(600);
  }

  // Fallback: try with linkedin_url
  if (prospect.linkedin_url) {
    try {
      console.log(`Enriching ${prospect.full_name} with linkedin_url: "${prospect.linkedin_url}"`);
      const res = await axios.post(
        'https://api.prospeo.io/enrich-person',
        { linkedin_url: prospect.linkedin_url },
        {
          headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
          timeout: 20000,
        }
      );

      console.log(`Enrich by linkedin ${prospect.full_name}:`, res.data.error ? `${res.data.error_code}` : 'ok');

      if (!res.data.error) {
        const email = res.data.person?.email?.email;
        console.log(`Email for ${prospect.full_name}: ${email || 'not revealed'}`);
        if (email) {
          return {
            ...prospect,
            email,
            first_name: res.data.person?.first_name || prospect.first_name,
            full_name: res.data.person?.full_name || prospect.full_name,
          };
        }
      }
    } catch (err) {
      console.log(`Enrich linkedin error for ${prospect.full_name}:`, err.response?.data || err.message);
    }
  }

  return null;
}

export async function resolveEmails(prospects, env) {
  const contacts = [];
  console.log(`Resolving emails for ${prospects.length} prospects...`);

  for (const p of prospects) {
    const c = await resolveEmail(p, env);
    if (c) contacts.push(c);
    await sleep(800);
  }

  console.log(`Resolved ${contacts.length} emails out of ${prospects.length} prospects`);
  return contacts;
}
