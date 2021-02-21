import { indent } from "./util"

export interface Block {
    toString(): string
}

export class TypeIdentifier implements Block {
    constructor(public readonly id: string) { }
    toString(): string { return `#${this.id}` }
}
export class PolymorphicType implements Block {
    constructor(
        public readonly id: TypeIdentifier,
        public readonly typevars: ReadonlyMap<string, Type>,
    ) { }
    toString(): string {
        return `${this.id}<${Array.from(this.typevars).map(x => `${x[0]}=${x[1]}`).join(",")}>`
    }
}
export type Type = TypeIdentifier | PolymorphicType

export class Num implements Block {
    constructor(public readonly value: string, public readonly isFloat: boolean) { }
    toString(): string {
        if (this.isFloat) {
            return `f${this.value}`
        } else {
            return `i${this.value}`
        }
    }
}
export class Str implements Block {
    constructor(public readonly value: string) { }
    toString(): string { return `"${this.value}"` }
}
export type Primitive = Num | Str

export class Identifier implements Block {
    constructor(public readonly id: string) { }
    toString(): string { return `$${this.id}` }
}
export class Declaration implements Block {
    constructor(
        public readonly arg: Identifier,
        public readonly type: Type,
    ) { }
    toString(): string { return `${this.arg}:${this.type}` }
}
export class Func implements Block {
    constructor(
        public readonly decls: ReadonlyArray<Declaration>,
        public readonly returnType: Type,
        public readonly body: Statement,
    ) { }
    toString(): string {
        return `(${this.decls.join(",")})->${this.returnType}{
${indent(this.body.toString())}
}`
    }
}
export class Create implements Block {
    constructor(
        public readonly type: Type,
        public readonly args: ReadonlyMap<string, Expression>,
    ) { }
    toString(): string { return `(${this.type}(${Array.from(this.args).map(x => `${x[0]}=${x[1]}`).join(",")}))` }
}
export class Call implements Block {
    constructor(
        public readonly func: Identifier,
        public readonly args: ReadonlyMap<string, Expression>,
    ) { }
    toString(): string { return `(${this.func}(${Array.from(this.args).map(x => `${x[0]}=${x[1]}`).join(",")}))` }
}
export type Expression = Primitive | Identifier | Func | Create | Call

export class Assign implements Block {
    constructor(
        public readonly lhs: Identifier,
        public readonly isDefine: boolean,
        public readonly rhs: Expression,
    ) { }
    toString(): string {
        if (this.isDefine) {
            return `${this.lhs}:=${this.rhs}\n`
        } else {
            return `${this.lhs}<-${this.rhs}\n`
        }
    }
}
export class Do implements Block {
    constructor(public readonly expr: Expression) { }
    toString(): string { return `do(${this.expr})\n` }
}
export class Loop implements Block {
    constructor(
        public readonly id: Identifier,
        public readonly iterable: Expression,
        public readonly body: Statement,
    ) { }
    toString(): string {
        return `foreach(${this.id}<-${this.iterable}){
${indent(this.body.toString())}
}
`
    }
}
export class Branch implements Block {
    constructor(
        public readonly cases: ReadonlyArray<Case>,
        public readonly _default: Default | null,
    ) { }
    toString() {
        if (this._default) {
            return `branch{
${this.cases.join("")}${this._default}}
`
        } else {
            return `branch{
${this.cases.join("")}}
`
        }
    }
}
export class Case implements Block {
    constructor(
        public readonly cond: Expression,
        public readonly body: Statement,
    ) { }
    toString() { return `case(${this.cond}):
${indent(this.body.toString())}
` }
}
export class Default implements Block {
    constructor(public readonly body: Statement) { }
    toString() {
        return `default:
${indent(this.body.toString())}
`
    }
}
export class Return implements Block {
    constructor(public readonly value: Expression | null) { }
    toString() {
        if (this.value) {
            return `return(${this.value})\n`
        } else {
            return "return\n"
        }
    }
}
export class Break implements Block {
    toString() { return "break\n" }
}
export class Continue implements Block {
    toString() { return "continue\n" }
}
export class Suite implements Block {
    constructor(public readonly stmts: ReadonlyArray<Statement>) { }
    toString(): string { return `${this.stmts.join("")}` }
}
export type Statement = Assign | Do | Loop | Branch | Return | Break | Continue | Suite

export function createBlockFromJson(value: any): Block | null {
    if (!value) {
        return null
    }
    const t = value["_type"]
    switch (t) {
        case "TypeIdentifier":
            return new TypeIdentifier(value["id"])
        case "PolymorphicType":
            return (() => {
                const typevars = new Map()
                const typevarsJson = value["typevars"]
                for (const key in typevarsJson) {
                    const value = createBlockFromJson(typevarsJson[key])
                    typevars.set(key, value)
                }
                return new PolymorphicType(
                    createBlockFromJson(value["id"]) as TypeIdentifier,
                    typevars,
                )
            })()
        case "Num":
            return new Num(value["value"], value["isFloat"])
        case "Str":
            return new Str(value["value"])
        case "Identifier":
            return new Identifier(value["id"])
        case "Declaration":
            return new Declaration(
                createBlockFromJson(value["arg"]) as Identifier,
                createBlockFromJson(value["type"]) as Type,
            )
        case "Func":
            return new Func(
                value["decls"].map(createBlockFromJson),
                createBlockFromJson(value["returnType"]) as Type,
                createBlockFromJson(value["body"]) as Statement,
            )
        case "Create":
            return (() => {
                const args = new Map()
                const argsJson = value["args"]
                for (const key in argsJson) {
                    const value = createBlockFromJson(argsJson[key])
                    args.set(key, value)
                }
                return new Create(
                    createBlockFromJson(value["type"]) as Type,
                    args,
                )
            })()
        case "Call":
            return (() => {
                const args = new Map()
                const argsJson = value["args"]
                for (const key in argsJson) {
                    const value = createBlockFromJson(argsJson[key])
                    args.set(key, value)
                }
                return new Call(
                    createBlockFromJson(value["func"]) as Identifier,
                    args,
                )
            })()

        case "Assign":
            return new Assign(
                createBlockFromJson(value["lhs"]) as Identifier,
                value["isDefine"],
                createBlockFromJson(value["rhs"]) as Expression,
            )
        case "Do":
            return new Do(createBlockFromJson(value["expr"]) as Expression)
        case "Loop":
            return new Loop(
                createBlockFromJson(value["id"]) as Identifier,
                createBlockFromJson(value["iterable"]) as Expression,
                createBlockFromJson(value["body"]) as Statement,
            )
        case "Branch":
            return new Branch(
                value["cases"].map(createBlockFromJson),
                createBlockFromJson(value["default"]) as (Default | null),
            )
        case "Case":
            return new Case(
                createBlockFromJson(value["cond"]) as Expression,
                createBlockFromJson(value["body"]) as Statement,
            )
        case "Default":
            return new Default(createBlockFromJson(value["body"]) as Statement)
        case "Return":
            return new Return(createBlockFromJson(value["value"]) as Expression)
        case "Break":
            return new Break()
        case "Continue":
            return new Continue()
        case "Suite":
            const stmts = value["stmts"].map(createBlockFromJson)
            return new Suite(stmts)

        default:
            break;
    }
    throw new Error(`Invalid JSON: ${JSON.stringify(value)}`)
}
