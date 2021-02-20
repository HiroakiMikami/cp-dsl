import { Assign, Block, Branch, Break, Call, Case, Continue, Declaration, Default, Do, Func, Identifier, Loop, Num, PolymorphicType, Return, Str, Suite, TypeIdentifier } from "./syntax";
import { indent } from "./util";

export interface TypeInfo {
    typevarNames: ReadonlyArray<string>
}

export class Transpiler {
    constructor(
        private readonly types: ReadonlyMap<string, TypeInfo>
    ) { }

    transpile(block: Block): string {
        if (block instanceof TypeIdentifier) {
            return block.id
        } else if (block instanceof PolymorphicType) {
            if (!this.types.has(block.id.id)) {
                throw `Unknown type: ${block.id.id}`
            }
            const tvars = []
            for (const name of this.types.get(block.id.id).typevarNames) {
                if (!block.typevars.has(name)) {
                    throw `Typevar ${name} is not specified in ${block}`
                }
                tvars.push(this.transpile(block.typevars.get(name)))
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
        } else if (block instanceof Call) {
            return `(${this.transpile(block.func)}(${block.args.map(x => this.transpile(x)).join(", ")}))`
        } else if (block instanceof Assign) {
            if (block.isDefine) {
                // Handle recursive function
                if (block.rhs instanceof Func) {
                    const func = block.rhs
                    const f = this.transpile(block.lhs)
                    const decls = func.decls.map(x => this.transpile(x))
                    const args = func.decls.map(decl => decl.arg).map(x => this.transpile(x))
                    const _f = `_${f}`
                    const retType = this.transpile(func.returnType)
                    const declsWithArg = Array.from(decls)
                    declsWithArg.push(`auto ${_f}`)
                    return `auto ${_f} = [&](${declsWithArg.join(", ")}) -> ${retType} {
  auto ${f} = [&](${decls.join(", ")}) -> ${retType} {
    return ${_f}(${args.join(", ")}, ${_f});
  };
  ${this.transpile(func.body)}};
auto ${f} = [&](${decls.join(", ")}) -> ${retType} {
  return ${_f}(${args.join(", ")}, ${_f});
};
`
                } else {
                    return `auto ${this.transpile(block.lhs)} = ${this.transpile(block.rhs)};\n`
                }
            } else {
                return `${this.transpile(block.lhs)} = ${this.transpile(block.rhs)};\n`
            }
        } else if (block instanceof Do) {
            return `${this.transpile(block.expr)};\n`
        } else if (block instanceof Loop) {
            return `foreach(${this.transpile(block.iterable)}, [&](auto &${this.transpile(block.id)}) -> void {
${indent(this.transpile(block.body))}
});
`
        } else if (block instanceof Branch) {
            if (block._default) {
                return `if (false) {}
${block.cases.map(x => this.transpile(x)).join("")}${this.transpile(block._default)}`
            } else {
                return `if (false) {}
${block.cases.map(x => this.transpile(x)).join("")}`
            }
        } else if (block instanceof Case) {
            return `else if (${this.transpile(block.cond)}) {
${indent(this.transpile(block.body))}
}
`
        } else if (block instanceof Default) {
            return `else {
${indent(this.transpile(block.body))}
}
`
        } else if (block instanceof Return) {
            if (block.value) {
                return `return ${this.transpile(block.value)};\n`
            } else {
                return "return;\n"
            }
        } else if (block instanceof Break) {
            return "break;\n"
        } else if (block instanceof Continue) {
            return "continue;\n"
        } else if (block instanceof Suite) {
            return block.stmts.map(x => this.transpile(x)).join("")
        }
        throw new Error(`Invalid block: ${block}`)
    }
}