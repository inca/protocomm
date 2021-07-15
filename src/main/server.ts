import { Event } from 'typesafe-event';
import { Exception } from 'typesafe-exception';
import { Schema } from 'typesafe-json-schema';

import { RpcEvent, RpcMethodRequest, RpcMethodResponse } from './messages';
import { ServiceRegistry } from './registry';
import { ServiceDef, ServiceMethodDef } from './service';
import { RpcTransport } from './transport';

export class ServiceServer {
    schemaCache: Map<object, Schema<any>> = new Map();

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
            const reqSchema = this.getSchema(methodDef.params);
            const resSchema = this.getSchema(methodDef.returns);
            const decodedParams = reqSchema.decode(params);
            const res = await impl[method](decodedParams);
            return {
                id,
                result: resSchema.decode(res),
            };
        } catch (err) {
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
        const eventSchema = this.getSchema(eventDef.params);
        const encodedParams = eventSchema.decode(params);
        const payload: RpcEvent = {
            event: eventName,
            params: encodedParams,
        };
        this.transport.messageSent.emit(JSON.stringify(payload));
    }

    getSchema(def: any): Schema<any> {
        const cached = this.schemaCache.get(def);
        if (cached) {
            return cached;
        }
        const schema = new Schema<any>(def);
        this.schemaCache.set(def, schema);
        return schema;
    }

}

export class MethodNotFound extends Exception {}
