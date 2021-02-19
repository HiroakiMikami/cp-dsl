import { Block, TypeIdentifier, PolymorphicType, Num, Str, Identifier, Declaration, Type, Func, Statement, Expression, Call, Assign, Do, Loop, Branch, Default, Case, Return, Break, Continue, Suite } from "./syntax"

export function fromJson(value: any): Block | null {
    if (!value) {
        return null
    }
    const t = value["_type"]
    switch (t) {
        case "TypeIdentifier":
            return new TypeIdentifier(value["id"])
        case "PolymorphicType":
            return new PolymorphicType(
                fromJson(value["id"]) as TypeIdentifier,
                value["typevars"].map(fromJson),
            )

            case "Num":
            return new Num(value["value"], value["isFloat"])
        case "Str":
            return new Str(value["value"])
        case "Identifier":
            return new Identifier(value["id"])
        case "Declaration":
            return new Declaration(
                fromJson(value["arg"]) as Identifier,
                fromJson(value["type"]) as Type,
            )
        case "Func":
            return new Func(
                value["decls"].map(fromJson),
                fromJson(value["returnType"]) as Type,
                fromJson(value["body"]) as Statement,
            )
        case "Call":
            return new Call(
                fromJson(value["func"]) as Identifier,
                value["args"].map(fromJson),
            )

        case "Assign":
            return new Assign(
                fromJson(value["lhs"]) as Identifier,
                value["isDefine"],
                fromJson(value["rhs"]) as Expression,
            )
        case "Do":
            return new Do(fromJson(value["expr"]) as Expression)
        case "Loop":
            return new Loop(
                fromJson(value["id"]) as Identifier,
                fromJson(value["iterable"]) as Expression,
                fromJson(value["body"]) as Statement,
            )
        case "Branch":
            return new Branch(
                value["cases"].map(fromJson),
                fromJson(value["default"]) as (Default | null),
            )
        case "Case":
            return new Case(
                fromJson(value["cond"]) as Expression,
                fromJson(value["body"]) as Statement,
            )
        case "Default":
            return new Default(fromJson(value["body"]) as Statement)
        case "Return":
            return new Return(fromJson(value["value"]) as Expression)
        case "Break":
            return new Break()
        case "Continue":
            return new Continue()
        case "Suite":
            const stmts = value["stmts"].map(fromJson)
            return new Suite(stmts)
    
        default:
            break;
    }
    throw new Error(`Invalid JSON: ${JSON.stringify(value)}`)
}
