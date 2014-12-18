var WebTorrent = require('webtorrent')
var each = require('each-series')
var Debug = require('debug')
var http = require('http')
var Io = require('socket.io')
var auth = require('./auth.json')
var torrentConfig = require('./torrentConfig.json')
var PORT = 8080

//instantiate
var server = http.createServer(onReq)
var torrenter = new WebTorrent({storage:true})
var io = new Io(server, { serveClient: false })
var authenticating = false
var dbg = console.log //Debug('rts')
server.listen(PORT)
dbg('listening on port ' + PORT)

io.on('connect', function (socket) {
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
			var t = torrenter.download(trntStr, torrentConfig, onTrnt)
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
			var url = trnt.infoHash + '/' + i
			socket.emit('file', url, file.name, next) //'next' is a cb
		}, function done(err) {
			err ?
				socket.emit('quit', err.message, err.code) :
				socket.emit('quit', 'Finished streaming ' + trnt.infoHash)
		})
	}
})

function onReq(req, res) {
	var infoHash = req.url.split('/')
	var n = parseInt(infoHash[1])
	infoHash = infoHash[0]
	console.log(req.url, 'request', infoHash, n)

	torrenter
		.get(infoHash)
		.files[n]
		.createReadStream()
		.pipe(res)
}
