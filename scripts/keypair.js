const Keys = require('peer-star-app').keys

async function main() {
    const keys = await Keys.generate()
    console.log('public key (RO): ' + Keys.uriEncodeReadOnly(keys))
    console.log('full keypair (RW): ' + Keys.uriEncode(keys))
}

main()

