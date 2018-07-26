'use strict'

const EventEmitter = require('events')
const PSA = require('peer-star-app')

module.exports = (options) => {
      return new Biome(options)
}

class Biome extends EventEmitter {
    constructor (options) {
    }

    async getEvents (type) {
    }
}
