var WebTorrent = require('webtorrent')
var config = require('./config.json')
var each = require('each-series')
var SocketIoServer = require('socket.io')
var auth = require('./auth.json')
var PORT = config.port || 5004
var torrentOpts = { announce: config.announce }

//instantiate
var torrenter = new WebTorrent({storage:true})
var server = new SocketIoServer()
server.listen(PORT)

server.on('connection', function (socket) {
	var authed = false

	socket.on('authenticate', function (user, sha1, cb) {
		setTimeout(function () {
			authed = (auth[user] === sha1)
			cb(authed)
		}, 1000) //anti brute force
	})

	socket.on('download torrent', function (torrentStr) {
		if (authed) {
			console.log('torrent: "' + torrentStr + '"')
			var torrent = torrenter.download(torrentStr, torrentOpts, onTorrent)
			torrent.swarm.on('download', console.log.bind(null, 'download'))
			torrent.discovery.on('peer', console.log.bind(null, 'peer!'))

			function onTorrent(torrent) {
				console.log('downloaded ' + torrent.infoHash)
				each(torrent.files, function (file, i, done) {
					console.log('streaming ' + file.name)
					file.createReadStream()
						.pipe(res) //, {end:false}
						.on('end', function () {
							console.log('finished')
							done()
						})
				}, function done(err) {
					console.log('Done!')
				})
			}
		}
	})

	socket.on('disconnect', function () {

	})
})
