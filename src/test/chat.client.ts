import WebSocket from 'ws';

import { RpcTransport, ServiceClient } from '../main';
import { ChatServiceDef } from './chat.service';
import { PORT } from './env';

export async function createChatClient(): Promise<ChatServiceDef> {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    await new Promise(r => ws.once('open', r));
    const transport = new RpcTransport();
    ws.on('message', (data: string) => transport.messageReceived.emit(data));
    transport.messageSent.on(data => ws.send(data));
    return ServiceClient.create(ChatServiceDef, transport);
}
