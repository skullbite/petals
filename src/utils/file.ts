import * as f from "file-type"
export default class PetalsFile {
    baseString: string
    name: string
    buffer: Buffer
    constructor(path: Buffer, filename?: string) {
        this.name = filename
        this.buffer = path
        this.baseString = path.toString("base64")
    }
    async mime() {
        const b = await f.fromBuffer(this.buffer)
        return b.mime
    }
    async stringify() {
        const b = await f.fromBuffer(this.buffer)
        return `data:${b.mime};base64,${this.baseString}`
    }
}