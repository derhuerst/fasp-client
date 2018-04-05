'use strict'

const createClient = require('.')

const port = parseInt(process.argv[2])
if (Number.isNaN(port)) {
	console.error('missing port')
	process.exit(1)
}

const client = createClient(`ws://localhost:${port}/`, (status) => {
	console.error(status)
})

client.queue('http://example.org/path/to/audio.ogg')
