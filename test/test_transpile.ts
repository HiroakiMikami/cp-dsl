import * as chai from 'chai'
chai.should()

import * as $ from "../src/syntax"
import { transpile } from "../src/transpile"

describe("transpile", () => {
    it("TypeIdentifier", () => {
        transpile(new $.TypeIdentifier("Integer")).should.equal("Integer")
    })
    it("PolymorphicType", () => {
        transpile(new $.PolymorphicType(
            new $.TypeIdentifier("Map"),
            [new $.TypeIdentifier("Integer"), new $.TypeIdentifier("String")],
        )).should.equal("Map<Integer, String>")
    })

    describe("Num", () => {
        it("float", () => {
            transpile(new $.Num("10", true)).should.equal("Float(10)")
        })
        it("int", () => {
            transpile(new $.Num("10", false)).should.equal("Integer(10L)")
        })
    })
    it("Str", () => {
        transpile(new $.Str("x")).should.equal("String(\"x\")")
        transpile(new $.Str("x\"y\"")).should.equal(`String("x\\"y\\"")`)
    })
    it("Identifier", () => {
        transpile(new $.Identifier("x")).should.equal("x")
    })
    describe("Func", () => {
        it("Declaration", () => {
            transpile(new $.Declaration(
                new $.Identifier("x"), new $.TypeIdentifier("i")
            )).should.equal("i &x")
        })
        it("Func", () => {
            transpile(
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
            ).should.equal(`[&](y &x) -> y {
  z;
}`)
        })
    })
    it("BinOp", () => {
        transpile(
            new $.BinOp(
                new $.Identifier("x"),
                new $.Identifier("+"),
                new $.Identifier("y"),
            )
        ).should.equal("(x + y)")
    })
    it("Call", () => {
        transpile(
            new $.Call(
                new $.Identifier("f"),
                [new $.Identifier("x"), new $.Identifier("y")],
            )
        ).should.equal("(f(x, y))")
    })

    describe("Assign", () => {
        it("define", () => {
            transpile(
                new $.Assign(
                    new $.Identifier("x"),
                    true,
                    new $.Identifier("y"),
                )
            ).should.equal("auto x = y;\n")
        })
        it("assign", () => {
            transpile(
                new $.Assign(
                    new $.Identifier("x"),
                    false,
                    new $.Identifier("y"),
                )
            ).should.equal("x = y;\n")
        })
        it("define function", () => {
            transpile(
                new $.Assign(
                    new $.Identifier("f"),
                    true,
                    new $.Func(
                        [
                            new $.Declaration(
                                new $.Identifier("n"),
                                new $.TypeIdentifier("Integer")
                            ),
                            new $.Declaration(
                                new $.Identifier("m"),
                                new $.TypeIdentifier("Float")
                            ),
                        ],
                        new $.TypeIdentifier("void"),
                        new $.Do(new $.Call(
                            new $.Identifier("f"),
                            [new $.Identifier("n"), new $.Identifier("m")],
                        )),
                    )
                )
            ).should.equal(`auto _f = [&](Integer &n, Float &m, auto _f) -> void {
  auto f = [&](Integer &n, Float &m) -> void {
    return _f(n, m, _f);
  };
  (f(n, m));
};
auto f = [&](Integer &n, Float &m) -> void {
  return _f(n, m, _f);
};
`)
        })
    })
    it("Do", () => {
        transpile(
            new $.Do(new $.Identifier("x"))
        ).should.equal("x;\n")
    })
    it("Loop", () => {
        transpile(
            new $.Loop(
                new $.Identifier("x"), new $.Identifier("xs"),
                new $.Do(new $.Identifier("z")),
            )
        ).should.equal(`foreach(xs, [&](auto &x) -> void {
  z;
});
`)
    })
    describe("Branch", () => {
        it("Case", () => {
            transpile(
                new $.Case(
                    new $.Identifier("c"),
                    new $.Do(new $.Identifier("x")),
                )
            ).should.equal("else if (c) {\n  x;\n}\n")
        })
        it("Default", () => {
            transpile(
                new $.Default(new $.Do(new $.Identifier("x")))
            ).should.equal("else {\n  x;\n}\n")
        })
        it("Branch", () => {
            const _case0 = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            const _case1 = new $.Case(
                new $.Identifier("cond1"), new $.Do(new $.Identifier("y"))
            )
            transpile(
                new $.Branch([_case0, _case1], null)
            ).should.equal(`if (false) {}
else if (cond0) {
  x;
}
else if (cond1) {
  y;
}
`)
        })
        it("BranchWithDefault", () => {
            const _case0 = new $.Case(
                new $.Identifier("cond0"), new $.Do(new $.Identifier("x"))
            )
            const _case1 = new $.Case(
                new $.Identifier("cond1"), new $.Do(new $.Identifier("y"))
            )
            const _default = new $.Default(new $.Do(new $.Identifier("z")))

            transpile(
                new $.Branch([_case0, _case1], _default)
            ).should.equal(`if (false) {}
else if (cond0) {
  x;
}
else if (cond1) {
  y;
}
else {
  z;
}
`)
        })
    })
    describe("Return", () => {
        it("WithValue", () => {
            transpile(
                new $.Return(new $.Identifier("x"))
            ).should.equal("return x;\n")
        })
        it("WithoutValue", () => {
            transpile(new $.Return(null)).should.equal("return;\n")
        })
    })
    it("Break", () => {
        transpile(new $.Break()).should.equal("break;\n")
    })
    it("Continue", () => {
        transpile(new $.Continue()).should.equal("continue;\n")
    })
    it("Suite", () => {
        transpile(
            new $.Suite([new $.Break, new $.Continue])
        ).should.equal("break;\ncontinue;\n")
    })
})
