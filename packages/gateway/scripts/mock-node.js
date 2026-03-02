import { WebSocket } from 'ws';

const GATEWAY_URL = 'ws://localhost:3002'; // Default gateway port
const NODE_SECRET = process.env.NODE_SECRET;

console.log(`[mock-node] Connecting to ${GATEWAY_URL}...`);

const ws = new WebSocket(GATEWAY_URL);

ws.on('open', () => {
    console.log('[mock-node] Connected!');

    // Handshake
    const handshake = {
        type: 'handshake',
        nodeId: 'rpi-test-node',
        secret: NODE_SECRET,
        skills: [
            {
                name: 'toggle_led',
                description: 'Toggle a physical LED on the mock node.',
                parameters: {
                    type: 'object',
                    properties: {
                        state: { type: 'boolean', description: 'True to turn on, False to turn off.' }
                    },
                    required: ['state']
                }
            }
        ]
    };

    ws.send(JSON.stringify(handshake));
});

ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('[mock-node] Received:', message);

    if (message.jsonrpc === '2.0' && message.method === 'toggle_led') {
        const { state } = message.params;
        console.log(`[mock-node] Toggling LED to: ${state}`);

        // Respond with success
        const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: { success: true, newState: state }
        };
        ws.send(JSON.stringify(response));
    }

    if (message.type === 'handshake_ok') {
        console.log('[mock-node] Handshake successful!');
    }
});

ws.on('close', () => {
    console.log('[mock-node] Connection closed.');
});

ws.on('error', (err) => {
    console.error('[mock-node] Error:', err);
});
