'use strict'

const EventEmitter = require('events')
const PSA = require('peer-star-app')

module.exports = (options) => {
      return new Biome(options)
}

class Biome extends EventEmitter {
    constructor (options) {
        super()
    }

/*
    {
        'ver': 1,
            'ts': 1531764520.1234,
            'from': { name: 'kiosk_2_hallway' },
            'type': 'seed', 
            'msg': { // ... ref to IA metadata }
    }
*/

    async getEvents (type='seed') {
        return [ {
            ts: Date.now() / 1000,
            type: 'seed',
            msg: "zb2rhZp3WapJaG6DQizqEP3SruMVScn35vixhgGMAyarNYoae" } ]
    }
}
