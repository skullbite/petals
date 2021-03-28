import Base from "./base"

export class Webhook extends Base {
    constructor(data, bot) {
        super(data.id, bot)
    }
}

export class WebhookFromToken {
    constructor(id) {}
}