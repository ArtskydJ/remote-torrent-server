var fs = require('fs')
var path = require('path')
var config = require('./config.json')
var SocketIoClient = require('socket.io-client')
var crypto = require('crypto')
var socket = new SocketIoClient(config.host)

var PORT = config.port || 5004
var torrentStr = process.argv[2]
var authStr = process.argv[3]
var helpStrs = [
	'Usage:',
	'  node client.js [trnt] [auth]',
	'trnt can be one of the following:',
	'  [magnet uri]',
	'  [info hash]',
	'  [http(s) path to torrent file]',
	'auth must be formatted like:',
	'  [username]:[password]'
]
if (!torrentStr) {
	helpStrs.forEach(console.log)
	process.exit(1)
}

socket.on('connect', function () {
	console.log('Authenticate!')
	authStr = authStr.split(':')
	var user = authStr[0]
	var sha1 = crypto.createHash('sha1').end(authStr[1], 'utf8')
	console.log('user: ' + user + ', sha1: ' + sha1)
	socket.emit('authenticate', user, sha1, function (success) {
		if (success) {
			console.log('Sucessful login')
			socket.emit('download torrent', torrentStr)
		} else {
			console.log('Unsucessful login')
		}
	})
	
	var dst = fs.createWriteStream(socket.path)
	socket.pipe(dst)
})

