import { Chat } from './chat.server';
import { User } from './chat.service';

export class ChatSession extends Chat {

    constructor(protected chat: Chat) {
        super();
        this.chat.userJoined.on(ev => this.userJoined.emit(ev));
        this.chat.userLeft.on(ev => this.userLeft.emit(ev));
    }

    join(req: { user: User }) {
        return this.chat.join(req);
    }

    leave(req: { userId: string }) {
        return this.chat.leave(req);
    }

    async getUsers() {
        return this.chat.getUsers();
    }

}
