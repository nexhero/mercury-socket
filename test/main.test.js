import { test } from 'node:test';
import assert from 'node:assert';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { main } from '../index.js';
import {createMessage} from '../core/protocol.js'
const socketPath = path.join('/tmp', `test-mercury-${Date.now()}.sock`);

await main( socketPath);
function sendMessage(socketPath, command, msg) {
    return new Promise((resolve, reject) => {
        const client = net.createConnection(socketPath);
        client.write(createMessage(command,msg));

        client.on('data', (data) => {
            // console.log(`data received ${data}`)
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


// test('should respond to "status" command', async () => {


//     const res = await sendMessage(socketPath,'status','ok')

//     console.log(`main response: ${res.command}`)
//     assert.strictEqual(res.command, 'status');

//     // assert.deepStrictEqual(res.payload, { result: 'ok' });

// });

test('should create a note', async () => {
    const res = await sendMessage(socketPath, 'create-note',{
        label:'abc',
        content:'this is the content'
    });
    assert.strictEqual(res.command, 'create-note');
});
test('should get all documents', async () => {
    const res = await sendMessage(socketPath, 'all-documents',{});
    assert.strictEqual(res.command, 'all-documents');
});
test('should get document by id', async () => {
    const res = await sendMessage(
        socketPath,
        'document-id',
        {
            id:'z835clk'
    });
    console.log(res)
    assert.strictEqual(res.command, 'document');
});
test('should remove document by id', async () => {
    const res = await sendMessage(
        socketPath,
        'remove-document',
        {
            id:'z835clk'
    });
    assert.strictEqual(res.command, 'remove-document');
});
test('should get local repository connection key', async () => {
    const res = await sendMessage(
        socketPath,'get-local-repository',{});
    console.log(res)
    assert.strictEqual(res.command, 'local-repository');
});

// NTFjMjJjYWU3ODk3Njc1NGVhZjU4MWY2MDM1Y2E4ZGU4N2RkZGEzMGU3NDg2YWM4YTU4MTBjNTdhYzdjMTgyOTo1ODMyNjQwZTgzNzI2MGRlN2JiNTUyYTk2YTY4ZjcxMmI4ZTUyOGQxZGUzYzM3MzgxYWRjNjUxYTAwYzBjMjM5OjYxNzcyZDU5MGNmMTg2NDMzOTU5MmY1ZGRiMWUwM2RlZGRjMjEwZGVjOGUzMDEzZGVlNjNhNTY2NjlkNjI1NTc=
test('should append remote repository ', async () => {
    const res = await sendMessage(
        socketPath,'append-repository',{
            channel:'NTFjMjJjYWU3ODk3Njc1NGVhZjU4MWY2MDM1Y2E4ZGU4N2RkZGEzMGU3NDg2YWM4YTU4MTBjNTdhYzdjMTgyOTo1ODMyNjQwZTgzNzI2MGRlN2JiNTUyYTk2YTY4ZjcxMmI4ZTUyOGQxZGUzYzM3MzgxYWRjNjUxYTAwYzBjMjM5OjYxNzcyZDU5MGNmMTg2NDMzOTU5MmY1ZGRiMWUwM2RlZGRjMjEwZGVjOGUzMDEzZGVlNjNhNTY2NjlkNjI1NTc=',
            name:'local-this'
        });
    console.log(res)
    assert.strictEqual(res.command, 'append-repository');
});
test('should get all repos ', async () => {
    const res = await sendMessage(
        socketPath,'get-all-repository',{});
    console.log(res)
    assert.strictEqual(res.command, 'repositories');
});


// // 🧪 Test "remove-document" command
// test('should remove a document', async () => {
//

//     const res = await sendMessage(socketPath, {
//         command: 'remove-document',
//         data: { id: 'xyz789' }
//     });

//     assert.strictEqual(res.id, '3');
//     assert.strictEqual(res.command, 'response');
//     assert.deepStrictEqual(res.payload, {
//         result: { removed: true, id: 'xyz789' }
//     });

//     fs.unlinkSync(socketPath);
// });
