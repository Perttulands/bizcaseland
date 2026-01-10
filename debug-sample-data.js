import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load fintech sample data
const fintechPath = path.join(__dirname, 'public', 'sample-data', 'business-cases', 'fintech-market-entry.json');
const fintechData = JSON.parse(fs.readFileSync(fintechPath, 'utf8'));

console.log('=== FINTECH SAMPLE DATA ANALYSIS ===');
console.log('Title:', fintechData.meta.title);
console.log('Currency:', fintechData.meta.currency);
console.log('Periods:', fintechData.meta.periods);

console.log('\n=== PRICING ===');
console.log('Unit Price:', fintechData.assumptions.pricing.avg_unit_price.value, fintechData.assumptions.pricing.avg_unit_price.unit);

console.log('\n=== CUSTOMER SEGMENTS ===');
fintechData.assumptions.customers.segments.forEach((segment, i) => {
  console.log(`\nSegment ${i + 1}: ${segment.label}`);
  console.log('Volume start:', segment.volume.start.value, segment.volume.start.unit);
  
  if (segment.volume.pattern_type === 'geom_growth') {
    console.log('Growth rate:', segment.volume.monthly_growth_rate.value, '(monthly)');
    
    // Calculate month 60 volume
    const month60Volume = segment.volume.start.value * Math.pow(1 + segment.volume.monthly_growth_rate.value, 60);
    console.log('Volume at month 60:', month60Volume.toLocaleString());
  } else if (segment.volume.pattern_type === 'linear_growth') {
    console.log('Linear increase:', segment.volume.monthly_flat_increase.value, 'per month');
    
    // Calculate month 60 volume
    const month60Volume = segment.volume.start.value + (segment.volume.monthly_flat_increase.value * 60);
    console.log('Volume at month 60:', month60Volume.toLocaleString());
  }
});

console.log('\n=== UNIT ECONOMICS ===');
console.log('COGS %:', fintechData.assumptions.unit_economics.cogs_pct.value);
console.log('CAC:', fintechData.assumptions.unit_economics.cac.value, 'EUR per customer');

console.log('\n=== OPEX (Monthly) ===');
fintechData.assumptions.opex.forEach((opex, i) => {
  console.log(`${opex.name}: €${opex.value.value.toLocaleString()}/month`);
});

console.log('\n=== TOTAL MONTHLY OPEX ===');
const totalMonthlyOpex = fintechData.assumptions.opex.reduce((sum, opex) => sum + opex.value.value, 0);
console.log(`Total: €${totalMonthlyOpex.toLocaleString()}/month`);
console.log(`Total over 60 months: €${(totalMonthlyOpex * 60).toLocaleString()}`);

console.log('\n=== SIMPLE PROJECTION CHECK ===');
// Calculate total transactions across all segments at month 60
const totalMonth60Volume = fintechData.assumptions.customers.segments.reduce((sum, segment) => {
  if (segment.volume.pattern_type === 'geom_growth') {
    return sum + segment.volume.start.value * Math.pow(1 + segment.volume.monthly_growth_rate.value, 60);
  } else if (segment.volume.pattern_type === 'linear_growth') {
    return sum + segment.volume.start.value + (segment.volume.monthly_flat_increase.value * 60);
  }
  return sum;
}, 0);

console.log('Total transactions at month 60:', totalMonth60Volume.toLocaleString());

// Revenue at month 60
const unitPrice = fintechData.assumptions.pricing.avg_unit_price.value;
const month60Revenue = totalMonth60Volume * unitPrice;
console.log('Revenue at month 60: €', month60Revenue.toLocaleString());

// Monthly COGS at month 60
const cogsRate = fintechData.assumptions.unit_economics.cogs_pct.value;
const month60Cogs = month60Revenue * cogsRate;
console.log('COGS at month 60: €', month60Cogs.toLocaleString());

// Monthly gross profit at month 60
const month60GrossProfit = month60Revenue - month60Cogs;
console.log('Gross profit at month 60: €', month60GrossProfit.toLocaleString());

console.log('\n=== ISSUE ANALYSIS ===');
console.log('Problem: If monthly operating expenses are €', totalMonthlyOpex.toLocaleString());
console.log('And gross profit at month 60 is only €', month60GrossProfit.toLocaleString());
console.log('Then the business is losing €', (totalMonthlyOpex - month60GrossProfit).toLocaleString(), 'per month even at peak!');
