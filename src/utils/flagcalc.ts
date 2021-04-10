export default class FlagHandler {
    flags: { [x: string]: number }
    value: number
    constructor(value: number, flags: { [x: string]: number }) {
        this.value = value
        this.flags = flags
    }
    get parseAsJSON() {
        const flags = {}
        Object.keys(this.flags).map(d => {
            flags[d] = (this.flags[d] & this.value) === this.flags[d] ? true : false
        })
        return flags
    }
    get parseAsArray() {
        return Object.keys(this.flags).filter(d => (this.flags[d] & this.value) === this.flags[d])
    }
}