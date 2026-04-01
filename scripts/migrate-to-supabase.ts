import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbukbnmgkmjyfesaqqjq.supabase.co';
const supabaseKey = 'sb_publishable_RPzJKQTZrXUxYXHFxJLXPQ_n2xttLRB';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  // Read families
  const familiesData = await import('../data/families.json', { assert: { type: 'json' } });
  const families = familiesData.default.families;

  // Read plans
  const plansData = await import('../data/plans.json', { assert: { type: 'json' } });
  const plans = plansData.default.plans;

  // Read schedule
  const scheduleData = await import('../data/schedule.json', { assert: { type: 'json' } });
  const events = scheduleData.default.events;

  console.log(`Migrating ${families.length} families...`);
  for (const family of families) {
    const { error } = await supabase
      .from('families')
      .insert({ id: family.id, data: family });
    if (error) {
      console.error(`Error inserting family ${family.id}:`, error.message);
    } else {
      console.log(`Inserted family: ${family.id}`);
    }
  }

  console.log(`\nMigrating ${plans.length} plans...`);
  for (const plan of plans) {
    const { error } = await supabase
      .from('plans')
      .insert({ id: plan.id, data: plan });
    if (error) {
      console.error(`Error inserting plan ${plan.id}:`, error.message);
    } else {
      console.log(`Inserted plan: ${plan.id}`);
    }
  }

  console.log(`\nMigrating ${events.length} events...`);
  for (const event of events) {
    const { error } = await supabase
      .from('schedule')
      .insert({ id: event.id, data: event });
    if (error) {
      console.error(`Error inserting event ${event.id}:`, error.message);
    } else {
      console.log(`Inserted event: ${event.id}`);
    }
  }

  console.log('\nMigration complete!');
}

migrate().catch(console.error);
