'use strict'

if (process.browser) {
	const unsupported = () => {
		throw new Error(
			'fasp-client cannot serve files in the browser. ' +
			`Don't call this function in the browser.`
		)
	}
	module.exports = unsupported
} else {
	const pify = require('pify')
	const {stat} = require('fs')

	const createServer = require('./lib/serve-local-files')

	const pStat = pify(stat)
	const isFile = (path) => {
		return pStat(path)
		.then((stat) => stat.isFile())
		.catch((err) => {
			if (err && err.code === 'ENOENT') return false
			throw err
		})
	}

	const servers = new WeakMap()

	const withLocalFiles = (client) => {
		const sendFileOrUrl = (fileOrUrl, playUrl) => {
			isFile(fileOrUrl)
			.then((isFile) => {
				if (!isFile) { // is a URL, just pass it though
					playUrl(fileOrUrl)
					return
				}

				let serveFile = servers.get(client)
				if (!serveFile) {
					serveFile = createServer()
					servers.set(client, serveFile)
				}

				return serveFile(fileOrUrl)
				.then((handle) => {
					playUrl(handle.url)
					// todo: later `handle.unref()` in order to stop serving
				})
			})
			.catch((err) => {
				// todo: handle errors
			})
		}

		const _play = client.play
		const play = (fileOrUrl) => sendFileOrUrl(fileOrUrl, _play)
		client.play = play

		const _queue = client.queue
		const queue = (fileOrUrl) => sendFileOrUrl(fileOrUrl, _queue)
		client.queue = queue

		const _close = client.close
		const close = () => {
			_close()
			const pServer = servers.get(client)
			if (pServer) {
				pServer
				.then(server => server.close())
				.catch(() => {}) // swallow errors
			}
		}
		client.close = close

		return client
	}

	module.exports = withLocalFiles
}
