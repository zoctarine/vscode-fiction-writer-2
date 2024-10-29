import {DefaultOrderParser, FwFileProcessor} from '../core/fwFiles';
import assert from 'assert';

describe('FwFileProcessor', () => {
    test.each([
        {
            input: 'theName.fw.mdx',
            expected: {
                order: [],
                orderedName: 'theName',
                name: 'theName',
                projectTag: 'fw',
                data: [],
                ext: '.fw.mdx',
                fsExt: '.mdx',
                fsName: 'theName.fw.mdx',
                fsDir: '',
                fsPath: 'theName.fw.mdx',
            },
        },
        {
            input: 'fwWithOneData.fw.i.txt',
            expected: {
                order: [],
                orderedName: 'fwWithOneData',
                name: 'fwWithOneData',
                projectTag: 'fw',
                data: ['i'],
                ext: '.fw.i.txt',
                fsExt: '.txt',
                fsName: 'fwWithOneData.fw.i.txt',
                fsDir: '',
                fsPath: 'fwWithOneData.fw.i.txt',
            },
        },
        {
            input: 'fwWith3Data.fw.i.d.p.md',
            expected: {
                order: [],
                orderedName: 'fwWith3Data',
                name: 'fwWith3Data',
                projectTag: 'fw',
                data: ['i', 'd', 'p'],
                ext: '.fw.i.d.p.md',
                fsExt: '.md',
                fsName: 'fwWith3Data.fw.i.d.p.md',
                fsDir: '',
                fsPath: 'fwWith3Data.fw.i.d.p.md',
            },
        },
        {
            input: 'anotherName.fw.some_else',
            expected: {
                order: [],
                orderedName: 'anotherName',
                name: 'anotherName',
                projectTag: 'fw',
                data: [],
                ext: '.fw.some_else',
                fsExt: '.some_else',
                fsName: 'anotherName.fw.some_else',
                fsDir: '',
                fsPath: 'anotherName.fw.some_else',
            },
        },
        {
            input: 'nonFwFile.xls',
            expected: {
                order: [],
                orderedName: 'nonFwFile',
                name: 'nonFwFile',
                projectTag: '',
                data: [],
                ext: '.xls',
                fsExt: '.xls',
                fsName: 'nonFwFile.xls',
                fsDir: '',
                fsPath: 'nonFwFile.xls',
            }
        },
        {
            input: 'no ext.',
            expected: {
                order: [],
                orderedName: 'no ext',
                name: 'no ext',
                projectTag: '',
                data: [],
                ext: '.',
                fsExt: '.',
                fsName: 'no ext.',
                fsDir: '',
                fsPath: 'no ext.',
            }
        },
        {
            input: 'likeADirectory',
            expected: {
                order: [],
                orderedName: 'likeADirectory',
                name: 'likeADirectory',
                projectTag: '',
                data: [],
                ext: '',
                fsExt: '',
                fsName: 'likeADirectory',
                fsDir: '',
                fsPath: 'likeADirectory',
            }
        }])('parse - %s', ({input, expected}) => {
        const sut = new FwFileProcessor(new DefaultOrderParser());

        const result = sut.process(input);

        assert.deepEqual(result, expected);
    })
})