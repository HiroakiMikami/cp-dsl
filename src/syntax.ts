function indent(x: Block): string {
    let lines = x.toString()
    if (lines.endsWith("\n")) {
        lines = lines.substr(0, lines.length - 1)
    }
    return lines.split("\n").map(line => `  ${line}`).join("\n")
}


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
        public readonly typevars: ReadonlyArray<Type>,
    ) { }
    toString(): string { return `${this.id}<${this.typevars.join(",")}>` }
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
        return `(${this.decls.join(",")})->${this.returnType}{\n${indent(this.body)}\n}`
    }
}
export class BinOp implements Block {
    constructor(
        public readonly lhs: Expression,
        public readonly op: Identifier,
        public readonly rhs: Expression,
    ) { }
    toString(): string { return `(${this.lhs}${this.op}${this.rhs})` }
}
export class Call implements Block {
    constructor(
        public readonly func: Identifier,
        public readonly args: ReadonlyArray<Expression>,
    ) { }
    toString(): string { return `(${this.func}(${this.args.join(",")}))` }
}
export type Expression = Primitive | Identifier | Func | BinOp | Call

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
        return `foreach(${this.id}<-${this.iterable}){\n${indent(this.body)}\n}\n`
    }
}
export class Branch implements Block {
    constructor(
        public readonly cases: ReadonlyArray<Case>,
        public readonly _default: Default | null,
    ) { }
    toString() {
        if (this._default) {
            return `branch{\n${this.cases.join("")}${this._default}}\n`
        } else {
            return `branch{\n${this.cases.join("")}}\n`
        }
    }
}
export class Case implements Block {
    constructor(
        public readonly cond: Expression,
        public readonly body: Statement,
    ) { }
    toString() { return `case(${this.cond}):\n${indent(this.body)}\n` }
}
export class Default implements Block {
    constructor(public readonly body: Statement) { }
    toString() { return `default:\n${indent(this.body)}\n` }
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
