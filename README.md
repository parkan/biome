```js
const Biome = require('biome')
const biome = Biome()
await biome.start()
biome.on('new seed', (msg) => console.log(msg))
const msg = { from: { "name": "arkadiy" }, type: "seed", msg: "zb2rhZp3WapJaG6DQizqEP3SruMVScn35vixhgGMAyarNYoae" }
await biome.addEvent(msg)
const events = biome.getEvents()
```

