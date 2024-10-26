// import * as assert from 'assert';
//
// import {FwFileInfo, FwType} from '../core/fwFiles/fwFileInfo';
//
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
// // import * as myExtension from '../../extension';
//
// describe('FwFileInfo', () => {
//     describe('parse', () => {
//         describe('filename matches convention', () => {
//             [
//                 {path: "[1] fileManager1.fw.md", expected: {order: 1, name: "fileManager1"}},
//                 {path: "[123] fileManager1.fw.md", expected: {order: 123, name: "fileManager1"}},
//                 {path: "[001000] file.Manager2.fw.md", expected: {order: 1000, name: "file.Manager2"}},
//                 {path: "[004]  also works with spaces .fw.md", expected: {order: 4, name: " also works with spaces "}},
//             ].forEach(({path, expected}) => {
//                 test(`extracts order and name from ${path}`, function () {
//                     const file = FwFileInfo.parse(path, 'fw', ['fw.md']);
//
//                     assert.deepEqual(file, {
//                         fsPath: path,
//                         location: "",
//                         ext: ".fw.md",
//                         type: FwType.File,
//                         name: expected.name,
//                         order: expected.order,
//                         parentOrder: []
//                     });
//                 });
//             });
//         });
//
//         describe("filename does not match convention", () => {
//             [
//                 {path: "]__file.Manager2.fw.md", expected: {order: 0, name: "]__file.Manager2"}},
//                 {path: "justFilename.fw.md", expected: {order: 0, name: "justFilename"}},
//                 {path: "[2]with spaces.fw.md", expected: {order: 0, name: "[2]_with spaces"}},
//             ].forEach(({path, expected}) => {
//                 test(`extracts full name when correct fileType from ${path}`, function () {
//                     const file = FwFileInfo.parse(path, 'fw',  ['fw.md']);
//
//                     assert.deepEqual(file, {
//                         fsPath: path,
//                         location: "",
//                         name: expected.name,
//                         isDir: false,
//                         ext: ".fw.md",
//                         order: expected.order
//                     });
//                 });
//             });
//         });
//
//         [
//             {path: "[012] but_no_extension"},
//             {path: ".fw.md"},
//             {path: "[012] but_wrong_extension.fw.wow"},
//             {path: "[0123] but_not_fw_file.md"},
//             {path: "[0123] but_not_md.fw_file.txt"},
//             {path: "some.other"},
//         ].forEach(({path}) => {
//             test(`throws exception for ${path}`, function () {
//
//                 assert.throws(() => FwFileInfo.parse(path, 'fw', ['fw.md']));
//             });
//         });
//     });
//
// });
