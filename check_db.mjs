import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1].replace(/["']/g, ''), keyMatch[1].replace(/["']/g, ''));
  const { data: contributions } = await supabase.from('contributions').select('*');
  const { data: transactions } = await supabase.from('transactions').select('*');
  console.log("Contributions count:", contributions?.length);
  console.log("Transactions count:", transactions?.length);
  console.log("Recent Transactions:", transactions?.slice(0, 3));
  console.log("Recent Contributions:", contributions?.slice(0, 3));
} else {
  console.log("Env vars not found");
}
