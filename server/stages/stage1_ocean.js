import axios from 'axios';

export async function findLookalikeCompanies(seedDomain, env) {
  const MAX = parseInt(env.MAX_LOOKALIKES || '5', 10);

  const response = await axios.post(
    'https://api.ocean.io/v2/search',
    { lookalike: seedDomain, size: MAX },
    {
      headers: {
        'x-api-key': env.OCEAN_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

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
