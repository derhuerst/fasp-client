# fasp-client

**Control [Friendly Audio Streaming Protocol](https://github.com/derhuerst/friendly-audio-streaming-protocol) receivers in the local network.**

Use [`fasp-client-cli`](https://github.com/derhuerst/fasp-client-cli) if you want to control receivers from the command line.

[![npm version](https://img.shields.io/npm/v/fasp-client.svg)](https://www.npmjs.com/package/fasp-client)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/fasp-client.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

```shell
npm install fasp-client
```


## Usage

You need to have a [`fasp-receiver`](https://github.com/derhuerst/fasp-receiver)-compatible server (e.g. [`fasp-server`](https://github.com/derhuerst/fasp-server)) running somewhere.

```js
const createClient = require('fasp-client')

const receiverUrl = 'ws://localhost:60123/'
const client = createClient(receiverUrl, (status) => {
	console.log(status.title || status.filename, status.progress)
})

client.play('http://example.org/path/to/audio.ogg')
```

Using the code above, you will only be able to let the receiver play files from a *remote* location. **If you want to play *local* files**, you need to serve them via HTTP and tell the receiver to fetch them from you. There is **a straightforward helper for this**:

```js
const withLocalFiles = require('fasp-client/with-local-files')

withLocalFiles(client)
```

You can now pass file paths to `client.play` and `client.queue`. An HTTP server will be started on a random port, serving only these files.


## Contributing

If you have a question or have difficulties using `fasp-client`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/fasp-client/issues).
