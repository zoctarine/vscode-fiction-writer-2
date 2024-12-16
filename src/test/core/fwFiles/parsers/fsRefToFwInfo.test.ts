import {
    FsRefToFwInfo, FwControl,
    FwExtensionParser, FwSubType, FwType,
    IFsRef, PrefixOrderParser, SuffixOrderParser
} from '../../../../core/fwFiles';
import {ObjectProps} from '../../../../core/lib';

import path from 'path';
import * as assert from 'assert';

describe('FsRefToFwInfo', () => {
    const sut = new FsRefToFwInfo(
        new PrefixOrderParser(),
        new SuffixOrderParser(),
        new FwExtensionParser()
    );
    describe('parse and serialize', () => {
        test.each([
            {
                desc: 'should treat txt files without .fw tag as TextFile/Possible without parsing',
                inputRef: makeFileRef('/root/folder/file1.txt'),
                expectedInfo: {
                    type: FwType.File,
                    subType: FwSubType.TextFile,
                    control: FwControl.Possible,

                    name: 'file1',
                    mainOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    subOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    extension: {
                        projectTag: '',
                        data: [],
                        glue: '.',
                    },
                }
            },
            {
                desc: 'should treat md files without .fw tag as TextFile/Possible without parsing',
                inputRef: makeFileRef('/root/folder/1.0 file1.md'),
                expectedInfo: {
                    type: FwType.File,
                    subType: FwSubType.TextFile,
                    control: FwControl.Possible,

                    name: '1.0 file1',
                    mainOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    subOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    extension: {
                        projectTag: '',
                        data: [],
                        glue: '.',
                    },
                }
            },
            {
                desc: 'should treat other file types as OtherFile/Never without parsing',
                inputRef: makeFileRef('/root/folder/1.0 file 1.1.cs'),
                expectedInfo: {
                    type: FwType.File,
                    subType: FwSubType.OtherFile,
                    control: FwControl.Never,

                    name: '1.0 file 1.1',
                    mainOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    subOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    extension: {
                        projectTag: '',
                        data: [],
                        glue: '.',
                    },
                }
            },
            {
                desc: 'should treat fw.md files as project files with order parsing',
                inputRef: makeFileRef('/root/folder/1 file2.fw.md'),
                expectedInfo: {
                    type: FwType.File,
                    subType: FwSubType.ProjectFile,
                    control: FwControl.Active,

                    name: 'file',
                    mainOrder: {
                        glue: ' ',
                        sep: '.',
                        order: [1],
                        padding: [1]
                    },
                    subOrder: {
                        glue: '',
                        sep: '.',
                        order: [2],
                        padding: [1]
                    },
                    extension: {
                        projectTag: 'fw',
                        data: [],
                        glue: '.',
                    },
                }
            },
            {
                desc: 'should treat folders as Folder/Never without any parsing',
                inputRef: makeFolderRef('/root/folder/1 Folder'),
                expectedInfo: {
                    type: FwType.Folder,
                    subType: FwSubType.Folder,
                    control: FwControl.Never,

                    name: '1 Folder',
                    mainOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    subOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    extension: {
                        projectTag: '',
                        data: [],
                        glue: '.',
                    },
                }
            },
            {
                desc: 'should properly identify root folders',
                inputRef: makeFolderRef('/root'),
                expectedInfo: {
                    type: FwType.Folder,
                    subType: FwSubType.WorkspaceFolder,
                    control: FwControl.Never,

                    name: 'root',
                    mainOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    subOrder: {
                        glue: '',
                        sep: '.',
                        order: [],
                        padding: []
                    },
                    extension: {
                        projectTag: '',
                        data: [],
                        glue: '.',
                    },
                }
            }
        ])("$desc $inputRef.fsPath", async ({inputRef, expectedInfo}) => {

            const parsedInfo = sut.parse(inputRef, {rootFolderPaths: ['/root']});
            assert.deepEqual(parsedInfo, expectedInfo);

            const serializedRef = sut.serialize(parsedInfo, {
                rootFolderPaths: ['/root'],
                fsExt: inputRef.fsExt,
                fsDir: inputRef.fsDir,
                fsExists: inputRef.fsExists,
                fsModifiedDate: inputRef.fsModifiedDate,
            });
            const expectedRef = ObjectProps.deepClone(inputRef);

            assert.deepEqual(serializedRef, expectedRef);
        });
    });
});

function makeFileRef(fsPath: string): IFsRef {
    const p = path.posix.parse(fsPath);
    return {
        fsBaseName: p.base,
        fsDir: p.dir,
        fsExists: false,
        fsExt: p.ext,
        fsIsFile: true,
        fsIsFolder: false,
        fsModifiedDate: Date.now(),
        fsName: p.name,
        fsPath: fsPath
    };
}


function makeFolderRef(fsPath: string): IFsRef {
    const p = path.posix.parse(fsPath);
    return {
        fsBaseName: p.base,
        fsDir: p.dir,
        fsExists: false,
        fsExt: p.ext,
        fsIsFile: false,
        fsIsFolder: true,
        fsModifiedDate: Date.now(),
        fsName: p.name,
        fsPath: fsPath
    };
}