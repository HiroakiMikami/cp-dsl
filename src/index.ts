import * as L from "./libinfo"
import { createBlockFromJson as _createBlockFromJson } from "./syntax";
import { Transpiler as _Transpiler } from "./transpile";

export type LibInfo = L.LibInfo
export const createJsonFromLibInfo = L.createJsonFromLibInfo
export const createLibInfoFromJson = L.createLibInfoFromJson

export const createBlockFromJson = _createBlockFromJson
export const Transpiler = _Transpiler
