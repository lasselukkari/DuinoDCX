"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.binding = void 0;
const path_1 = require("path");
const node_gyp_build_1 = __importDefault(require("node-gyp-build"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.binding = (0, node_gyp_build_1.default)((0, path_1.join)(__dirname, '../'));
