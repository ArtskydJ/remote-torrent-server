var fs = require('fs')
var path = require('path')
var config = require('./config.json')
var SocketIoClient = require('socket.io-client')
var ss = require('socket.io-stream')
var crypto = require('crypto')

var socket = new SocketIoClient(config.host)

var trntStr = process.argv[2]
var authStr = process.argv[3]
if (!trntStr || !authStr || !/:/.test(authStr)) {
	console.log(
		'Usage:\n' +
		'  node client.js [trnt] [auth]\n' +
		'trnt can be one of the following:\n' +
		'  [magnet uri]\n' +
		'  [info hash]\n' +
		'  [http(s) path to torrent file]\n' +
		'auth must be formatted like:\n' +
		'  [username]:[password]'
	)
	quit('\nIncorrect usage', 1)
}

socket.on('connect', function () {
	var cred = authStr.split(':')
	var user = cred[0]
	var sha1 = hash('sha1', cred[1])
	socket.emit('authenticate', user, sha1, function (success) {
		if (success) {
			socket.emit('download torrent', trntStr)
		}
	})
})

ss(socket).on('file', save)
socket.on('disconnect', quit.bind(null, 'Disconnected from server'))
socket.on('msg', console.log)
socket.on('quit', quit)

function save(src, meta, next) {
	var dst = fs.createWriteStream(meta.path)
	src.pipe(dst)
	src.on('end', next)
}

function hash(type, str) {
	return crypto
		.createHash(type)
		.update(str)
		.digest('hex')
}

function quit(msg, code) {
	msg && console.log(msg)
	console.log('Shutting down')
	process.exit(code || 0)
}
