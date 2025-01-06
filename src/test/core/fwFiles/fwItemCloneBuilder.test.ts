import {FwControl, FwItemBuilder, FwItemReplicator, FwSubType, FwType} from '../../../core/fwFiles';
import {FwItem} from '../../../core/fwFiles/FwItem';
import * as assert from 'assert';
import {ObjectProps} from '../../../core/lib';

describe("FwItemCloneBuilder", () => {
    const itemBuilder = new FwItemBuilder();

    describe('some/test/path/file.fw.md', () => {
        const item: FwItem = new FwItem(
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
                subType: FwSubType.ProjectFile,
                type: FwType.File,
                control: FwControl.Active,

                location: 'some/test/path',
                mainOrder: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                },
                name: 'file',
                markers: {
                    projectTag: 'fw',
                    data: [],
                    glue: '.'
                },
                subOrder: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                },

                ext: '.md',
            }
        );

        test('setFilename(test) changes only name and keeps all markers', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'test.fw.md',
                fsName: 'test.fw',
                fsPath: 'some/test/path/test.fw.md'
            };
            expected.info.name = 'test';

            const result = await new FwItemReplicator(item, itemBuilder)
                .withFilename("test")
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setExt(txt), changes only name and keeps all markers', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'file.fw.txt',
                fsName: 'file.fw',
                fsPath: 'some/test/path/file.fw.txt',
                fsExt: '.txt'
            };
            expected.info.ext = '.txt';

            const result = await new FwItemReplicator(item, itemBuilder)
                .withExt(".txt")
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setLocation(some/other/location), changes dir but keeps all others', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsDir: 'some/other/location',
                fsPath: 'some/other/location/file.fw.md',
            };
            expected.info.location = 'some/other/location';

            const result = await new FwItemReplicator(item, itemBuilder)
                .withLocation('some/other/location')
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setExt(cs), changes name and does not consider it a project file', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'file.fw.cs',
                fsName: 'file.fw',
                fsPath: 'some/test/path/file.fw.cs',
                fsExt: '.cs'
            };
            expected.info.name = 'file.fw';
            expected.info.ext = '.cs';
            expected.info.control = FwControl.Never;
            expected.info.subType = FwSubType.OtherFile;
            expected.info.markers.projectTag = '';

            const result = await new FwItemReplicator(item, itemBuilder)
                .withExt(".cs")
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setBaseName(other.fw.i.d.md) changes multiple file parts', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'other.fw.i.d.md',
                fsName: 'other.fw.i.d',
                fsPath: 'some/test/path/other.fw.i.d.md',
                fsExt: '.md'
            };
            expected.info.name = 'other';
            expected.info.ext = '.md';
            expected.info.markers.data = ['i', 'd'];
            const result = await new FwItemReplicator(item, itemBuilder)
                .withBasename("other.fw.i.d.md")
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setBaseName(other.xls) changes to OtherFile', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'other.xls',
                fsName: 'other',
                fsPath: 'some/test/path/other.xls',
                fsExt: '.xls'
            };
            expected.info.name = 'other';
            expected.info.ext = '.xls';
            expected.info.control = FwControl.Never;
            expected.info.subType = FwSubType.OtherFile;
            expected.info.markers.projectTag = '';

            const result = await new FwItemReplicator(item, itemBuilder)
                .withBasename("other.xls")
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setBaseName(other) keeps as file even if no extension', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'other',
                fsName: 'other',
                fsPath: 'some/test/path/other',
                fsExt: ''
            };
            expected.info.name = 'other';
            expected.info.ext = '';
            expected.info.control = FwControl.Never;
            expected.info.subType = FwSubType.OtherFile;
            expected.info.markers.projectTag = '';

            const result = await new FwItemReplicator(item, itemBuilder)
                .withBasename('other')
                .executeAsync();

            assert.deepEqual(result, expected);
        });


        test('setMainOrder([1,2]) adds order', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: '1.2 file.fw.md',
                fsName: '1.2 file.fw',
                fsPath: 'some/test/path/1.2 file.fw.md',
                fsExt: '.md'
            };
            expected.info.mainOrder.order = [1, 2];
            expected.info.mainOrder.padding = [1, 1];

            const result = await new FwItemReplicator(item, itemBuilder)
                .withMainOrder([1, 2])
                .executeAsync();

            assert.deepEqual(result, expected);
        });
        test('setMainOrder([1,2]) then setMainOrder([3]) updates order', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: '3 file.fw.md',
                fsName: '3 file.fw',
                fsPath: 'some/test/path/3 file.fw.md',
                fsExt: '.md'
            };
            expected.info.mainOrder.order = [3];
            expected.info.mainOrder.padding = [1];

            const result = await new FwItemReplicator(item, itemBuilder)
                .withMainOrder([1, 2])
                .withMainOrder([3])
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setMainOrder([1,2]) then setMainOrder([]) removes order', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'file.fw.md',
                fsName: 'file.fw',
                fsPath: 'some/test/path/file.fw.md',
                fsExt: '.md'
            };

            const result = await new FwItemReplicator(item, itemBuilder)
                .withMainOrder([1, 2])
                .withMainOrder([])
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setSubOrder([1,2]) adds order', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'file 1.2.fw.md',
                fsName: 'file 1.2.fw',
                fsPath: 'some/test/path/file 1.2.fw.md',
                fsExt: '.md'
            };
            expected.info.subOrder.order = [1, 2];
            expected.info.subOrder.padding = [1, 1];

            const result = await new FwItemReplicator(item, itemBuilder)
                .withSubOrder([1, 2])
                .executeAsync();

            assert.deepEqual(result, expected);
        });
        test('setSubOrder([1,2]) then setSubOrder([3]) updates order', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'file 3.fw.md',
                fsName: 'file 3.fw',
                fsPath: 'some/test/path/file 3.fw.md',
                fsExt: '.md'
            };
            expected.info.subOrder.order = [3];
            expected.info.subOrder.padding = [1];

            const result = await new FwItemReplicator(item, itemBuilder)
                .withSubOrder([1, 2])
                .withSubOrder([3])
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setMainOrder([1,2]) and setSubOrder([3]) adds both orders', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: '1.2 file 3.fw.md',
                fsName: '1.2 file 3.fw',
                fsPath: 'some/test/path/1.2 file 3.fw.md',
                fsExt: '.md'
            };
            expected.info.mainOrder.order = [1, 2];
            expected.info.mainOrder.padding = [1, 1];
            expected.info.subOrder.order = [3];
            expected.info.subOrder.padding = [1];

            const result = await new FwItemReplicator(item, itemBuilder)
                .withMainOrder([1, 2])
                .withSubOrder([3])
                .executeAsync();

            assert.deepEqual(result, expected);
        });

        test('setSubOrder([1,2]) and setMainOrder([]) removes order', async () => {
            const expected: FwItem = ObjectProps.deepClone(item);

            expected.fsRef = {
                ...expected.fsRef,
                fsBaseName: 'file.fw.md',
                fsName: 'file.fw',
                fsPath: 'some/test/path/file.fw.md',
                fsExt: '.md'
            };

            const result = await new FwItemReplicator(item, itemBuilder)
                .withSubOrder([1, 2])
                .withSubOrder([])
                .executeAsync();

            assert.deepEqual(result, expected);
        });
    });
})