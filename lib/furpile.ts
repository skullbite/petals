class Pile<K, V> extends Map<K, V> {
    constructor() {
        super()
    }
    getRandom(): V | undefined { return this.size ? this[Math.floor(Math.random()*this.size)] : undefined }
    getAll() { return Array.from(this.values()) }
    find(search: (value: V) => boolean): V[] {
        const results = Array.from(this.values()).map((item: V) => {
            const res = search(item)
            if (res) return item
        })
        return results
    }
}

export default Pile