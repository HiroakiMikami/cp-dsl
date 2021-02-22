import * as chai from 'chai'
chai.should()

import * as $ from "../src/syntax"
import { Transpiler } from "../src/transpile"

describe("bundle", () => {
    it("returns compilable code", () => {
        const transpiler = new Transpiler({
            "typevarNames": new Map([
                ["Array", ["V"]],
                ["Map", ["K", "V"]]
            ]),
            "createArgNames": new Map([
                ["Integer", ["n"]],
                ["Array", ["size", "capacity"]],
            ]),
            "argNames": new Map([
                ["f", ["a0", "a1"]]
            ]),
            "includes": new Set(["iostream"]),
            "lib": "template <typename T>\nT double(T t) { return t * 2; }\n",
        })
        transpiler.bundle(new $.Do(new $.Num("10", false))).should.equal(`#include <iostream>
template <typename T>
T double(T t) { return t * 2; }

int main() {
  Integer(10L);
}
`)
    })
})

describe("transpile", () => {
    let transpiler: Transpiler | null = null
    beforeEach(() => {
        transpiler = new Transpiler({
            "typevarNames": new Map([
                ["Array", ["V"]],
                ["Map", ["K", "V"]]
            ]),
            "createArgNames": new Map([
                ["Integer", ["n"]],
                ["Array", ["size", "capacity"]],
            ]),
            "argNames": new Map([
                ["f", ["a0", "a1"]]
            ]),
            "includes": new Set(["stdio"]),
            "lib": "template <typename T>\nT double(T t) { return t * 2; }\n",
        })
    })
    it("TypeIdentifier", () => {
        transpiler.transpile(new $.TypeIdentifier("Integer")).should.equal("Integer")
    })
    describe("PolymorphicType", () => {
        it("success", () => {
            transpiler.transpile(new $.PolymorphicType(
                new $.TypeIdentifier("Map"),
                [
                    new $.TypeArgument("K", new $.TypeIdentifier("Integer")),
                    new $.TypeArgument("V", new $.TypeIdentifier("String")),
                ],
            )).should.equal("Map<Integer, String>")
        })
        it("unknown type", () => {
            const f = () => {
                transpiler.transpile(new $.PolymorphicType(
                    new $.TypeIdentifier("Set"),
                    [new $.TypeArgument("V", new $.TypeIdentifier("String"))],
                ))
            }
            f.should.throw("Unknown type: Set")
        })
        it("lack typevar", () => {
            const f = () => {
                transpiler.transpile(new $.PolymorphicType(
                    new $.TypeIdentifier("Map"),
                    [new $.TypeArgument("V", new $.TypeIdentifier("String"))],
                ))
            }
            f.should.throw("Typevar K is not specified in #Map<V=#String>")
        })
    })

    describe("Num", () => {
        it("float", () => {
            transpiler.transpile(new $.Num("10", true)).should.equal("Float(10)")
        })
        it("int", () => {
            transpiler.transpile(new $.Num("10", false)).should.equal("Integer(10L)")
        })
    })
    it("Str", () => {
        transpiler.transpile(new $.Str("x")).should.equal("String(\"x\")")
        transpiler.transpile(new $.Str("x\"y\"")).should.equal(`String("x\\"y\\"")`)
    })
    it("Identifier", () => {
        transpiler.transpile(new $.Identifier("x")).should.equal("x")
    })
    describe("Func", () => {
        it("Declaration", () => {
            transpiler.transpile(new $.Declaration(
                new $.Identifier("x"), new $.TypeIdentifier("i")
            )).should.equal("i &x")
        })
        it("Func", () => {
            transpiler.transpile(
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
    describe("Create", () => {
        it("TypeIdentifier", () => {
            transpiler.transpile(
                new $.Create(
                    new $.TypeIdentifier("Integer"),
                    [new $.Argument(new $.Identifier("n"), new $.Identifier("x"))],
                )
            ).should.equal("(Integer{x})")
        })
        it("PolymorphicType", () => {
            transpiler.transpile(
                new $.Create(
                    new $.PolymorphicType(
                        new $.TypeIdentifier("Array"),
                        [new $.TypeArgument("V", new $.TypeIdentifier("Integer"))],
                    ),
                    [
                        new $.Argument(new $.Identifier("capacity"), new $.Identifier("y")),
                        new $.Argument(new $.Identifier("size"), new $.Identifier("x"))
                    ],
                )
            ).should.equal("(Array<Integer>{x, y})")
        })
        it("unknown argument", () => {
            const f = () => {
                transpiler.transpile(
                    new $.Create(
                        new $.TypeIdentifier("g"),
                        [
                            new $.Argument(new $.Identifier("a0"), new $.Identifier("x")),
                            new $.Argument(new $.Identifier("a1"), new $.Identifier("y")),
                        ],
                    )
                )
            }
            f.should.throw("Unknown type: g")
        })
        it("lack argument", () => {
            const f = () => {
                transpiler.transpile(
                    new $.Create(
                        new $.TypeIdentifier("Integer"),
                        [],
                    )
                )
            }
            f.should.throw("Argument n is not specified in (#Integer())")
        })
    })
    describe("Call", () => {
        it("success", () => {
            transpiler.transpile(
                new $.Call(
                    new $.Identifier("f"),
                    [
                        new $.Argument(new $.Identifier("a0"), new $.Identifier("x")),
                        new $.Argument(new $.Identifier("a1"), new $.Identifier("y")),
                    ],
                )
            ).should.equal("(f(x, y))")
        })
        it("unknown function", () => {
            const f = () => {
                transpiler.transpile(
                    new $.Call(
                        new $.Identifier("g"),
                        [
                            new $.Argument(new $.Identifier("a0"), new $.Identifier("x")),
                            new $.Argument(new $.Identifier("a1"), new $.Identifier("y")),
                        ],
                    )
                )
            }
            f.should.throw("Unknown function: g")
        })
        it("lack argument", () => {
            const f = () => {
                transpiler.transpile(
                    new $.Call(
                        new $.Identifier("f"),
                        [
                            new $.Argument(new $.Identifier("a1"), new $.Identifier("y")),
                        ],
                    )
                )
            }
            f.should.throw("Argument a0 is not specified in ($f($a1=$y))")
        })
    })

    describe("Assign", () => {
        it("define", () => {
            transpiler.transpile(
                new $.Assign(
                    new $.Identifier("x"),
                    true,
                    new $.Identifier("y"),
                )
            ).should.equal("auto x = y;\n")
        })
        it("assign", () => {
            transpiler.transpile(
                new $.Assign(
                    new $.Identifier("x"),
                    false,
                    new $.Identifier("y"),
                )
            ).should.equal("x = y;\n")
        })
        it("define function", () => {
            transpiler.transpile(
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
                            [
                                new $.Argument(new $.Identifier("a0"), new $.Identifier("n")),
                                new $.Argument(new $.Identifier("a1"), new $.Identifier("m")),
                            ],
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
        transpiler.transpile(
            new $.Do(new $.Identifier("x"))
        ).should.equal("x;\n")
    })
    it("Loop", () => {
        transpiler.transpile(
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
            transpiler.transpile(
                new $.Case(
                    new $.Identifier("c"),
                    new $.Do(new $.Identifier("x")),
                )
            ).should.equal("else if (c) {\n  x;\n}\n")
        })
        it("Default", () => {
            transpiler.transpile(
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
            transpiler.transpile(
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

            transpiler.transpile(
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
            transpiler.transpile(
                new $.Return(new $.Identifier("x"))
            ).should.equal("return x;\n")
        })
        it("WithoutValue", () => {
            transpiler.transpile(new $.Return(null)).should.equal("return;\n")
        })
    })
    it("Break", () => {
        transpiler.transpile(new $.Break()).should.equal("break;\n")
    })
    it("Continue", () => {
        transpiler.transpile(new $.Continue()).should.equal("continue;\n")
    })
    it("Suite", () => {
        transpiler.transpile(
            new $.Suite([new $.Break, new $.Continue])
        ).should.equal("break;\ncontinue;\n")
    })
})
