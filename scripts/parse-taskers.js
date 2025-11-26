import data from '../taskers.json' with { type: 'json' };

// Extract postcode from location like 'Doreen VIC 3754, Australia'
function extractPostcode(location) {
  if (!location) return null;
  const match = location.match(/\b(\d{4})\b/);
  return match ? match[1] : null;
}

// Filter to usable taskers (have name and phone or email)
const usable = data.filter(t => t.name && (t.phoneNumber || t.email));

console.error(`Total usable taskers: ${usable.length}`);

// Output as JSON for import
const trades = usable.map(t => ({
  name: t.name,
  email: t.email || null,
  phone: t.phoneNumber || null,
  company: null,
  notes: t.bio || null,
  postcode: extractPostcode(t.homeLocation),
  expertsIn: t.expertsIn || []
}));

console.log(JSON.stringify(trades));
