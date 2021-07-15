import { Event } from 'typesafe-event';
import { Exception } from 'typesafe-exception';

import { RpcEvent, RpcMethodRequest, RpcMethodResponse } from './messages';
import { Method, ServiceDef, ServiceMethodDef } from './service';
import { RpcTransport } from './transport';

export class ServiceClient<S> {
    protected id = 0;
    protected awaitingCommands: Map<number, AwaitingCommand<any>> = new Map();
    protected eventMap: Map<string, Event<any>> = new Map();

    private constructor(
        public serviceDef: ServiceDef<S>,
        public transport: RpcTransport,
    ) {
        transport.messageReceived.on(msg => this.processIncomingMessage(msg));
        transport.connectionClosed.on(() => this.onClosed());
    }

    static create<S>(serviceDef: ServiceDef<S>, transport: RpcTransport) {
        const client = new ServiceClient(serviceDef, transport);
        return client.createClient();
    }

    protected createClient(): S {
        const result: any = {};
        for (const methodName of Object.keys(this.serviceDef.methods)) {
            result[methodName] = this.createMethod(methodName);
        }
        for (const eventName of Object.keys(this.serviceDef.events)) {
            result[eventName] = this.createEvent(eventName);
        }
        return result;
    }

    protected createMethod<Req, Res>(methodName: string): Method<Req, Res> {
        const serviceName = this.serviceDef.name;
        const methodDef = (this.serviceDef.methods as any)[methodName] as ServiceMethodDef<Req, Res>;
        if (!methodDef) {
            throw new Error(`Unknown method: ${serviceName}.${methodName}`);
        }
        return async (req: Req) => {
            this.id = (this.id + 1) % Number.MAX_SAFE_INTEGER;
            // TODO add opt-in client validation
            const rpcPayload: RpcMethodRequest = {
                id: this.id,
                service: serviceName,
                method: methodName,
                params: req,
            };
            return new Promise<Res>((resolve, reject) => {
                // TODO add timeout
                this.awaitingCommands.set(this.id, {
                    id: this.id,
                    methodName,
                    resolve,
                    reject,
                });
                this.transport.messageSent.emit(JSON.stringify(rpcPayload));
            });
        };
    }

    protected createEvent(eventName: string) {
        const evt = new Event<any>();
        this.eventMap.set(eventName, evt);
        return evt;
    }

    protected processIncomingMessage(msg: string) {
        const res = JSON.parse(msg);
        if (res.id) {
            return this.handleMethodResponse(res);
        }
        if (res.event) {
            return this.handleEvent(res);
        }
    }

    protected handleMethodResponse(res: RpcMethodResponse) {
        const cmd = this.awaitingCommands.get(res.id);
        if (!cmd) {
            return;
        }
        this.awaitingCommands.delete(res.id);
        const { resolve, reject } = cmd;
        // TODO add opt-in client validation
        if (res.error) {
            reject(Exception.fromJSON({
                name: res.error?.name ?? 'UnknownError',
                message: res.error?.message ?? 'Unknown error',
            }));
        } else {
            resolve(res.result);
        }
    }

    protected handleEvent(res: RpcEvent) {
        const event = this.eventMap.get(res.event);
        if (!event) {
            return;
        }
        // TODO add opt-in client validation
        event.emit(res.params);
    }

    protected onClosed() {
        for (const cmd of this.awaitingCommands.values()) {
            const err = new ClientClosed(`Method ${cmd.methodName} failed: client connection closed`);
            cmd.reject(err);
        }
        this.awaitingCommands.clear();
        this.id = 0;
    }

}

interface AwaitingCommand<T> {
    id: number;
    methodName: string;
    resolve: (result: T) => void;
    reject: (error: Error) => void;
}

export class ClientClosed extends Exception {}
