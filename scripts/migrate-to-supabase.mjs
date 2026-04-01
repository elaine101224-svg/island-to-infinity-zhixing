import { readFileSync } from 'fs';

const supabaseUrl = 'https://jbukbnmgkmjyfesaqqjq.supabase.co';
const supabaseKey = 'sb_publishable_RPzJKQTZrXUxYXHFxJLXPQ_n2xttLRB';

async function supabaseInsert(table, id, data) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ id, data })
  });
  return response.ok;
}

async function migrate() {
  // Read families
  const familiesData = JSON.parse(readFileSync('./data/families.json', 'utf-8'));
  const families = familiesData.families;

  // Read plans
  const plansData = JSON.parse(readFileSync('./data/plans.json', 'utf-8'));
  const plans = plansData.plans;

  // Read schedule
  const scheduleData = JSON.parse(readFileSync('./data/schedule.json', 'utf-8'));
  const events = scheduleData.events;

  console.log(`Migrating ${families.length} families...`);
  for (const family of families) {
    const success = await supabaseInsert('families', family.id, family);
    console.log(success ? `✓ ${family.id}` : `✗ ${family.id}`);
  }

  console.log(`\nMigrating ${plans.length} plans...`);
  for (const plan of plans) {
    const success = await supabaseInsert('plans', plan.id, plan);
    console.log(success ? `✓ ${plan.id}` : `✗ ${plan.id}`);
  }

  console.log(`\nMigrating ${events.length} events...`);
  for (const event of events) {
    const success = await supabaseInsert('schedule', event.id, event);
    console.log(success ? `✓ ${event.id}` : `✗ ${event.id}`);
  }

  console.log('\nMigration complete!');
}

migrate().catch(console.error);
