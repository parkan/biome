```js
const Biome = require('biome')
const biome = Biome()
await biome.start()
await biome.addEvent({ from: { "name": "arkadiy" }, type: "seed", msg: "zb2rhZp3WapJaG6DQizqEP3SruMVScn35vixhgGMAyarNYoae" })
console.log(biome.getEvents())
```

