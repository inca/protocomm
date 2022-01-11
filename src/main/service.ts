import { Schema } from 'airtight';
import { Event } from 'typesafe-event';

export type Method<Params, Returns> = (params: Params) => Promise<Returns>;

export type ServiceDef<S> = {
    name: string;
    methods: ServiceMethods<S>;
    events: ServiceEvents<S>;
    types?: Schema<unknown>[];
}

type IsMethod<S, M extends keyof S> = S[M] extends Method<any, any> ? M : never;
type IsEvent<S, M extends keyof S> = S[M] extends Event<any> ? M : never;

export type ServiceMethods<S> = {
    [K in keyof S as IsMethod<S, K>]:
        S[K] extends Method<infer P, infer R> ? ServiceMethodDef<P, R> : never;
}

export type ServiceEvents<S> = {
    [K in keyof S as IsEvent<S, K>]:
        S[K] extends Event<infer E> ? ServiceEventDef<E> : never;
}

export type ServiceMethodDef<P, R> = {
    params: Schema<P>;
    returns: Schema<R>;
}

export type ServiceEventDef<E> = {
    params: Schema<E>;
}
