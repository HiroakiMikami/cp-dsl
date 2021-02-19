import { Assign, Block, Branch, Break, Call, Case, Continue, Declaration, Default, Do, Func, Identifier, Loop, Num, PolymorphicType, Return, Str, Suite, TypeIdentifier } from "./syntax";
import { indent } from "./util";

export function transpile(block: Block): string {
    if (block instanceof TypeIdentifier) {
        return block.id
    } else if (block instanceof PolymorphicType) {
        return `${transpile(block.id)}<${block.typevars.map(transpile).join(", ")}>`
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
        return `${transpile(block.type)} &${transpile(block.arg)}`
    } else if (block instanceof Func) {
        return `[&](${block.decls.map(transpile).join(", ")}) -> ${transpile(block.returnType)} {
${indent(transpile(block.body))}
}`
    } else if (block instanceof Call) {
        return `(${transpile(block.func)}(${block.args.map(transpile).join(", ")}))`
    } else if (block instanceof Assign) {
        if (block.isDefine) {
            // Handle recursive function
            if (block.rhs instanceof Func) {
                const func = block.rhs
                const f = transpile(block.lhs)
                const decls = func.decls.map(transpile)
                const args = func.decls.map(decl => decl.arg).map(transpile)
                const _f = `_${f}`
                const retType = transpile(func.returnType)
                const declsWithArg = Array.from(decls)
                declsWithArg.push(`auto ${_f}`)
                return `auto ${_f} = [&](${declsWithArg.join(", ")}) -> ${retType} {
  auto ${f} = [&](${decls.join(", ")}) -> ${retType} {
    return ${_f}(${args.join(", ")}, ${_f});
  };
  ${transpile(func.body)}};
auto ${f} = [&](${decls.join(", ")}) -> ${retType} {
  return ${_f}(${args.join(", ")}, ${_f});
};
`
            } else {
                return `auto ${transpile(block.lhs)} = ${transpile(block.rhs)};\n`
            }
        } else {
            return `${transpile(block.lhs)} = ${transpile(block.rhs)};\n`
        }
    } else if (block instanceof Do) {
        return `${transpile(block.expr)};\n`
    } else if (block instanceof Loop) {
        return `foreach(${transpile(block.iterable)}, [&](auto &${transpile(block.id)}) -> void {
${indent(transpile(block.body))}
});
`
    } else if (block instanceof Branch) {
        if (block._default) {
            return `if (false) {}
${block.cases.map(transpile).join("")}${transpile(block._default)}`
        } else {
            return `if (false) {}
${block.cases.map(transpile).join("")}`
        }
    } else if (block instanceof Case) {
        return `else if (${transpile(block.cond)}) {
${indent(transpile(block.body))}
}
`
    } else if (block instanceof Default) {
        return `else {
${indent(transpile(block.body))}
}
`
    } else if (block instanceof Return) {
        if (block.value) {
            return `return ${transpile(block.value)};\n`
        } else {
            return "return;\n"
        }
    } else if (block instanceof Break) {
        return "break;\n"
    } else if (block instanceof Continue) {
        return "continue;\n"
    } else if (block instanceof Suite) {
        return block.stmts.map(transpile).join("")
    }
    throw new Error(`Invalid block: ${block}`)
}
