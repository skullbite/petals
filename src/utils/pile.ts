export default class Pile<K, V> extends Map<K, V> {
    constructor() {
        super()
    }
    getRandom(): V | undefined { 
        return this.size ? Array.from(this.values())[Math.floor(Math.random()*this.size)] : undefined 
    }
    getAll() { return Array.from(this.values()) }
    
    atLeastOne(search: (value: V) => boolean): boolean {
        for (const item of this.values()) {
            if (search(item)) return true
        }
        return false
    }
    getFirst(search: (value: V) => boolean): V {
        for (const item of this.values()) {
            if (search(item)) return item
        }
    }
    filter(search: (value: V) => boolean): V[] {
        const results = Array.from(this.values()).map((item: V) => {
            if (search(item)) return item
        })
        return results
    }
}