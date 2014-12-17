remote-torrent-server
=====================

get a server to download a torrent and stream it to you

#install

On a server do:
```
$ npm install remote-torrent-server
```

Then create a file called auth.json in the same directory:
```json
{
  "user1": "c22b5f9178342609428d6f51b2c5af4c0bde6a42",
  "anotherUser": "9a76a857ad399b492ba01879d0fa2d717e4430b2"
}
```

The passwords are sha1 hashes. You can easily calculate these by searching `sha1 [whatever]` with [http://duckduckgo.com](Duck Duck Go).

#usage

Install remote-torrent-client on a computer, use it to get stuff.
