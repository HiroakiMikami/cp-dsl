export interface LibInfo {
    typevarNames: ReadonlyMap<string, ReadonlyArray<string>>
    createArgNames: ReadonlyMap<string, ReadonlyArray<string>>
    argNames: ReadonlyMap<string, ReadonlyArray<string>>
    includes: ReadonlySet<string>
    lib: string
}

export function createJsonFromLibInfo(info: LibInfo): any {
    let out: any = {}
    out["typevarNames"] = {}
    info.typevarNames.forEach((value, key) => {
        out["typevarNames"][key] = value
    })
    out["createArgNames"] = {}
    info.createArgNames.forEach((value, key) => {
        out["createArgNames"][key] = value
    })
    out["argNames"] = {}
    info.argNames.forEach((value, key) => {
        out["argNames"][key] = value
    })
    out["includes"] = []
    info.includes.forEach(file => {
        out["includes"].push(file)
    })
    out["lib"] = info.lib
    return out
}

export function createLibInfoFromJson(value: any): LibInfo {
    const out = {
        "typevarNames": new Map<string, ReadonlyArray<string>>(),
        "createArgNames": new Map<string, ReadonlyArray<string>>(),
        "argNames": new Map<string, ReadonlyArray<string>>(),
        "includes": new Set<string>(),
        "lib": "",
    }

    function check(name: string) {
        if (value[name] === null || value[name] === undefined) {
            throw `No ${name} argument`
        }
    }

    check("typevarNames")
    check("createArgNames")
    check("argNames")
    check("includes")
    check("lib")
    for (const key in value["typevarNames"]) {
        out.typevarNames.set(key, value["typevarNames"][key])
    }
    for (const key in value["createArgNames"]) {
        out.createArgNames.set(key, value["createArgNames"][key])
    }
    for (const key in value["argNames"]) {
        out.argNames.set(key, value["argNames"][key])
    }
    for (const file of value["includes"]) {
        out.includes.add(file)
    }
    out.lib = value["lib"]

    return out
}
