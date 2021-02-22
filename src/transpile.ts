import { LibInfo } from "./libinfo";
import { Assign, Block, Branch, Break, Call, Case, Continue, Create, Declaration, Default, Do, Func, Identifier, Loop, Num, PolymorphicType, Return, Str, Suite, TypeIdentifier } from "./syntax";
import { indent } from "./util";

export class Transpiler {
    constructor(
        private readonly info: LibInfo
    ) { }

    bundle(block: Block): string {
        const main = "int main() {\n" + indent(this.transpile(block)) + "\n}\n"
        const includes = Array.from(this.info.includes).map(x => `#include <${x}>`).join("\n")

        return includes + "\n" + this.info.lib + "\n" + main
    }

    transpile(block: Block): string {
        let info = {
            typevarNames: new Map(Array.from(this.info.typevarNames)),
            createArgNames: new Map(Array.from(this.info.createArgNames)),
            argNames: new Map(Array.from(this.info.argNames))
        }
        const _transpile = (block: Block): string => {
            if (block instanceof TypeIdentifier) {
                return block.id
            } else if (block instanceof PolymorphicType) {
                if (!info.typevarNames.has(block.id.id)) {
                    throw `Unknown type: ${block.id.id}`
                }
                const tvarMaps = new Map()
                for (const arg of block.typevars) {
                    tvarMaps.set(arg.name, arg.type)
                }
                const tvars = []
                for (const name of info.typevarNames.get(block.id.id)) {
                    if (!tvarMaps.has(name)) {
                        throw `Typevar ${name} is not specified in ${block}`
                    }
                    tvars.push(this.transpile(tvarMaps.get(name)))
                }
                return `${this.transpile(block.id)}<${tvars.join(", ")}>`
            } else if (block instanceof Num) {
                if (block.isFloat) {
                    return `Float(${block.value})`
                } else {
                    return `Integer(${block.value}L)`
                }
            } else if (block instanceof Str) {
                return `String(${JSON.stringify(block.value)})`
            } else if (block instanceof Identifier) {
                return block.id
            } else if (block instanceof Declaration) {
                return `${this.transpile(block.type)} &${this.transpile(block.arg)}`
            } else if (block instanceof Func) {
                return `[&](${block.decls.map(x => this.transpile(x)).join(", ")}) -> ${this.transpile(block.returnType)} {
${indent(this.transpile(block.body))}
}`
            } else if (block instanceof Create) {
                let type = ""
                if (block.type instanceof TypeIdentifier) {
                    type = block.type.id
                } else if (block.type instanceof PolymorphicType) {
                    type = block.type.id.id
                } else {
                    throw `Unknown type: ${block.type}`
                }
                if (!info.createArgNames.has(type)) {
                    throw `Unknown type: ${type}`
                }
                const argMap = new Map()
                for (const arg of block.args) {
                    argMap.set(arg.name.id, arg.value)
                }
                const args = []
                for (const name of info.createArgNames.get(type)) {
                    if (!argMap.has(name)) {
                        throw `Argument ${name} is not specified in ${block}`
                    }
                    args.push(this.transpile(argMap.get(name)))
                }
                return `(${this.transpile(block.type)}{${args.join(", ")}})`
            } else if (block instanceof Call) {
                if (!info.argNames.has(block.func.id)) {
                    throw `Unknown function: ${block.func.id}`
                }
                const argMap = new Map()
                for (const arg of block.args) {
                    argMap.set(arg.name.id, arg.value)
                }
                const args = []
                for (const name of info.argNames.get(block.func.id)) {
                    if (!argMap.has(name)) {
                        throw `Argument ${name} is not specified in ${block}`
                    }
                    args.push(_transpile(argMap.get(name)))
                }
                return `(${_transpile(block.func)}(${args.join(", ")}))`
            } else if (block instanceof Assign) {
                if (block.isDefine) {
                    
                    if (block.rhs instanceof Func) {
                        const func = block.rhs

                        // Add definition
                        info.argNames.set(
                            block.lhs.id,
                            func.decls.map(x => x.arg.id),
                        )

                        // Handle recursive function
                        const f = _transpile(block.lhs)
                        const decls = func.decls.map(x => _transpile(x))
                        const args = func.decls.map(decl => decl.arg).map(x => _transpile(x))
                        const _f = `_${f}`
                        const retType = _transpile(func.returnType)
                        const declsWithArg = Array.from(decls)
                        declsWithArg.push(`auto ${_f}`)
                        return `auto ${_f} = [&](${declsWithArg.join(", ")}) -> ${retType} {
  auto ${f} = [&](${decls.join(", ")}) -> ${retType} {
    return ${_f}(${args.join(", ")}, ${_f});
  };
  ${_transpile(func.body)}};
auto ${f} = [&](${decls.join(", ")}) -> ${retType} {
  return ${_f}(${args.join(", ")}, ${_f});
};
`
                    } else {
                        return `auto ${_transpile(block.lhs)} = ${_transpile(block.rhs)};\n`
                    }
                } else {
                    return `${_transpile(block.lhs)} = ${_transpile(block.rhs)};\n`
                }
            } else if (block instanceof Do) {
                return `${_transpile(block.expr)};\n`
            } else if (block instanceof Loop) {
                return `foreach(${_transpile(block.iterable)}, [&](auto &${_transpile(block.id)}) -> void {
${indent(_transpile(block.body))}
});
`
            } else if (block instanceof Branch) {
                if (block._default) {
                    return `if (false) {}
${block.cases.map(x => _transpile(x)).join("")}${_transpile(block._default)}`
                } else {
                    return `if (false) {}
${block.cases.map(x => _transpile(x)).join("")}`
                }
            } else if (block instanceof Case) {
                return `else if (${_transpile(block.cond)}) {
${indent(_transpile(block.body))}
}
`
            } else if (block instanceof Default) {
                return `else {
${indent(_transpile(block.body))}
}
`
            } else if (block instanceof Return) {
                if (block.value) {
                    return `return ${_transpile(block.value)};\n`
                } else {
                    return "return;\n"
                }
            } else if (block instanceof Break) {
                return "break;\n"
            } else if (block instanceof Continue) {
                return "continue;\n"
            } else if (block instanceof Suite) {
                return block.stmts.map(x => _transpile(x)).join("")
            }
            throw new Error(`Invalid block: ${block}`)
        }
        return _transpile(block)
    }
}