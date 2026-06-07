const REQUIRED = [
  'OCEAN_API_KEY',
  'PROSPEO_API_KEY',
  'EAZYREACH_API_KEY',
  'BREVO_API_KEY',
  'SENDER_EMAIL',
  'SENDER_NAME',
];

export function validateEnv() {
  const missing = REQUIRED.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\n❌ Missing environment variables:\n  ${missing.join('\n  ')}`);
    console.error('\nCopy .env.example to .env and fill in your API keys.\n');
    process.exit(1);
  }
}
