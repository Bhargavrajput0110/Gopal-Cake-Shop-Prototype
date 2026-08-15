fetch('http://localhost:3000/api/v1/designs')
  .then(res => res.json())
  .then(data => {
    const d = data.data.items.find(x => x.name.includes('Princess'));
    if(d) {
      console.log("WeightConfig type:", typeof d.weightConfig);
      console.log("WeightConfig:", d.weightConfig);
    } else {
      console.log("Not found", data.data.items.map(x=>x.name));
    }
  })
  .catch(console.error);
