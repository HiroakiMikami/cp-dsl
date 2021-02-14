export function indent(lines: string): string {
    if (lines.endsWith("\n")) {
        lines = lines.substr(0, lines.length - 1)
    }
    return lines.split("\n").map(line => `  ${line}`).join("\n")
}
