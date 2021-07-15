import { Event } from 'typesafe-event';
import { JsonSchema } from 'typesafe-json-schema';

import { ServiceDef } from '../main';

export interface User {
    userId: string;
}

export const User: JsonSchema<User> = {
    type: 'object',
    properties: {
        userId: { type: 'string' }
    }
};

export interface ChatServiceDef {
    join(req: { user: User }): Promise<{ count: number }>;
    leave(req: { userId: string }): Promise<{}>;
    getUsers(req: {}): Promise<{ users: User[] }>;

    userJoined: Event<{ user: User }>;
    userLeft: Event<{ userId: string }>;
}

export const ChatServiceDef: ServiceDef<ChatServiceDef> = {
    name: 'Chat',
    methods: {
        join: {
            params: {
                type: 'object',
                properties: {
                    user: User,
                }
            },
            returns: {
                type: 'object',
                properties: {
                    count: { type: 'integer' }
                }
            },
        },
        leave: {
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' },
                }
            },
            returns: {
                type: 'object',
                properties: {}
            },
        },
        getUsers: {
            params: {
                type: 'object',
                properties: {}
            },
            returns: {
                type: 'object',
                properties: {
                    users: {
                        type: 'array',
                        items: User
                    }
                }
            },
        }
    },
    events: {
        userJoined: {
            params: {
                type: 'object',
                properties: {
                    user: User
                }
            }
        },
        userLeft: {
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' },
                }
            }
        }
    }
};
