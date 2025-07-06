const net = require('net')
const fs  = require('fs')
const {parseMessage,createMessage} = require('./protocol.js')

class IPCServer {
    constructor(socketPath){
        this.socketPath = socketPath
        this.commands = new Map()
        this.middlewares = []
    }
    use(middleware){
        this.middlewares.push(middleware)
    }
    on(command,handler){
        this.commands.set(command,handler)
    }
    async _handleRequest(client,raw){

        const msg = parseMessage(raw)

        if (!msg || typeof msg.command !== 'string') {
            client.write(createMessage('error',{error:'Invalid message format'}))
            return
        }
        const {command,data} = msg
        const ctx = {command,data,client,reply:(command,payload)=>{
            client.write(createMessage(command,payload));
        }}

        // apply middleware on request
        for (const m of this.middlewares) {
            await m(ctx)
        }

        // seek command function
        const handler = this.commands.get(command)
        if (!handler) {
            ctx.reply('error',{error:`Command not found ${command}`})
            return
        }
        try {
            const result = await handler(ctx)
            ctx.reply('payload',{...result})
        } catch (err) {
            ctx.reply('error',{error:err.message})
        }
    }

    listen(){

        if (fs.existsSync(this.socketPath)) {
            fs.unlinkSync(this.socketPath)
        }
        const server = net.createServer((client)=>{
            client.on('data',(data)=>{

                this._handleRequest(client,data)
            })
        })
        server.listen(this.socketPath,()=>{
            console.log(`IPC Listening on ${this.socketPath}`)
        })
    }
}

module.exports = IPCServer
