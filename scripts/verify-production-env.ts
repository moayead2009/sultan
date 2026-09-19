import { validateProductionEnvironment } from '../lib/production-preflight';

const issues = validateProductionEnvironment(process.env);

if (issues.length > 0) {
  console.error('Production environment preflight failed:');
  for (const issue of issues) console.error('- ' + issue);
  process.exit(1);
}

console.log('Production environment preflight passed. No secret values were printed.');
