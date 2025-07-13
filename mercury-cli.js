#!/usr/bin/env node
import {Command} from 'commander'
import * as os from 'os'
import * as net from 'net'
import * as fs from 'fs'
import {createMessage} from './core/protocol.js'

// define de default socket path
let default_socket = '/tmp/mercury.sock'

function createConnection(socket){
    try {
        if (!fs.existsSync(socket)) {
            console.error(`Error: Socket file ${socket} do not exist`)
            process.exit(1)
        }
        const client = net.connect(socket)
        return client
    } catch (err) {
        console.log(`Error: Unable to connect socket ${err.message}`)
        process.exit(1)
    }
}

if (os.type()!=='Linux') {
    console.error('This application is designed for Linux only. It may not work on other operating systems.')
    process.exit(1)
}

const program = new Command()
program
    .name('mercury-cli')
    .description('Terminal client for mercury socket, basic CRUD functions to manage your notes')
    .version('1.0.0')

program.requiredOption('-s, --socket <string>','(Required) Unix Domain Socket path, default "/tmp/mercury.sock"')

program
    .command('status')
    .description('Get unix socket status')
    .action((opts)=>{
        
        const socket = program.opts().socket
        const client = createConnection(socket)
        try {
            client.write(createMessage('status',{}))
            client.on('data',(data)=>{
                console.log(data.toString('utf8'))
                process.exit(0)

            })
        } catch (error) {
            console.error("Invalid JSON string:", error.message);
        }
    })
program
    .command('create')
    .description('Create a new entry')
    .requiredOption('--title <title>', 'Title of the entry')
    .requiredOption('--content <content>', 'Content of the entry')
    .option('--tag [tag]', 'Optional tag')
    .action((opts) => {
        if (!opts.title || !opts.content) {
            console.error(`Error: --title and --content are required.`)
            process.exit(1)
        }
        const socket = program.opts().socket
        const client = createConnection(socket)
        try {
            client.write(createMessage('create-note',{
                title:opts.title,
                content:opts.content
            }))
            client.on('data',(data)=>{
               console.log(data.toString('utf8'));
                process.exit(0)

            })
        } catch (error) {
            console.error("Invalid JSON string:", error.message);
        }

    });

program
    .command('remove')
    .description('Remove a document')
    .requiredOption('--id <string>', 'Document ID')
    .action((opts) => {

        const socket = program.opts().socket
        const client = createConnection(socket)
        try {
            client.write(createMessage('remove-document',{id:opts.id}))
            client.on('data',(data)=>{
                console.log(data.toString('utf8'))
                process.exit(0)

            })
        } catch (error) {
            console.error("Invalid JSON string:", error.message);
        }

    });

program
    .command('all-documents')
    .description('List all documents created in json format')
    .action((opts)=>{
        const socket = program.opts().socket
        const client = createConnection(socket)
        try {
            client.write(createMessage('all-documents',{}))
            client.on('data',(data)=>{
                console.log(data.toString('utf8'))
                process.exit(0)

            })
        } catch (error) {
            console.error("Invalid JSON string:", error.message);
        }

    })

program.parse(process.argv)
