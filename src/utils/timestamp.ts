const timeFormats = {
    "time.short": "t",
    "time.long": "T",
    "date.short": "d",
    "date.long": "D",
    "unison.short": "f",
    "unison.long": "F",
    "relative": "R"
}
export function generateUnixTimestamp(date: number | Date, format?: keyof typeof timeFormats ) {
    return `<t:${date instanceof Date ? date.getTime() : date}:${format ? timeFormats[format] : "f"}>`
}