import * as chai from 'chai'
const should = chai.should()

import * as $ from "../src/syntax"
import {createBlockFromJson} from "../src/index"

describe("toString", () => {
    it("TypeIdentifier", () => {
        new $.TypeIdentifier("int").toString().should.equal("#int")
    })
    it("PolymorphicType", () => {
        new $.PolymorphicType(
            new $.TypeIdentifier("map"),
            new Map([
                ["V", new $.TypeIdentifier("int")],
                ["K", new $.TypeIdentifier("string")]
            ]),
        ).toString().should.deep.equal("#map<V=#int,K=#string>")
    })

    describe("Num", () => {
        it("int", () => {
            new $.Num("10", false).toString().should.deep.equal("i10")
        })
        it("float", () => {
            new $.Num("10", true).toString().should.deep.equal("f10")
        })
    })
    it("Str", () => {
        new $.Str("10").toString().should.deep.equal("\"10\"")
    })
    it("Identifier", () => {
        new $.Identifier("x").toString().should.deep.equal("$x")
    })
    describe("Func", () => {
        it("Declaration", () => {
            new $.Declaration(
                new $.Identifier("x"), new $.TypeIdentifier("y")
            ).toString().should.deep.equal("$x:#y")
        })
        it("Func", () => {
            new $.Func(
                [
                    new $.Declaration(
                        new $.Identifier("x"),
                        new $.TypeIdentifier("y"),
                    ),
                    new $.Declaration(
                        new $.Identifier("z"),
                        new $.TypeIdentifier("w"),
                    ),
                ],
                new $.TypeIdentifier("r"),
                new $.Do(new $.Identifier("p"))
            ).toString().should.deep.equal(
                "($x:#y,$z:#w)->#r{\n  do($p)\n}"
            )
        })
    })
    it("Create", () => {
        new $.Create(
            new $.TypeIdentifier("V"),
            new Map([
                ["a0", new $.Identifier("x")],
                ["a1", new $.Identifier("y")],
            ]),
        ).toString().should.deep.equal("(#V(a0=$x,a1=$y))")
    })
    it("Call", () => {
        new $.Call(
            new $.Identifier("f"),
            new Map([
                ["a0", new $.Identifier("x")],
                ["a1", new $.Identifier("y")],
            ]),
        ).toString().should.deep.equal("($f(a0=$x,a1=$y))")
    })

    describe("Assign", () => {
        it("define", () => {
            new $.Assign(
                new $.Identifier("x"), true, new $.Identifier("y")
            ).toString().should.deep.equal("$x:=$y\n")
        })
        it("assign", () => {
            new $.Assign(
                new $.Identifier("x"), false, new $.Identifier("y")
            ).toString().should.deep.equal("$x<-$y\n")
        })
    })
    it("Do", () => {
        new $.Do(new $.Identifier("x")).toString().should.deep.equal("do($x)\n")
    })
    it("Loop", () => {
        new $.Loop(
            new $.Identifier("x"), new $.Identifier("xs"),
            new $.Do(new $.Identifier("z")),
        ).toString().should.deep.equal("foreach($x<-$xs){\n  do($z)\n}\n")
    })
    describe("Branch", () => {
        it("Case", () => {
            new $.Case(
                new $.Identifier("cond"), new $.Do(new $.Identifier("x"))
            ).toString().should.deep.equal("case($cond):\n  do($x)\n")
        })
        it("Default", () => {
            new $.Default(
                new $.Do(new $.Identifier("x"))
            ).toString().should.deep.equal("default:\n  do($x)\n")
        })
        it("Branch", () => {
            const _case0 = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            const _case1 = new $.Case(
                new $.Identifier("cond1"), new $.Do(new $.Identifier("y"))
            )
            new $.Branch(
                [_case0, _case1], null
            ).toString().should.deep.equal("branch{\ncase($cond0):\n  do($x)\ncase($cond1):\n  do($y)\n}\n")
        })
        it("BranchWithDefault", () => {
            const _case0 = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            const _case1 = new $.Case(
                new $.Identifier("cond1"), new $.Do(new $.Identifier("y"))
            )
            const _default = new $.Default(new $.Do(new $.Identifier("z")))
            new $.Branch(
                [_case0, _case1], _default
            ).toString().should.deep.equal("branch{\ncase($cond0):\n  do($x)\ncase($cond1):\n  do($y)\ndefault:\n  do($z)\n}\n")
        })
    })
    describe("Return", () => {
        it("WithValue", () => {
            new $.Return(new $.Identifier("x")).toString().should.deep.equal("return($x)\n")
        })
        it("WithoutValue", () => {
            new $.Return(null).toString().should.deep.equal("return\n")
        })
    })
    it("Break", () => {
        new $.Break().toString().should.deep.equal("break\n")
    })
    it("Continue", () => {
        new $.Continue().toString().should.deep.equal("continue\n")
    })
    it("Suite", () => {
        new $.Suite(
            [new $.Do(new $.Identifier("x")), new $.Return(null)]
        ).toString().should.deep.equal("do($x)\nreturn\n")
    })
})


describe("fromJson", () => {
    it("null", () => {
        should.not.exist(createBlockFromJson(null))
    })
    it("TypeIdentifier", () => {
        createBlockFromJson({ "_type": "TypeIdentifier", "id": "x" }).should.deep.equal(new $.TypeIdentifier("x"))
    })
    it("PolymorphicType", () => {
        createBlockFromJson({
            "_type": "PolymorphicType",
            "id": { "_type": "TypeIdentifier", "id": "x" },
            "typevars": {
                "Y": { "_type": "TypeIdentifier", "id": "y" }
            },
        }).should.deep.equal(new $.PolymorphicType(
            new $.TypeIdentifier("x"),
            new Map([["Y", new $.TypeIdentifier("y")]]),
        ))
    })

    it("Num", () => {
        createBlockFromJson({ "_type": "Num", "value": "10", "isFloat": true }).should.deep.equal(new $.Num("10", true))
    })
    it("Str", () => {
        createBlockFromJson({ "_type": "Str", "value": "10" }).should.deep.equal(new $.Str("10"))
    })
    it("Identifier", () => {
        createBlockFromJson({ "_type": "Identifier", "id": "x" }).should.deep.equal(new $.Identifier("x"))
    })
    describe("Func", () => {
        it("Declaration", () => {
            createBlockFromJson({
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
            createBlockFromJson({
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
    it("Create", () => {
        createBlockFromJson({
            "_type": "Create",
            "type": { "_type": "TypeIdentifier", "id": "V" },
            "args": {
                "a": { "_type": "Identifier", "id": "x" },
            },
        }).should.deep.equal(
            new $.Create(
                new $.TypeIdentifier("V"), new Map([["a", new $.Identifier("x")]])
            )
        )
    })
    it("Call", () => {
        createBlockFromJson({
            "_type": "Call",
            "func": { "_type": "Identifier", "id": "f" },
            "args": {
                "a": { "_type": "Identifier", "id": "x" },
            },
        }).should.deep.equal(
            new $.Call(
                new $.Identifier("f"), new Map([["a", new $.Identifier("x")]])
            )
        )
    })

    it("Assign", () => {
        createBlockFromJson({
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
        createBlockFromJson({
            "_type": "Do",
            "expr": { "_type": "Identifier", "id": "x" },
        }).should.deep.equal(
            new $.Do(new $.Identifier("x"))
        )
    })
    it("Loop", () => {
        createBlockFromJson({
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
            createBlockFromJson({
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
            createBlockFromJson({
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
            createBlockFromJson({
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

            createBlockFromJson({
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
            createBlockFromJson({
                "_type": "Return",
                "value": { "_type": "Identifier", "id": "x" },
            }).should.deep.equal(new $.Return(new $.Identifier("x")))
        })
        it("WithoutValue", () => {
            createBlockFromJson({
                "_type": "Return",
                "value": null,
            }).should.deep.equal(new $.Return(null))
        })
    })
    it("Break", () => {
        createBlockFromJson({ "_type": "Break" }).should.deep.equal(new $.Break())
    })
    it("Continue", () => {
        createBlockFromJson({ "_type": "Continue" }).should.deep.equal(new $.Continue())
    })
    it("Suite", () => {
        createBlockFromJson({
            "_type": "Suite",
            "stmts": [{ "_type": "Break" }],
        }).should.deep.equal(new $.Suite([new $.Break]))
    })
})
