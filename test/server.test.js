import { test }  from 'node:test'
import * as assert  from 'node:assert'
import * as net  from 'net'
import * as fs  from 'fs'
import * as path  from 'path'
import IPCServer  from '../core/server.js'

import {createMessage}   from '../core/protocol.js'
const socketPath = path.join('/tmp', `ipc-server-test-${Date.now()}.sock`)

function sendRawMessage(socketPath,command,msg) {
    return new Promise((resolve, reject) => {
        const client = net.createConnection(socketPath);
        client.write(createMessage(command,msg));

        client.on('data', (data) => {
            try {
                const json = JSON.parse(data.toString());
                resolve(json);
            } catch (err) {
                reject(err);
            } finally {
                client.end();
            }
        });

        client.on('error', reject);
    });
}

test('IPCServer should respond correctly to a valid command', async () => {
    const server = new IPCServer(socketPath);

    server.on('ping', () => {
        return { pong: true };
    });
    server.listen();

    await new Promise((r) => setTimeout(r, 50));
    const response = await sendRawMessage(socketPath, 'ping','hello')

    console.log(response)
    assert.strictEqual(response.command, 'payload');
    assert.strictEqual(response.payload.pong, true );

    await fs.unlinkSync(socketPath);
});

test('IPCServer should return error on unknown command', async () => {
  const server = new IPCServer(socketPath + '-err');
  server.listen();
  await new Promise((r) => setTimeout(r, 50));

  const response = await sendRawMessage(socketPath + '-err',
                                        'does-not-exist',
                                        {});

    console.log(response)
  assert.strictEqual(response.command, 'error');
  assert.ok(response.payload.error.includes('Command not found'));

  fs.unlinkSync(socketPath + '-err');
});
