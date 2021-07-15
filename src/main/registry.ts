import { Exception } from 'typesafe-exception';

import { ServiceDef } from './service';

interface ServiceEntry<S, I extends S> {
    implementation: I;
    definition: ServiceDef<S>;
}

export class ServiceRegistry {
    map: Map<string, ServiceEntry<any, any>> = new Map();

    add<S, I extends S>(definition: ServiceDef<S>, implementation: I): this {
        this.map.set(definition.name, { definition, implementation });
        return this;
    }

    getDefinition<S>(name: string): ServiceDef<S> {
        const svc = this.map.get(name);
        if (!svc) {
            throw new ServiceNotFound(`Unknown service ${name}`);
        }
        return svc.definition;
    }

    getImplementation<S>(name: string): S {
        const svc = this.map.get(name);
        if (!svc) {
            throw new ServiceNotFound(`Unknown service ${name}`);
        }
        return svc.implementation;
    }

    [Symbol.iterator]() {
        return this.map.values();
    }

}

export class ServiceNotFound extends Exception {}
