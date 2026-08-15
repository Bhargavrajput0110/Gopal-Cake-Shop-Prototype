const fetch = require('node-fetch');
(async () => {
  const res = await fetch('http://localhost:3000/api/v1/designs');
  const json = await res.json();
  const designs = json.data.items;
  console.log("Found", designs.length, "designs");
  if (designs.length > 0) {
    console.log("First design basePrice:", designs[0].basePrice);
    console.log("First design weightConfig:", designs[0].weightConfig);
  }
})();
