import assert from 'assert';
import {
    ChainedTextProcessor,
    ExtractMeta,
    InjectMetaIntoContent,
    EraseMetaFromContent,
    UpdateMeta, ComputeWriteTarget, ComputeTextStatistics, ITextProcessor, LoadContent
} from '../core/processors';

import {FwFile, FwFileInfo} from '../core/fwFiles';
import deepEqual from 'deep-equal';
import * as vscode from 'vscode';

import {FwFileState} from '../core/state/fwFileState';

// jest.spyOn(vscode.Uri, 'parse')
//     .mockResolvedValue({});
const x = vscode.Uri.parse("test");
console.log(x);


describe('TextProcessors', () => {
    beforeEach(() => {
    });
    describe('parse', () => {
        describe('filename matches convention', () => {

            test(`extracts order and name from `, async () => {
                const text = `---\nsome: test\n...\n\nThis\nis\nit`;
                const sut = new ChainedTextProcessor();
                sut
                    .add(new ExtractMeta())
                    .add(new EraseMetaFromContent())
                    .add(new InjectMetaIntoContent());

                let data: any = {};
                let processed = await sut.process(text, data);

                assert.equal(processed, text);
                assert.deepEqual(data, {
                    metadata: {
                        markdownBlock: '---\nsome: test\n...\n\n',
                        text: 'some: test\n',
                        value: {some: "test"}
                    }
                });

                const sut2 = new ChainedTextProcessor()
                    .add(new UpdateMeta((meta => ({...meta, cool: "cool"}))))
                    .add(new EraseMetaFromContent())
                    .add(new InjectMetaIntoContent());

                processed = await sut2.process(processed, data);
                assert.equal(processed, `---\nsome: test\ncool: cool\n...\n\nThis\nis\nit`);
                assert.deepEqual(data, {
                    metadata: {
                        markdownBlock: '---\nsome: test\ncool: cool\n...\n\n',
                        text: 'some: test\ncool: cool\n',
                        value: {some: "test", cool: "cool"}
                    }
                });
            });

            test(`whenFwFileChanges`, function (done) {
                const text = `---\ntarget: 10\n...\n\nThis\nis\nit`;

                let mockedTextDocument = {
                    getText: jest.fn().mockReturnValue("THIS IS A TEST AND SOME MORE AS IT IS COOL")
                };

                const mockApi = mockedTextDocument as unknown as jest.Mocked<vscode.TextDocument>;

                jest.spyOn(vscode.workspace, 'openTextDocument')
                    .mockResolvedValue(mockApi);

                const sut = new ChainedTextProcessor()
                    .add(new ExtractMeta(), "meta")
                    .add(new ComputeTextStatistics(), "statistics")
                    .add(new ComputeWriteTarget());
                // compute icons, compute colors, ... etc
                let calls = 0;

                const state = new FwFileState({}, {
                    createUpdateMetaProcessor: alterState => sut,
                    createTextProcessor:()=>sut
                });
                state.onDidChange(({state, changed, snapshots}) => {

                    state.fileInfo = new FwFileInfo();
                    state.fileInfo.fsPath = "test";

                    calls++;
                    try {
                        switch (calls) {
                            case 1:
                                assert.deepEqual(state.writeTargets, {
                                    wordsTarget: 10,
                                    wordsTargetAchieved: 30,
                                    progress: "3/10 (30%)"
                                });
                                break;
                            case 2:
                                assert.deepEqual(state.writeTargets, {
                                    wordsTarget: 10,
                                    wordsTargetAchieved: 60,
                                    progress: "6/10 (60%)"
                                });
                                done();
                                break;
                        }
                    } catch (error) {
                        done(error);
                        throw error;
                    }
                });

                const state1 = new FwFileState({}, {
                    createTextProcessor: () => sut,
                    createUpdateMetaProcessor: alterState => sut
                });
                state1.loadState(text, {});

                state.loadState(text, {}).then(() =>
                    state.loadState(text + "this are some words", {})
                );
            });
        });
    });
});

