export class BadRequest extends Error {}
export class Unauthorized extends Error {}
export class Forbidden extends Error {}
export class NotFound extends Error {}
export class MethodNotAllowed extends Error {}
export class Ratelimited extends Error {}
export type RESTErrors = BadRequest | Unauthorized | Forbidden | NotFound | MethodNotAllowed | Ratelimited