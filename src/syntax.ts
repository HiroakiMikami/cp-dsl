import { indent } from "./util"

export interface Block {
    toString(): string
}

export class TypeIdentifier implements Block {
    constructor(public readonly id: string) { }
    toString(): string { return `#${this.id}` }
}
export class TypeArgument implements Block {
    constructor(public readonly name: string, public readonly type: Type) {}
    toString(): string {
        return `${this.name}=${this.type}`
    }
}
export class PolymorphicType implements Block {
    constructor(
        public readonly id: TypeIdentifier,
        public readonly typevars: ReadonlyArray<TypeArgument>,
    ) { }
    toString(): string {
        return `${this.id}<${this.typevars.join(",")}>`
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
export class Argument implements Block {
    constructor(
        public readonly name: Identifier,
        public readonly value: Expression,
    ) {}
    toString(): string {
        return `${this.name}=${this.value}`
    }
}
export class Create implements Block {
    constructor(
        public readonly type: Type,
        public readonly args: ReadonlyArray<Argument>,
    ) { }
    toString(): string { return `(${this.type}(${this.args.join(",")}))` }
}
export class Call implements Block {
    constructor(
        public readonly func: Identifier,
        public readonly args: ReadonlyArray<Argument>,
    ) { }
    toString(): string { return `(${this.func}(${this.args.join(",")}))` }
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
    toString() {
        return `case(${this.cond}):
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
        case "TypeArgument":
            return new TypeArgument(
                value["name"],
                createBlockFromJson(value["type"]) as Type,
            )
        case "PolymorphicType":
            return new PolymorphicType(
                createBlockFromJson(value["id"]) as TypeIdentifier,
                value["typevars"].map(createBlockFromJson),
            )
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
        case "Argument":
            return new Argument(
                createBlockFromJson(value["name"]) as Identifier,
                createBlockFromJson(value["value"]) as Expression,
            )
        case "Create":
            return new Create(
                createBlockFromJson(value["type"]) as Type,
                value["args"].map(createBlockFromJson),
            )
        case "Call":
            return new Call(
                createBlockFromJson(value["func"]) as Identifier,
                value["args"].map(createBlockFromJson),
            )

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

export function createJsonFromBlock(block: Block | null): any | null {
    if (!block) {
        return null
    }

    if (block instanceof TypeIdentifier) {
        return {
            "_type": "TypeIdentifier",
            "id": block.id,
        }
    } else if (block instanceof TypeArgument) {
        return {
            "_type": "TypeArgument",
            "name": block.name,
            "type": createJsonFromBlock(block.type),
        }
    } else if (block instanceof PolymorphicType) {
        return {
            "_type": "PolymorphicType",
            "id": createJsonFromBlock(block.id),
            "typevars": block.typevars.map(createJsonFromBlock),
        }
    } else if (block instanceof Num) {
        return {
            "_type": "Num",
            "value": block.value,
            "isFloat": block.isFloat,
        }
    } else if (block instanceof Str) {
        return {
            "_type": "Str",
            "value": block.value,
        }
    } else if (block instanceof Identifier) {
        return {
            "_type": "Identifier",
            "id": block.id,
        }
    } else if (block instanceof Declaration) {
        return {
            "_type": "Declaration",
            "arg": createJsonFromBlock(block.arg),
            "type": createJsonFromBlock(block.type),
        }
    } else if (block instanceof Func) {
        return {
            "_type": "Func",
            "decls": block.decls.map(createJsonFromBlock),
            "returnType": createJsonFromBlock(block.returnType),
            "body": createJsonFromBlock(block.body),
        }
    } else if (block instanceof Argument) {
        return {
            "_type": "Argument",
            "name": createJsonFromBlock(block.name),
            "value": createJsonFromBlock(block.value),
        }
    } else if (block instanceof Create) {
        return {
            "_type": "Create",
            "type": createJsonFromBlock(block.type),
            "args": block.args.map(createJsonFromBlock),
        }
    } else if (block instanceof Call) {
        return {
            "_type": "Call",
            "func": createJsonFromBlock(block.func),
            "args": block.args.map(createJsonFromBlock),
        }
    } else if (block instanceof Assign) {
        return {
            "_type": "Assign",
            "lhs": createJsonFromBlock(block.lhs),
            "isDefine": block.isDefine,
            "rhs": createJsonFromBlock(block.rhs),
        }
    } else if (block instanceof Do) {
        return{
            "_type": "Do",
            "expr": createJsonFromBlock(block.expr)
        }
    } else if (block instanceof Loop) {
        return {
            "_type": "Loop",
            "id": createJsonFromBlock(block.id),
            "iterable": createJsonFromBlock(block.iterable),
            "body": createJsonFromBlock(block.body),
        }
    } else if (block instanceof Case) {
        return {
            "_type": "Case",
            "cond": createJsonFromBlock(block.cond),
            "body": createJsonFromBlock(block.body),
        }
    } else if (block instanceof Default) {
        return {
            "_type": "Default",
            "body": createJsonFromBlock(block.body),
        }
    } else if (block instanceof Branch) {
        return {
            "_type": "Branch",
            "cases": block.cases.map(createJsonFromBlock),
            "default": createJsonFromBlock(block._default),
        }
    } else if (block instanceof Return) {
        return {
            "_type": "Return",
            "value": createJsonFromBlock(block.value)
        }
    } else if (block instanceof Break) {
        return { "_type": "Break" }
    } else if (block instanceof Continue) {
        return { "_type": "Continue" }
    } else if (block instanceof Suite) {
        return {
            "_type": "Suite",
            "stmts": block.stmts.map(createJsonFromBlock),
        }
    }
    throw new Error(`Invalid block: ${block}`)
}
