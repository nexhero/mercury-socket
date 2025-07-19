#!/usr/bin/env node
import {Command} from 'commander'
import * as os from 'os'
import * as net from 'net'
import * as fs from 'fs'
import {createMessage} from './core/protocol.js'

// define de default socket path; it change based in the -s parameter
let default_socket = '/tmp/mercury.socket'

function createConnection(socket){
    if (!fs.existsSync(socket)) {
        console.error(`Error: Socket file ${socket} do not exist`)
        process.exit(1)
    }
    return net.connect(socket)
}
function handleSocketResponse(client,callback){
    client.on('data',(data)=>{
        try {
            const response = data.toString('utf8')
            callback(response)
        } catch (err) {
            console.error(`Error: ${err.message}`)
        }
        process.exit(0)
    })
}

function sendCommand(commandType,data={},socketPath){
    const client = createConnection(socketPath)
    client.write(createMessage(commandType,data))
    handleSocketResponse(client,(response)=>console.log(response))
}

//////////////////////////////////////////
// The program only works on Gnu/Linux, //
// just make it sure it's daddy os      //
//////////////////////////////////////////
if (os.type()!=='Linux') {
    console.error('This application is designed for Linux only. It may not work on other operating systems.')
    process.exit(1)
}

const program = new Command()
program
    .name('mercury-cli')
    .description('Terminal client for mercury socket, basic CRUD functions to manage your notes')
    .version('1.0.0')

program.requiredOption('-s, --socket <string>','(Required) Unix Domain Socket path, default "/tmp/mercury.socket"')

program
    .command('status')
    .description('Get unix socket status')
    .action((opts)=>{
        sendCommand('status',{},program.opts().socket)
    })
program
    .command('create')
    .description('Create a new entry')
    .requiredOption('--label <label>', 'Title of the entry')
    .requiredOption('--content <content>', 'Content of the entry')
    .option('--tag [tag]', 'Optional tag')
    .action((opts) => {
        sendCommand('create-note',{
            label:opts.label,
            content:opts.content,
            tag:opts.tag?opts.tag:"",
        },program.opts().socket)
    })

program
    .command('create-tag')
    .description('Create new tag')
    .requiredOption('--label <label>', 'Title of the tag')
    .option('--tag [tag]','Optional Parent tag')
    .action((opts)=>{
        sendCommand('create-tag',{
            label:opts.label,
            tag:opts.tag?opts.tag:"",
        },program.opts().socket)
    })

program
    .command('remove')
    .description('Remove a document')
    .requiredOption('--id <string>', 'Document ID')
    .action((opts) => {
        sendCommand('remove-document',{id:opts.id},program.opts().socket)
    });

program
    .command('all-documents')
    .description('List all documents created in json format')
    .action((opts)=>{
        sendCommand('all-documents',{},program.opts().socket)
    })
program
    .command('local-repository')
    .description('Get the local repository key')
    .action((opts)=>{
        sendCommand('get-local-repository',{},program.opts().socket)
    })
program
    .command('all-repository')
    .description('Get all appended repositories')
    .action((opts)=>{
        sendCommand('get-all-repository',{},program.opts().socket)
    })
program
    .command('append-repository')
    .description('Append remote repository')
    .requiredOption('--channel <string>', 'Repository key')
    .requiredOption('--name <string>', 'Assign a name for repository')
    .action((opts)=>{
        sendCommand('append-repository',{channel:opts.channel,name:opts.name},program.opts().socket)
    })
program
    .command('remove-repository')
    .description("Removes a specified channel, stopping all future updates for that channel.")
    .requiredOption('--id <string>', 'Repository ID')
    .action((opts)=>{
        sendCommand('remove-repository',{id:opts.id}, program.opts().socket)
    })
program.parse(process.argv)
