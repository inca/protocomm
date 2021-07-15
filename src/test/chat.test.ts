import assert from 'assert';

import { createChatClient } from './chat.client';
import { ChatServer } from './chat.server';

describe('Chat Service', () => {
    const server = new ChatServer();

    beforeEach(() => server.start());
    afterEach(() => server.stop());

    describe('RPC', () => {
        it('delivers server responses back to clients', async () => {
            const joe = await createChatClient();
            const jane = await createChatClient();
            const res1 = await joe.join({
                user: { userId: 'joe' },
            });
            assert.deepStrictEqual(res1, { count: 1 });
            const res2 = await jane.join({
                user: { userId: 'jane' },
            });
            assert.deepStrictEqual(res2, { count: 2 });
            const res3 = await joe.getUsers({});
            assert.deepStrictEqual(res3, {
                users: [
                    { userId: 'joe' },
                    { userId: 'jane' },
                ]
            });
        });
    });

    describe('Events', () => {
        it('delivers server events to clients', async () => {
            const capturedEvents: any = [];
            const joe = await createChatClient();
            await joe.join({ user: { userId: 'joe' } });
            joe.userJoined.on(ev => capturedEvents.push({ name: 'userJoined', ev }));
            joe.userLeft.on(ev => capturedEvents.push({ name: 'userLeft', ev }));
            const jane = await createChatClient();
            await jane.join({ user: { userId: 'jane' } });
            await jane.leave({ userId: 'jane' });
            assert.deepStrictEqual(capturedEvents, [
                {
                    name: 'userJoined',
                    ev: { user: { userId: 'jane' } },
                },
                {
                    name: 'userLeft',
                    ev: { userId: 'jane' },
                }
            ]);
        });
    });

});
