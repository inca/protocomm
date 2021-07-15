import { Event } from 'typesafe-event';
import WebSocket from 'ws';

import { RpcTransport, ServiceRegistry, ServiceServer } from '../main';
import { ChatServiceDef, User } from './chat.service';
import { ChatSession } from './chat.session';
import { PORT } from './env';

export class ChatServer {
    wss: WebSocket.Server | null = null;
    chat = new Chat();

    async start() {
        this.chat = new Chat();
        const wss = this.wss = new WebSocket.Server({ port: PORT });
        wss.on('connection', ws => {
            const session = new ChatSession(this.chat);
            const transport = new RpcTransport();
            ws.on('message', (data: string) => transport.messageReceived.emit(data));
            transport.messageSent.on(data => ws.send(data));
            const registry = new ServiceRegistry();
            registry.add(ChatServiceDef, session);
            const server = new ServiceServer(transport, registry);
            server.initEvents();
        });
        await new Promise(r => wss.on('listening', r));
    }

    async stop() {
        await new Promise(r => {
            this.wss?.on('close', r);
            this.wss?.close();
        });
        this.wss = null;
    }

}

export class Chat implements ChatServiceDef {
    users: User[] = [];
    userJoined = new Event<{ user: User }>();
    userLeft = new Event<{ userId: string }>();

    async join(req: { user: User }): Promise<{ count: number }> {
        const { user } = req;
        this.users.push(user);
        this.userJoined.emit({ user });
        return { count: this.users.length };
    }

    async leave(req: { userId: string }): Promise<{}> {
        const { userId } = req;
        this.users = this.users.filter(_ => _.userId !== userId);
        this.userLeft.emit({ userId });
        return {};
    }

    async getUsers(): Promise<{ users: User[] }> {
        return {
            users: this.users
        };
    }
}
