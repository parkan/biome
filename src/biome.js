'use strict'

const EventEmitter = require('events')
const PSA = require('peer-star-app')

const msgVer = 1
const defaults = {
    bootstrap: [
        // TODO: add multiaddrs for all RPis in here
    ],
    swarm: [
        //'/dns4/relay.decentralizedweb.net/tcp/9090/ws/p2p-websocket-star',
        '/dns4/ws-star1.par.dwebops.pub/tcp/443/wss/p2p-websocket-star/'
    ],
    relay: {
        relayWSAddr: '/dns4/relay.decentralizedweb.net/tcp/4004/wss/ipfs/QmPdHHgEr1gKbMuhiBf6545BL7mxaKbmCKbaJE7yY4CkBg',
        apiAddr: {
            host: 'relay.decentralizedweb.net',
            port: 5004
        }
    },
    keys: '4XTTMA1FxhTNufWa7LmW5MvMw2zEgUWP7G5SuwzU4epmRmPam-K3TgUUKyYR7sbt61ej8jnhdbQVLUaGsawW1QHs2nzFpoXVcNaMiyXictHKPz1NQPeRgbDcqqLroatJbwkMeo3kHnUqQtyGZGfgxqXUF3y5Wm3fPkTiRs2ftakJWjRF7ZpLq7Mnfo', // TODO: replace w/RO key by default
    nonce: '11113' // change to abandon previous log
}

module.exports = (options) => {
      return new Biome(options)
}

class Biome extends EventEmitter {
    constructor (options) {
        super()

        this._config = Object.assign({}, defaults, options)

        this._psa = PSA('distributed-gardens-biome', {
            ipfs: {
                swarm: this._config.swarm,
                repo: this._config.repo,
                relay: this._config.ipfs
            }
        })
        this._started = false
        this._eventsChrono = []
    }

    async _readIpfs(path) {
        try {
            const buf = await this._psa.ipfs.files.cat(path)
            return JSON.parse(buf.toString('utf-8'))
        } catch(err) {
            console.error('could not get path "' + path + '": ' + err)
            return undefined
        }
    }

    async _sync() {
        const eventsP = [...this._events.shared.value()].map(path => this._readIpfs(path))
        const events = await Promise.all(eventsP)
        this._eventsChrono = events.sort((a,b) => a.ts < b.ts)
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
        this._archive = await this._psa.collaborate(
            'archive' + this._config.nonce,
            'gset',
            {
                keys: this._config.keys
            }
        )
        console.log('synchronizing events log')
        await this._sync()

        this._events.on('state changed', async (fromSelf) => {
            await this._sync()
            this.emit(
                'state changed',
                fromSelf
            )
        })

        this._events.shared.on('change', async (change) => {
            const addedPath = change.add
            const added = await this._readIpfs(addedPath)

            switch(added.type) {
                case 'link':
                case 'seed':
                case 'scan':
                case 'setinfo':
                    this.emit('new ' + added.type, added)
                    break;
            }
            this.emit('new event', added)
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
    }

    async addEvent({from, type, msg}) {
        if(!this._started) {
            console.error('event log not running, call .start() first')
            return
        }
        const e = {
            ver: msgVer,
            ts: Date.now(),
            from,
            type,
            msg
        }
        const buf = Buffer.from(JSON.stringify(e))
        const res = await this._psa.ipfs.files.add(buf)
        this._events.shared.add(res[0].path)

        if(type === 'seed') {
            const a = {
                from,
                msg
            }
            const a_buf = Buffer.from(JSON.stringify(a))
            const a_res = await this._psa.ipfs.files.add(a_buf)
            this._archive.shared.add(a_res[0].path)
        }

        // TODO: if `seed` then add to archive collab
    }
}
