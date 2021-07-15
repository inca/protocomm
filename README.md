# ProtoComm — bi-directional RPC + events microframework

**Status:** work-in-progress, use at your own risk.

Facilitates transparent bi-directional communication between services. Works in Node.js and Browser (over WebSocket).

## Features

- shared message and service definitions in JSON Schema format
- transparent access: clients just invoke methods and subscribe to events as if the service was a class within the same process/runtime
- transport is abstracted away from business logic
- no reliance on code generation (unlike Protobuf toolset)
- transport-agnostic; built for WebSockets in mind, but can work with IPC, TCP (albeit custom framing required)

## How to use

Let's use [Chat Service](test/chat.service.ts) from tests as a motivational example.

- [ChatServiceDef](test/chat.service.ts) is a _service definition_ which is shared across Server and Client
- On server side, [ChatSession](test/chat.session.ts) implements `ChatServiceDef` interface *per connected client*.
- On client side, [ServiceClient](test/chat.client.ts) creates a stub using the shared service def. Conceptually, each client "talks" to its session.
- Finally, on server side [ChatServer](test/chat.server.ts) sets up the WebSocket server, hooks it up with the transport and creates a service registry.
- The [tests](test/chat.test.ts) demonstrate how messages are delivered both in RPC style (response delivered to the client who sent the request) and in Event-driven style.
