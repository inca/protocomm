import { Event } from 'typesafe-event';

export class RpcTransport {
    messageSent = new Event<string>();
    messageReceived = new Event<string>();
    connectionClosed = new Event<{}>();
}
