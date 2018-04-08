'use strict'

const createClient = require('.')
const withLocalFiles = require('./with-local-files')

const port = parseInt(process.argv[2])
if (Number.isNaN(port)) {
	console.error('missing port')
	process.exit(1)
}
const receiver = `ws://localhost:${port}/`

const client = withLocalFiles(createClient(receiver, (prop, val) => {
	console.error(prop, val)
}))

client.queue('http://example.org/path/to/audio.ogg')
client.queue('path/to/local/audio.mp3')
