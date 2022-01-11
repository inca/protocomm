import { Event } from 'typesafe-event';
import { Exception } from 'typesafe-exception';

import { RpcEvent, RpcMethodRequest, RpcMethodResponse } from './messages';
import { ServiceRegistry } from './registry';
import { ServiceDef, ServiceMethodDef } from './service';
import { RpcTransport } from './transport';

export class ServiceServer {

    constructor(
        public transport: RpcTransport,
        public registry: ServiceRegistry,
    ) {
        transport.messageReceived.on(data => this.onMessageReceived(data));
    }

    initEvents() {
        for (const svc of this.registry) {
            for (const eventName of Object.keys(svc.definition.events)) {
                const event = svc.implementation[eventName] as Event<any>;
                event.on(data => this.dispatchEvent(svc.definition, eventName, data));
            }
        }
    }

    protected async onMessageReceived(data: string) {
        const rpcReq = JSON.parse(data) as RpcMethodRequest;
        const rpcRes = await this.runMethod(rpcReq);
        this.transport.messageSent.emit(JSON.stringify(rpcRes));
    }

    protected async runMethod(rpcReq: RpcMethodRequest): Promise<RpcMethodResponse> {
        const { id, service, method, params } = rpcReq;
        try {
            const def = this.registry.getDefinition<any>(service);
            const impl = this.registry.getImplementation<any>(service);
            const methodDef = def.methods[method] as ServiceMethodDef<any, any>;
            if (!methodDef) {
                throw new MethodNotFound(`Unknown method ${service}.${method}`);
            }
            const reqSchema = this.registry.getDecoder(methodDef.params);
            const resSchema = this.registry.getDecoder(methodDef.returns);
            const decodedParams = reqSchema.decode(params);
            const res = await impl[method](decodedParams);
            return {
                id,
                result: resSchema.decode(res),
            };
        } catch (err: any) {
            return {
                id,
                error: {
                    name: err.name,
                    message: err.message,
                }
            };
        }
    }

    protected dispatchEvent(
        serviceDef: ServiceDef<any>,
        eventName: string,
        params: any,
    ) {
        const eventDef = serviceDef.events[eventName];
        const eventSchema = this.registry.getDecoder(eventDef.params);
        const encodedParams = eventSchema.decode(params);
        const payload: RpcEvent = {
            event: eventName,
            params: encodedParams,
        };
        this.transport.messageSent.emit(JSON.stringify(payload));
    }

}

export class MethodNotFound extends Exception {}
