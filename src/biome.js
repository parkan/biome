'use strict'

const EventEmitter = require('events')
const PSA = require('peer-star-app')

const msgVer = 1
const defaults = {
    kioskPeers: [], // FIXME
    //const kioskPeers = [ '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star' ] // put kiosk peers in here
    keys: '4XTTMA1FxhTNufWa7LmW5MvMw2zEgUWP7G5SuwzU4epmRmPam-K3TgUUKyYR7sbt61ej8jnhdbQVLUaGsawW1QHs2nzFpoXVcNaMiyXictHKPz1NQPeRgbDcqqLroatJbwkMeo3kHnUqQtyGZGfgxqXUF3y5Wm3fPkTiRs2ftakJWjRF7ZpLq7Mnfo', // TODO: replace w/RO key by default
    nonce: '9636' // change to abandon previous log
}
const seedPeers = [
    //'/dns4/wrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star',
    '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
    '/ip4/127.0.0.1/tcp/9090/ws/p2p-websocket-star'
]

module.exports = (options) => {
      return new Biome(options)
}

class Biome extends EventEmitter {
    constructor (options) {
        super()

        this._config = Object.assign({}, defaults, options)

        this._psa = PSA('distributed-gardens-biome', {
            ipfs: {
                swarm: this._config.kioskPeers.concat(seedPeers),
                repo: this._config.repo
            }
        })
        this._started = false
        this._eventsChrono = []
    }

    _sync() {
        this._eventsChrono = Array.from(this._events.shared.value()).sort((a,b) => a.ts < b.ts)
    }

    /*
    _whatChanged(prev, current) {
        // NOTE: will automatically convert Set/array args
        const changed = [...current].filter((v) => ! new Set(prev).has(v))
        return new Set(changed)
    }
    */

    async start () {
        await this._psa.start()
        console.log('biome started')
        this._events = await this._psa.collaborate(
            'events' + this._config.nonce,
            // TODO: extend gset with duck typing on ts
            'gset',
            {
                keys: this._config.keys
            }
        )
        console.log('synchronizing events log')
        this._sync()

        this._events.on('state changed', (fromSelf) => {
            this._sync()
            this.emit(
                'state changed',
                fromSelf
            )
        })

        this._events.shared.on('change', (change) => {
            const added = change.add
            switch(added.type) {
                case 'link':
                case 'seed':
                    this.emit(added.type, added)
                    break;
            }
            this.emit('change', added)
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

    getEvents (type='*') {
        if(!this._started) {
            console.error('event log not running, call .start() first')
            return
        }

        if(type === '*') {
            return this._eventsChrono
        } else {
            return this._eventsChrono.filter(e => e.type === type)
        }

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
            ver: msgVer,
            ts: Date.now(),
            from,
            type,
            msg
        }
        this._events.shared.add(e)
    }
}
