'use strict'

const EventEmitter = require('events')
const PSA = require('peer-star-app')

// FIXME: magic constants, bad!
const kioskPeers = [] // FIXME
//const kioskPeers = [ '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star' ] // put kiosk peers in here
const keys = '4XTTMA1FxhTNufWa7LmW5MvMw2zEgUWP7G5SuwzU4epmRmPam-K3TgUUKyYR7sbt61ej8jnhdbQVLUaGsawW1QHs2nzFpoXVcNaMiyXictHKPz1NQPeRgbDcqqLroatJbwkMeo3kHnUqQtyGZGfgxqXUF3y5Wm3fPkTiRs2ftakJWjRF7ZpLq7Mnfo' // TODO: replace w/RO key by default
const nonce = '9632'

module.exports = (options) => {
      return new Biome(options)
}

class Biome extends EventEmitter {
    constructor (options) {
        super()

        this._psa = PSA('distributed-gardens-biome', {
            ipfs: {
                swarm: kioskPeers
            }
        })
        this._started = false
        this._eventsChrono = []
    }

    async start () {
        await this._psa.start()
        console.log('biome started')
        this._events = await this._psa.collaborate(
            'events' + nonce,
            // TODO: extend gset with duck typing on ts
            'gset',
            {
                keys
            }
        )
        console.log('synchronizing events log')
        this._events.on('state changed', (fromSelf) => {
            this._eventsChrono = Array.from(this._events.shared.value()).sort((a,b) => a.ts < b.ts)
            this.emit('state changed')
        })
        this._started = true
    }

// event format
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
        if(!this._started) {
            console.error('event log not running, call .start() first')
            return
        }

        return this._eventsChrono

        /*
        return [ {
            ts: Date.now() / 1000,
            type: 'seed',
            msg: "zb2rhZp3WapJaG6DQizqEP3SruMVScn35vixhgGMAyarNYoae" } ]
        */
    }

    async addEvent({from, type, msg}) {
        if(!this._started) {
            console.error('event log not running, call .start() first')
            return
        }
        // TODO: undefinedness checks
        const e = {
            ver: 1,
            ts: Date.now(),
            from,
            type,
            msg
        }
        this._events.shared.add(e)
    }
}
