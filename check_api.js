const fetch = require('node-fetch');
(async () => {
  const res = await fetch('http://localhost:3000/api/v1/designs');
  const json = await res.json();
  const designs = json.data.items;
  console.log("Found", designs.length, "designs");
  designs.forEach(d => {
    console.log(`Design ${d.name} (${d.code})`);
    console.log(`  basePrice:`, d.basePrice);
    console.log(`  weightConfig:`, typeof d.weightConfig, d.weightConfig);
  });
})();
