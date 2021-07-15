import { JsonSchema } from 'typesafe-json-schema';

export interface RpcError {
    name: string;
    message: string;
}

export const RpcError: JsonSchema<RpcError> = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        message: { type: 'string' },
    }
};

export interface RpcMethodRequest {
    id: number;
    service: string;
    method: string;
    params: any;
}

export const RpcMethodRequest: JsonSchema<RpcMethodRequest> = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        service: { type: 'string' },
        method: { type: 'string' },
        params: {} as any,
    }
};

export interface RpcMethodResponse {
    id: number;
    result?: any;
    error?: RpcError;
}

export const RpcMethodResponse: JsonSchema<RpcMethodResponse> = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        result: { optional: true } as any,
        error: { ...RpcError, optional: true },
    }
};

export interface RpcEvent {
    event: string;
    params: any;
}
