import * as chai from 'chai'
chai.should()

import * as $ from "../src/libinfo"

describe("createJsonFromLibInfo", () => {
    it("success", () => {
        $.createJsonFromLibInfo({
            "typevarNames": new Map([["V", ["W"]]]),
            "createArgNames": new Map([["V", ["a1"]]]),
            "argNames": new Map([["f", ["a2"]]]),
            "includes": new Set(["iostream"]),
            "lib": "",
        }).should.deep.equal({
            "typevarNames": { "V": ["W"] },
            "createArgNames": { "V": ["a1"] },
            "argNames": { "f": ["a2"] },
            "includes": ["iostream"],
            "lib": "",
        })
    })
})

describe("createLibInfoFromJson", () => {
    it("success", () => {
        $.createLibInfoFromJson({
            "typevarNames": { "V": ["W"] },
            "createArgNames": { "V": ["a1"] },
            "argNames": { "f": ["a2"] },
            "includes": ["iostream"],
            "lib": "",
        }).should.deep.equal({
            "typevarNames": new Map([["V", ["W"]]]),
            "createArgNames": new Map([["V", ["a1"]]]),
            "argNames": new Map([["f", ["a2"]]]),
            "includes": new Set(["iostream"]),
            "lib": "",
        })
    })
    it("lack argument", () => {
        const f = () => {
            $.createLibInfoFromJson({
                "typevarNames": { "V": ["W"] },
                "createArgNames": { "V": ["a1"] },
                "argNames": { "f": ["a2"] },
                "includes": ["iostream"],
            })
        }
        f.should.throw("No lib argument")
    })
})
