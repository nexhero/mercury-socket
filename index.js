import Mercury from 'mercury-core';

import Corestore from 'corestore'
import * as os from 'os'
import * as fs from 'fs'
import IPCServer from './core/server.js'
import {response} from './core/protocol.js'
const socket_url = '/tmp/mercury.sock'
const db_path = os.homedir() + '/.config/mercury/'
const db_name = 'mercury_db.db'


export async function main(socketPath){
    if (!fs.existsSync(db_path)) {
        console.log(`** Creating database folder **`)
        fs.mkdirSync(db_path)
    }

    // initialize database
    const store =  new Corestore(db_path + '/' + db_name)
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
    main(socket_url);
}
