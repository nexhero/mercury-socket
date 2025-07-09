#!/usr/bin/env node

import Mercury from 'mercury-core';
import Corestore from 'corestore'
import * as os from 'os'
import * as fs from 'fs'
import { Command} from 'commander'

import IPCServer from './core/server.js'
import {response} from './core/protocol.js'


let default_sock_path = '/tmp/mercury.sock'
let default_storage_dir = os.homedir() + '/.config/mercury/'
let default_db = 'mercury_db.db'


export async function main(socketPath,storageDir,database){

    if (!fs.existsSync(storageDir)) {
        console.log(`** Creating database folder **`)
        fs.mkdirSync(storageDir)
    }

    // initialize database
    const store =  new Corestore(storageDir + '/' + database)
    const mercury =  new Mercury(store)
    await mercury.initialize()
    mercury.listen()

    const server = new IPCServer(socketPath)
    server.on('status',(ctx)=>{

        return response('status',{
            state:'running'
        })

    })

    server.on('create-note',async(ctx)=>{
        const doc = mercury.createDocument('NOTE')
        doc.setLabel(ctx.payload.label)
        doc.setContent(ctx.payload.content)
        try {
            await doc.save()
            return response('create-note',{
                ...doc.toJson()
            })
        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })

    server.on('all-documents',async(ctx)=>{
        try {
            const all_docs = await mercury.db.getAllDocuments()
            return response('all-documents',{...all_docs})

        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })
    server.on('document-id',async(ctx)=>{
        try {
            const doc = await mercury.db.getDocument(ctx.payload.id)
            return response('document',{...doc.value})
        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })

    server.on('remove-document',async(ctx)=>{
        try {
            const doc = await mercury.db.removeDocument(ctx.payload.id)
            return response('remove-document',{result:'ok'})
        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })

    server.on('get-local-repository',async(ctx)=>{
        try {
            const channel =  mercury.encodeRepository()
            return response('local-repository',{channel})
        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })

    server.on('get-all-repository',async()=>{
        try {
            const repos = await mercury.db.getAllRepositories()
            return response('repositories',{...repos})
        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })

    server.on('append-repository',async(ctx)=>{
        try {
            const {channel,name} =  ctx.payload
            const res = await mercury.joinRemoteRepository(channel,name)
            return response('append-repository',{result:'ok'})

        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })
    server.on('remove-repository',async(ctx)=>{
        try {

            const res = await mercury.removeRepository(ctx.payload.id)
            return response('remove-repository',{result:'ok'})

        } catch (err) {
            return response('error',{error:err.toString()})
        }
    })
    server.listen()

}

if (import.meta.url === `file://${process.argv[1]}`) {

    if (os.type()!=='Linux') {
        console.error('This application is designed for Linux only. It may not work on other operating systems.')
        process.exit(1)
    }
    const program = new Command()
    program
        .name('mercury-socket')
        .description('Run unix domain socket, to manage notes')
        .version('1.0.0')
    program.option('-s, --socket <string>','path for the socket')
    program.option('-d, --dir <string>','Directory to save database')
    program.option('-b, --database <string>','Database name')


    program.parse(process.argv)
    const options = program.opts();
    if (options.socket) {
        default_sock_path =options.socket
    }

    if (options.dir) {
        default_storage_dir = options.dir
    }
    if (options.database) {
        default_db = options.database
    }
    main(default_sock_path,default_storage_dir,default_db);
}
