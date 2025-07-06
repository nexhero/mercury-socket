const net = require('net')
const fs  = require('fs')
const {parseMessage,createMessage} = require('./protocol.js')

class IPCServer {
    constructor(socketPath){
        this.socketPath = socketPath
        this.routes = new Map()
        this.middlewares = []
    }
    use(middleware){
        this.middlewares.push(middleware)
    }
    on(route,handler){
        this.routes.set(route,handler)
    }
    async _handleRequest(client,raw){

        const msg = parseMessage(raw)

        if (!msg || typeof msg.route !== 'string') {
            client.write(createMessage('error',{error:'Invalid message format'}))
            return
        }
        const {route,data} = msg
        const ctx = {route,data,client,reply:(route,payload)=>{
            client.write(createMessage(route,payload));
        }}

        // apply middleware on request
        for (const m of this.middlewares) {
            await m(ctx)
        }

        // seek route function
        const handler = this.routes.get(route)
        if (!handler) {
            ctx.reply('error',{error:`Route not found ${route}`})
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
