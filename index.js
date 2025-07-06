const IPCServer = require('./core/server.js')
console.log("TESt")

const server = new IPCServer('/tmp/mercury.sock')


server.listen()
