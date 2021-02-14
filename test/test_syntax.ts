import * as chai from 'chai'
chai.should()

import * as $ from "../src/syntax"

describe("toString", () => {
    it("TypeIdentifier", () => {
        new $.TypeIdentifier("int").toString().should.equal("#int")
    })
    it("PolymorphicType", () => {
        new $.PolymorphicType(
            new $.TypeIdentifier("map"),
            [new $.TypeIdentifier("int"), new $.TypeIdentifier("string")],
        ).toString().should.deep.equal("#map<#int,#string>")
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
    it("BinOp", () => {
        new $.BinOp(
            new $.Identifier("x"), new $.Identifier("+"), new $.Identifier("y")
        ).toString().should.deep.equal("($x$+$y)")
    })
    it("Call", () => {
        new $.Call(
            new $.Identifier("f"), [new $.Identifier("x"), new $.Identifier("y")]
        ).toString().should.deep.equal("($f($x,$y))")
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
