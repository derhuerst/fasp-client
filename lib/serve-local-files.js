'use strict'

const getPort = require('get-port')
const getAddress = require('internal-ip').v4
const {createServer} = require('http')
const {createHash} = require('crypto')
const {normalize, basename, dirname} = require('path')
const parseUrl = require('parseurl')
const send = require('send')

const filesServed = Symbol('filesServed')

const startNewServer = () => {
	return Promise.all([
		getPort(),
		getAddress()
	])
	.then(([port, address]) => {
		const server = createServer()
		server[filesServed] = new Map()

		return new Promise((resolve, reject) => {
			server.listen(port, address, (err) => {
				if (err) reject(err)
				else resolve(server)
			})
		})
	})
}

const sha256 = (str) => {
	return createHash('sha256')
	.update(str)
	.digest('hex')
}

const createFileHandle = (server, id, path) => {
	const dir = dirname(path)
	const file = basename(path)

	let onReq = (req, res) => {
		const url = parseUrl(req)
		const reqId = basename(dirname(url.pathname))
		const reqFile = basename(url.pathname)

		if (reqId !== id || decodeURIComponent(reqFile) !== file) {
			return null // req doesn't match, ignore
		}
		send(req, reqFile, {
			index: false,
			maxAge: 60 * 60 * 1000,
			root: dir
		})
		.pipe(res)
	}

	server.on('request', onReq)
	let refs = 1
	const ref = () => ++refs
	const unref = () => {
		refs--
		if (refs === 0) {
			// clean up
			server.removeListener(onReq)
			onReq = null
			server = null
		}
	}

	const {address, port} = server.address()
	return {
		ref, unref,
		url: `http://${address}:${port}/${id}/${encodeURIComponent(file)}`
	}
}

const createFileServer = () => {
	const pServer = startNewServer()

	const serveFile = (path) => {
		const id = sha256(normalize(path)).slice(0, 20)

		return pServer
		.then((server) => {
			let handle = server[filesServed].get(id)
			if (handle) handle.ref()
			else {
				handle = createFileHandle(server, id, path)
				server[filesServed].set(id, handle)
			}
			return handle
		})
	}

	return serveFile
}

module.exports = createFileServer
