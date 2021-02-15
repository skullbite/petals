import * as f from "file-type"
import * as fs from "fs"

class PetalsFile {
    baseString: string
    name: string
    buffer: Buffer
    constructor(path: string | Buffer, filename: string) {
        this.name = filename
        if (Buffer.isBuffer(path)) {
            this.buffer = path
            this.baseString = path.toString("base64")
        }
        else {
            this.baseString = fs.readFileSync(path, { encoding: "base64" })
            this.buffer = Buffer.from(this.baseString, "base64")
        }
    }
    async mime() {
        const b = await f.fromBuffer(this.buffer)
        return b.mime
    }
    async stringify() {
        const b = await f.fromBuffer(this.buffer)
        return `data:${b.mime}base64,${this.baseString}`
    }
    get toJSON() {
        return { attachment: this.baseString, name: this.name }
    }
}

export default PetalsFile