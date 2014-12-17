var WebTorrent = require('webtorrent')
var config = require('./config.json')
var each = require('each-series')
var Debug = require('debug')
var SocketIoServer = require('socket.io')
var ss = require('socket.io-stream')
var auth = require('./auth.json')
var PORT = config.port || 5004

//instantiate
var torrenter = new WebTorrent({storage:true})
var server = new SocketIoServer(PORT, { serveClient: false })
var authenticating = false
var dbg = Debug('server')
dbg('listening on port ' + PORT)

server.on('connect', function (socket) {
	var authed = false
	var torrentList = [] //to delete on disconnect
	msg('Connection established')

	socket.on('authenticate', function (user, sha1, cb) {
		if (!authenticating) {
			authenticating = true
			dbg('Auth attempt:' + user)
			setTimeout(function () {
				authenticating = false
				authed = (auth[user] === sha1)
				msg('Authentication ' + (authed? 'success' : 'failure'))
				cb(authed)
			}, 1000) //anti brute force
		}
	})

	socket.on('download torrent', function (trntStr) {
		if (authed) {
			dbg('torrent: "' + trntStr + '"')
			var t = torrenter.download(trntStr, config.torrent, onTrnt)
			msg('Downloading ' + t.infoHash)
		}
	})

	socket.on('disconnect', function () {
		dbg('disconnected from client')
	})

	function msg(message) {
		socket.emit('msg', message)
		dbg(message)
	}

	function onTrnt(trnt) {
		msg('Finished downloading ' + trnt.infoHash)
		each(trnt.files, function e(file, i, next) {
			msg('Streaming ' + file.name)
			var meta = {
				name: file.name,
				path: file.path,
				size: file.size
			}
			var src = file.createReadStream()
			var dst = ss.createStream()
			ss(socket).emit('file', dst, meta, next) //'next' is a cb
			src.pipe(dst)
		}, function done(err) {
			err ?
				socket.emit('quit', err.message, err.code) :
				socket.emit('quit', 'Finished streaming ' + trnt.infoHash)
		})
	}
})
