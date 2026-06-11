import axios from 'axios';
import { logger } from '../utils/logger.js';

export async function findLookalikeCompanies(seedDomain) {
  const MAX = parseInt(process.env.MAX_LOOKALIKES || '5', 10);
  logger.info(`Querying Ocean.io for lookalikes of: ${seedDomain}`);

  const response = await axios.post(
    'https://api.ocean.io/v1/similar',
    { domain: seedDomain, limit: MAX },
    {
      headers: {
        'x-api-key': process.env.OCEAN_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const results = response.data?.results || [];
  if (results.length === 0) {
    logger.warn('Ocean.io returned 0 results.');
    return [];
  }

  return results
    .filter(c => c.domain && c.name)
    .slice(0, MAX)
    .map(c => ({
      domain: c.domain.toLowerCase().trim(),
      name: c.name,
      score: c.score || 0,
    }));
}
