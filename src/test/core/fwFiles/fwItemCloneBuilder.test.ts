import {FwControl, FwItemBuilder, FwItemCloneBuilder, FwSubType, FwType} from '../../../core/fwFiles';
import {FwItem} from '../../../core/fwFiles/FwItem';
import * as assert from 'assert';

describe("FwItemCloneBuilder", ()=>{
    const itemBuilder = new FwItemBuilder();

    test('test', async ()=>{
        const item : FwItem = new FwItem(
            {
                fsBaseName: 'file.fw.md',
                fsDir: 'some/test/path',
                fsExists: false,
                fsExt: '.md',
                fsIsFile: true,
                fsIsFolder: false,
                fsModifiedDate: undefined,
                fsName: 'file.fw',
                fsPath: 'some/test/path/file.fw.md'
            },
            {
                hash: undefined,
                meta: undefined,
                stats: undefined,
            },
            {
                control: FwControl.Active,
                extension: {
                    projectTag: 'fw',
                    data: [],
                    glue: '.'
                },
                mainOrder: {
                    order: [],
                    padding: [],
                    glue: '',
                    sep: '.'
                },
                name: 'file',
                subOrder: {
                    order: [],
                    padding: [],
                    glue: '',
                    sep: '.'
                },
                subType: FwSubType.ProjectFile,
                type: FwType.File
            }
        );
        const result = await new FwItemCloneBuilder(item, itemBuilder, {isFile: true})
           // .setFilename("test")
            .clone();

        assert.deepEqual(result, item);
    });
})