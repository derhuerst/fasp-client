'use strict'

const WebSocket = require('isomorphic-ws')
const ReconnectingWebSocket = require('reconnecting-websocket')

const assertNonEmptyString = (str, name) => {
	if ('string' !== typeof str || !str) {
		throw new Error(name + ' must be a non-empty string.')
	}
}
const assertNumber = (num, name) => {
	if ('number' !== typeof num) {
		throw new Error(name + ' must be a number.')
	}
}

const createClient = (url, onStatus) => {
	const receiver = new ReconnectingWebSocket(url, [], {
		constructor: WebSocket
	})

	receiver.on('message', (msg) => {
		try {
			msg = JSON.parse(msg)
		} catch (err) {
			return // ignore invalid messages
		}
		if (
			!Array.isArray(msg) ||
			'string' !== typeof msg[0] ||
			!msg[0].length
		) return null
		if (msg[0] === 'status') onStatus(msg[1])
	})

	const send = (cmd, args = []) => {
		const msg = JSON.stringify([cmd].concat(args))
		const _send = () => receiver.send(msg)
		if (receiver.readyState === WebSocket.OPEN) _send()
		else receiver.once('open', _send)
	}

	const play = (url) => {
		assertNonEmptyString(url, 'url')
		send('play', [url])
	}
	const queue = (url) => {
		assertNonEmptyString(url, 'url')
		send('queue', [url])
	}
	const next = () => send('next')
	const previous = () => send('previous')
	const playPause = () => send('play-pause')
	const seek = (pos) => {
		if ('string' === typeof pos) {
			if (pos.length < 2 || (pos[0] !== '+' && pos[0] !== '-')) {
				throw new Error('pos is invalid.')
			}
		} else if ('number' !== typeof pos) {
			throw new Error('pos must be a string or a number.')
		}
		send('seek', [pos])
	}
	const seekPercent = (pos) => {
		assertNumber(pos, 'pos')
		send('seek-percent', [pos])
	}
	const setVolume = (volume) => {
		const t = typeof volume
		if ('number' !== t && 'string' !== t) {
			throw new Error('volume must be a string or a number.')
		}
		send('set-volume', [volume])
	}
	const stop = () => send('stop')

	return {
		play, queue, next, previous,
		playPause, seek, seekPercent,
		setVolume, stop
	}
}

module.exports = createClient
