import * as chai from 'chai'
const should = chai.should()

import * as $ from "../src/syntax"
import { fromJson } from "../src/json"

describe("fromJson", () => {
    it("null", () => {
        should.not.exist(fromJson(null))
    })
    it("TypeIdentifier", () => {
        fromJson({ "_type": "TypeIdentifier", "id": "x" }).should.deep.equal(new $.TypeIdentifier("x"))
    })
    it("PolymorphicType", () => {
        fromJson({
            "_type": "PolymorphicType",
            "id": { "_type": "TypeIdentifier", "id": "x" },
            "typevars": [{ "_type": "TypeIdentifier", "id": "y" }]
        }).should.deep.equal(new $.PolymorphicType(
            new $.TypeIdentifier("x"),
            [new $.TypeIdentifier("y")],
        ))
    })
    it("TupleType", () => {
        fromJson({
            "_type": "TupleType",
            "types": [{ "_type": "TypeIdentifier", "id": "y" }]
        }).should.deep.equal(new $.TupleType([new $.TypeIdentifier("y")]))
    })

    it("Num", () => {
        fromJson({ "_type": "Num", "value": "10" }).should.deep.equal(new $.Num("10"))
    })
    it("Str", () => {
        fromJson({ "_type": "Str", "value": "10" }).should.deep.equal(new $.Str("10"))
    })
    it("Identifier", () => {
        fromJson({ "_type": "Identifier", "id": "x" }).should.deep.equal(new $.Identifier("x"))
    })
    it("Tuple", () => {
        fromJson({
            "_type": "Tuple",
            "elems": [{ "_type": "Identifier", "id": "y" }]
        }).should.deep.equal(new $.Tuple([new $.Identifier("y")]))
    })
    describe("Func", () => {
        it("Declaration", () => {
            fromJson({
                "_type": "Declaration",
                "arg": { "_type": "Identifier", "id": "x" },
                "type": { "_type": "TypeIdentifier", "id": "y" },
            }).should.deep.equal(
                new $.Declaration(
                    new $.Identifier("x"), new $.TypeIdentifier("y")
                )
            )
        })
        it("Func", () => {
            fromJson({
                "_type": "Func",
                "decls": [
                    {
                        "_type": "Declaration",
                        "arg": { "_type": "Identifier", "id": "x" },
                        "type": { "_type": "TypeIdentifier", "id": "y" },
                    }
                ],
                "returnType": { "_type": "TypeIdentifier", "id": "y" },
                "body": {
                    "_type": "Do",
                    "expr": { "_type": "Identifier", "id": "z" },
                }
            }).should.deep.equal(
                new $.Func(
                    [
                        new $.Declaration(
                            new $.Identifier("x"),
                            new $.TypeIdentifier("y")
                        )
                    ],
                    new $.TypeIdentifier("y"),
                    new $.Do(new $.Identifier("z")),
                )
            )
        })
    })
    it("BinOp", () => {
        fromJson({
            "_type": "BinOp",
            "lhs": { "_type": "Identifier", "id": "x" },
            "op": { "_type": "Identifier", "id": "+" },
            "rhs": { "_type": "Identifier", "id": "y" },
        }).should.deep.equal(
            new $.BinOp(
                new $.Identifier("x"),
                new $.Identifier("+"),
                new $.Identifier("y"),
            )
        )
    })
    it("Call", () => {
        fromJson({
            "_type": "Call",
            "func": { "_type": "Identifier", "id": "f" },
            "arg": { "_type": "Identifier", "id": "x" },
        }).should.deep.equal(
            new $.Call(
                new $.Identifier("f"), new $.Identifier("x")
            )
        )
    })

    it("Assign", () => {
        fromJson({
            "_type": "Assign",
            "lhs": { "_type": "Identifier", "id": "x" },
            "isDefine": true,
            "rhs": { "_type": "Identifier", "id": "y" },
        }).should.deep.equal(
            new $.Assign(
                new $.Identifier("x"), true, new $.Identifier("y")
            )
        )
    })
    it("Do", () => {
        fromJson({
            "_type": "Do",
            "expr": { "_type": "Identifier", "id": "x" },
        }).should.deep.equal(
            new $.Do(new $.Identifier("x"))
        )
    })
    it("Loop", () => {
        fromJson({
            "_type": "Loop",
            "id": { "_type": "Identifier", "id": "x" },
            "iterable": { "_type": "Identifier", "id": "xs" },
            "body": {
                "_type": "Do",
                "expr": { "_type": "Identifier", "id": "z" },
            }
        }).should.deep.equal(
            new $.Loop(
                new $.Identifier("x"), new $.Identifier("xs"),
                new $.Do(new $.Identifier("z")),
            )
        )
    })
    describe("Branch", () => {
        it("Case", () => {
            fromJson({
                "_type": "Case",
                "cond": { "_type": "Identifier", "id": "c" },
                "body": {
                    "_type": "Do",
                    "expr": { "_type": "Identifier", "id": "x" },
                }
            }).should.deep.equal(
                new $.Case(
                    new $.Identifier("c"), new $.Do(new $.Identifier("x"))
                )
            )
        })
        it("Default", () => {
            fromJson({
                "_type": "Default",
                "body": {
                    "_type": "Do",
                    "expr": { "_type": "Identifier", "id": "x" },
                }
            }).should.deep.equal(
                new $.Default(
                    new $.Do(new $.Identifier("x"))
                )
            )
        })
        it("Branch", () => {
            const _case = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            fromJson({
                "_type": "Branch",
                "cases": [
                    {
                        "_type": "Case",
                        "cond": { "_type": "Identifier", "id": "cond0" },
                        "body": {
                            "_type": "Do",
                            "expr": { "_type": "Identifier", "id": "x" },
                        }
                    }
                ],
                "default": null,
            }).should.deep.equal(
                new $.Branch([_case], null)
            )
        })
        it("BranchWithDefault", () => {
            const _case = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            const _default = new $.Default(new $.Do(new $.Identifier("z")))

            fromJson({
                "_type": "Branch",
                "cases": [
                    {
                        "_type": "Case",
                        "cond": { "_type": "Identifier", "id": "cond0" },
                        "body": {
                            "_type": "Do",
                            "expr": { "_type": "Identifier", "id": "x" },
                        }
                    }
                ],
                "default": {
                    "_type": "Default",
                    "body": {
                        "_type": "Do",
                        "expr": { "_type": "Identifier", "id": "z" },
                    }
                },
            }).should.deep.equal(new $.Branch([_case], _default))
        })
    })
    describe("Return", () => {
        it("WithValue", () => {
            fromJson({
                "_type": "Return",
                "value": { "_type": "Identifier", "id": "x" },
            }).should.deep.equal(new $.Return(new $.Identifier("x")))
        })
        it("WithoutValue", () => {
            fromJson({
                "_type": "Return",
                "value": null,
            }).should.deep.equal(new $.Return(null))
        })
    })
    it("Break", () => {
        fromJson({ "_type": "Break" }).should.deep.equal(new $.Break())
    })
    it("Continue", () => {
        fromJson({ "_type": "Continue" }).should.deep.equal(new $.Continue())
    })
    it("Suite", () => {
        fromJson({
            "_type": "Suite",
            "stmts": [{ "_type": "Break" }],
        }).should.deep.equal(new $.Suite([new $.Break]))
    })
})
