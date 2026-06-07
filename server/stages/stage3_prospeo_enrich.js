import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function resolveEmail(prospect, env) {
  if (!prospect.linkedin_url) return null;

  try {
    const res = await axios.post(
      'https://api.prospeo.io/enrich-person',
      { linkedin_url: prospect.linkedin_url },
      {
        headers: { 'X-KEY': env.PROSPEO_API_KEY, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const data = res.data;
    if (data.error) return null;

    const email = data.person?.email?.email;
    if (!email) return null;

    return {
      ...prospect,
      email,
      first_name: data.person?.first_name || prospect.first_name,
      full_name: data.person?.full_name || prospect.full_name,
    };
  } catch {
    return null;
  }
}

export async function resolveEmails(prospects, env) {
  const contacts = [];
  for (const p of prospects) {
    const c = await resolveEmail(p, env);
    if (c) contacts.push(c);
    await sleep(600);
  }
  return contacts;
}
