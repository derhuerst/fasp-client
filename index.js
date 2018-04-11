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
const is = val => val !== null && val !== undefined

const once = (emitter, event, cb) => {
	if ('function' === typeof emitter.once) {
		emitter.once(event, cb)
	} else {
		const f = function () {
			emitter.removeEventListener(event, f)
			cb.apply({}, arguments)
		}
		emitter.addEventListener(event, f)
	}
}

const createClient = (url, onProp) => {
	const receiver = new ReconnectingWebSocket(url, [], {
		constructor: WebSocket
	})

	receiver.addEventListener('message', (msg) => {
		console.error('msg', msg.data)
		try {
			msg = JSON.parse(msg.data)
		} catch (err) {
			return // ignore invalid messages
		}
		if (
			!Array.isArray(msg) ||
			'string' !== typeof msg[0] ||
			!msg[0].length
		) return null
		if (msg[0] === 'prop') onProp(msg[1], msg[2])
	})

	const send = (cmd, args = []) => {
		const msg = JSON.stringify([cmd].concat(args))
		const _send = () => receiver.send(msg)
		if (receiver.readyState === WebSocket.OPEN) _send()
		else once(receiver, 'open', _send)
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
	const remove = (idx) => {
		assertNumber(idx, 'idx')
		send('remove', [idx])
	}
	const stop = () => send('stop')

	const resume = () => send('resume')
	const pause = () => send('pause')
	const seek = (pos, absolute, percent) => {
		assertNumber(pos, 'pos')
		if (is(absolute) && 'boolean' !== typeof absolute) {
			throw new Error('absolute must be a a boolean.')
		}
		if (is(percent) && 'boolean' !== typeof percent) {
			throw new Error('percent must be a a boolean.')
		}
		send('seek', [pos, absolute, percent])
	}
	const setVolume = (volume) => {
		assertNumber(volume, 'volume')
		send('set-volume', [volume])
	}

	send('get-props')

	return {
		play, queue, next, previous, remove, stop,
		resume, pause, seek, setVolume
	}
}

module.exports = createClient
