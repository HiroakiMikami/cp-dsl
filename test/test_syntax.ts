import * as chai from 'chai'
const should = chai.should()

import * as $ from "../src/syntax"
import { createBlockFromJson, createJsonFromBlock } from "../src/index"

describe("toString", () => {
    it("TypeIdentifier", () => {
        new $.TypeIdentifier("int").toString().should.equal("#int")
    })
    describe("PolymorphicType", () => {
        it("TypeArgument", () => {
            new $.TypeArgument("V", new $.TypeIdentifier("int")).toString().should.deep.equal("V=#int")
        })
        it("PolymorphicType", () => {
            new $.PolymorphicType(
                new $.TypeIdentifier("map"),
                [
                    new $.TypeArgument("V", new $.TypeIdentifier("int")),
                    new $.TypeArgument("K", new $.TypeIdentifier("string")),
                ]
            ).toString().should.deep.equal("#map<V=#int,K=#string>")
        })
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
    it("Argument", () => {
        new $.Argument(new $.Identifier("a0"), new $.Identifier("x")).toString().should.deep.equal("$a0=$x")
    })
    it("Create", () => {
        new $.Create(
            new $.TypeIdentifier("V"),
            [
                new $.Argument(new $.Identifier("a0"), new $.Identifier("x")),
                new $.Argument(new $.Identifier("a1"), new $.Identifier("y")),
            ],
        ).toString().should.deep.equal("(#V($a0=$x,$a1=$y))")
    })
    it("Call", () => {
        new $.Call(
            new $.Identifier("f"),
            [
                new $.Argument(new $.Identifier("a0"), new $.Identifier("x")),
                new $.Argument(new $.Identifier("a1"), new $.Identifier("y")),
            ],
        ).toString().should.deep.equal("($f($a0=$x,$a1=$y))")
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
    it("While", () => {
        new $.While(
            new $.Identifier("x"),
            new $.Do(new $.Identifier("z")),
        ).toString().should.deep.equal("while($x){\n  do($z)\n}\n")
    })
    it("Foreach", () => {
        new $.Foreach(
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


describe("createBlockFromJson", () => {
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
            "typevars": [
                {
                    "_type": "TypeArgument",
                    "name": "Y",
                    "type": { "_type": "TypeIdentifier", "id": "y" }
                },
            ]
        }).should.deep.equal(new $.PolymorphicType(
            new $.TypeIdentifier("x"),
            [new $.TypeArgument("Y", new $.TypeIdentifier("y"))],
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
    it("Argument", () => {
        createBlockFromJson({
            "_type": "Argument",
            "name": { "_type": "Identifier", "id": "x" },
            "value": { "_type": "Identifier", "id": "y" },
        }).should.deep.equal(
            new $.Argument(new $.Identifier("x"), new $.Identifier("y"))
        )
    })
    it("Create", () => {
        createBlockFromJson({
            "_type": "Create",
            "type": { "_type": "TypeIdentifier", "id": "V" },
            "args": [
                {
                    "_type": "Argument",
                    "name": { "_type": "Identifier", "id": "a" },
                    "value": { "_type": "Identifier", "id": "x" },
                }
            ],
        }).should.deep.equal(
            new $.Create(
                new $.TypeIdentifier("V"),
                [new $.Argument(new $.Identifier("a"), new $.Identifier("x"))],
            )
        )
    })
    it("Call", () => {
        createBlockFromJson({
            "_type": "Call",
            "func": { "_type": "Identifier", "id": "f" },
            "args": [
                {
                    "_type": "Argument",
                    "name": { "_type": "Identifier", "id": "a" },
                    "value": { "_type": "Identifier", "id": "x" },
                }
            ],
        }).should.deep.equal(
            new $.Call(
                new $.Identifier("f"),
                [new $.Argument(new $.Identifier("a"), new $.Identifier("x"))],
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
    it("While", () => {
        createBlockFromJson({
            "_type": "While",
            "cond": { "_type": "Identifier", "id": "x" },
            "body": {
                "_type": "Do",
                "expr": { "_type": "Identifier", "id": "z" },
            }
        }).should.deep.equal(
            new $.While(
                new $.Identifier("x"),
                new $.Do(new $.Identifier("z")),
            )
        )
    })
    it("Foreach", () => {
        createBlockFromJson({
            "_type": "Foreach",
            "id": { "_type": "Identifier", "id": "x" },
            "iterable": { "_type": "Identifier", "id": "xs" },
            "body": {
                "_type": "Do",
                "expr": { "_type": "Identifier", "id": "z" },
            }
        }).should.deep.equal(
            new $.Foreach(
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

describe("createJsonFromBlock", () => {
    it("null", () => {
        should.not.exist(createJsonFromBlock(null))
    })
    it("TypeIdentifier", () => {
        createJsonFromBlock(new $.TypeIdentifier("x")).should.deep.equal({ "_type": "TypeIdentifier", "id": "x" })
    })
    it("PolymorphicType", () => {
        createJsonFromBlock(new $.PolymorphicType(
            new $.TypeIdentifier("x"),
            [new $.TypeArgument("Y", new $.TypeIdentifier("y"))],
        )).should.deep.equal({
            "_type": "PolymorphicType",
            "id": { "_type": "TypeIdentifier", "id": "x" },
            "typevars": [
                {
                    "_type": "TypeArgument",
                    "name": "Y",
                    "type": { "_type": "TypeIdentifier", "id": "y" },
                },
            ],
        })
    })

    it("Num", () => {
        createJsonFromBlock(new $.Num("10", true)).should.deep.equal({ "_type": "Num", "value": "10", "isFloat": true })
    })
    it("Str", () => {
        createJsonFromBlock(new $.Str("10")).should.deep.equal({ "_type": "Str", "value": "10" })
    })
    it("Identifier", () => {
        createJsonFromBlock(new $.Identifier("x")).should.deep.equal({ "_type": "Identifier", "id": "x" })
    })
    describe("Func", () => {
        it("Declaration", () => {
            createJsonFromBlock(
                new $.Declaration(
                    new $.Identifier("x"), new $.TypeIdentifier("y")
                )
            ).should.deep.equal({
                "_type": "Declaration",
                "arg": { "_type": "Identifier", "id": "x" },
                "type": { "_type": "TypeIdentifier", "id": "y" },
            })
        })
        it("Func", () => {
            createJsonFromBlock(
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
            ).should.deep.equal({
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
            })
        })
    })
    it("Argument", () => {
        createJsonFromBlock(new $.Argument(new $.Identifier("x"), new $.Identifier("y"))).should.deep.equal({
            "_type": "Argument",
            "name": { "_type": "Identifier", "id": "x" },
            "value": { "_type": "Identifier", "id": "y" },
        })
    })
    it("Create", () => {
        createJsonFromBlock(
            new $.Create(
                new $.TypeIdentifier("V"), [new $.Argument(new $.Identifier("a"), new $.Identifier("x"))]
            )
        ).should.deep.equal({
            "_type": "Create",
            "type": { "_type": "TypeIdentifier", "id": "V" },
            "args": [
                {
                    "_type": "Argument",
                    "name": { "_type": "Identifier", "id": "a" },
                    "value": { "_type": "Identifier", "id": "x" },
                },
            ],
        })
    })
    it("Call", () => {
        createJsonFromBlock(
            new $.Call(
                new $.Identifier("f"), [new $.Argument(new $.Identifier("a"), new $.Identifier("x"))]
            )
        ).should.deep.equal({
            "_type": "Call",
            "func": { "_type": "Identifier", "id": "f" },
            "args": [
                {
                    "_type": "Argument",
                    "name": { "_type": "Identifier", "id": "a" },
                    "value": { "_type": "Identifier", "id": "x" },
                },
            ],
        })
    })

    it("Assign", () => {
        createJsonFromBlock(
            new $.Assign(
                new $.Identifier("x"), true, new $.Identifier("y")
            )
        ).should.deep.equal({
            "_type": "Assign",
            "lhs": { "_type": "Identifier", "id": "x" },
            "isDefine": true,
            "rhs": { "_type": "Identifier", "id": "y" },
        })
    })
    it("Do", () => {
        createJsonFromBlock(new $.Do(new $.Identifier("x"))).should.deep.equal({
            "_type": "Do",
            "expr": { "_type": "Identifier", "id": "x" },
        })
    })
    it("While", () => {
        createJsonFromBlock(
            new $.While(
                new $.Identifier("x"),
                new $.Do(new $.Identifier("z")),
            )
        ).should.deep.equal({
            "_type": "While",
            "cond": { "_type": "Identifier", "id": "x" },
            "body": {
                "_type": "Do",
                "expr": { "_type": "Identifier", "id": "z" },
            }
        })
    })
    it("Foreach", () => {
        createJsonFromBlock(
            new $.Foreach(
                new $.Identifier("x"), new $.Identifier("xs"),
                new $.Do(new $.Identifier("z")),
            )
        ).should.deep.equal({
            "_type": "Foreach",
            "id": { "_type": "Identifier", "id": "x" },
            "iterable": { "_type": "Identifier", "id": "xs" },
            "body": {
                "_type": "Do",
                "expr": { "_type": "Identifier", "id": "z" },
            }
        })
    })
    describe("Branch", () => {
        it("Case", () => {
            createJsonFromBlock(
                new $.Case(
                    new $.Identifier("c"), new $.Do(new $.Identifier("x"))
                )
            ).should.deep.equal({
                "_type": "Case",
                "cond": { "_type": "Identifier", "id": "c" },
                "body": {
                    "_type": "Do",
                    "expr": { "_type": "Identifier", "id": "x" },
                }
            })
        })
        it("Default", () => {
            createJsonFromBlock(new $.Default(new $.Do(new $.Identifier("x")))).should.deep.equal({
                "_type": "Default",
                "body": {
                    "_type": "Do",
                    "expr": { "_type": "Identifier", "id": "x" },
                }
            })
        })
        it("Branch", () => {
            const _case = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            createJsonFromBlock(new $.Branch([_case], null)).should.deep.equal({
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
            })
        })
        it("BranchWithDefault", () => {
            const _case = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            const _default = new $.Default(new $.Do(new $.Identifier("z")))

            createJsonFromBlock(new $.Branch([_case], _default)).should.deep.equal({
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
            })
        })
    })
    describe("Return", () => {
        it("WithValue", () => {
            createJsonFromBlock(new $.Return(new $.Identifier("x"))).should.deep.equal({
                "_type": "Return",
                "value": { "_type": "Identifier", "id": "x" },
            })
        })
        it("WithoutValue", () => {
            createJsonFromBlock(new $.Return(null)).should.deep.equal({
                "_type": "Return",
                "value": null,
            })
        })
    })
    it("Break", () => {
        createJsonFromBlock(new $.Break()).should.deep.equal({ "_type": "Break" })
    })
    it("Continue", () => {
        createJsonFromBlock(new $.Continue()).should.deep.equal({ "_type": "Continue" })
    })
    it("Suite", () => {
        createJsonFromBlock(new $.Suite([new $.Break])).should.deep.equal({
            "_type": "Suite",
            "stmts": [{ "_type": "Break" }],
        })
    })
})
