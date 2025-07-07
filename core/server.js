import * as net from 'net'
import * as fs from 'fs'
import  {parseMessage,createMessage} from './protocol.js'
// const net = require('net')
// const fs  = require('fs')
// const {parseMessage,createMessage} = require('./protocol.js')

export default class IPCServer {
    constructor(socketPath){
        this.socketPath = socketPath
        this.commands = new Map()
        this.middlewares = []
    }
    // TODO: middleware needs to be implemented
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
        const {command,payload} = msg
        const ctx = {command,payload,client,reply:(command,_payload)=>{
            client.write(createMessage(command,_payload));
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
            ctx.reply(result.command,result.payload)
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

// module.exports = IPCServer
