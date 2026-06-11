import axios from 'axios';

/**
 * Ocean.io API
 * Endpoint: POST https://api.ocean.io/v1/similar
 * Auth: x-api-key header
 * Body: { domain: "stripe.com", limit: 5 }
 * Response: { results: [{ domain, name, score, ... }], companies: [...] }
 */
export async function findLookalikeCompanies(seedDomain, env) {
  const MAX = parseInt(env.MAX_LOOKALIKES || '5', 10);

  const response = await axios.post(
    'https://api.ocean.io/v1/similar',
    {
      domain: seedDomain,
      limit: MAX,
    },
    {
      headers: {
        'x-api-key': env.OCEAN_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  // results = lookalike companies, companies = exact match for seed domain
  const results = response.data?.results || [];

  return results
    .filter(c => c.domain && c.name)
    .slice(0, MAX)
    .map(c => ({
      domain: c.domain.toLowerCase().trim(),
      name: c.name,
      score: c.score || 0,
    }));
}
