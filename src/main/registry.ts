import { Schema, SchemaDecoder, SchemaStore } from 'airtight';
import { Exception } from 'typesafe-exception';

import { ServiceEventDef, ServiceMethodDef } from '.';
import { ServiceDef } from './service';

interface ServiceEntry<S, I extends S> {
    implementation: I;
    definition: ServiceDef<S>;
}

export class ServiceRegistry {
    schemaStore: SchemaStore;
    serviceMap: Map<string, ServiceEntry<any, any>> = new Map();

    constructor(schemaStore?: SchemaStore) {
        this.schemaStore = new SchemaStore(schemaStore);
    }

    add<S, I extends S>(definition: ServiceDef<S>, implementation: I): this {
        this.serviceMap.set(definition.name, { definition, implementation });
        for (const def of Object.values(definition.methods)) {
            const methodDef = def as ServiceMethodDef<any, any>;
            this.schemaStore.add(methodDef.params);
            this.schemaStore.add(methodDef.returns);
        }
        for (const def of Object.values(definition.events)) {
            const eventDef = def as ServiceEventDef<any>;
            this.schemaStore.add(eventDef.params);
        }
        for (const schema of definition.types ?? []) {
            this.schemaStore.add(schema);
        }
        return this;
    }

    getDefinition<S>(name: string): ServiceDef<S> {
        const svc = this.serviceMap.get(name);
        if (!svc) {
            throw new ServiceNotFound(`Unknown service ${name}`);
        }
        return svc.definition;
    }

    getImplementation<S>(name: string): S {
        const svc = this.serviceMap.get(name);
        if (!svc) {
            throw new ServiceNotFound(`Unknown service ${name}`);
        }
        return svc.implementation;
    }

    getDecoder(schema: Schema<any>): SchemaDecoder<any> {
        return new SchemaDecoder(schema, this.schemaStore);
    }

    [Symbol.iterator]() {
        return this.serviceMap.values();
    }

}

export class ServiceNotFound extends Exception {}
