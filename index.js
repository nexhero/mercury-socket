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
    server.on('remove-document',(ctx)=>{
        console.log(`Remove document ${ctx}`)
    })
    server.listen()

}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(socket_url);
}
