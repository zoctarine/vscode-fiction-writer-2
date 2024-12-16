import {FwExtensionParser} from '../../../../core/fwFiles';
import * as assert from 'assert';

describe('FwExtensionParser', () => {
    const sut = new FwExtensionParser();

    test.each([
        {
            input: '',
            expected: {
                unparsed: '',
                parsed: {
                    data: [],
                    projectTag: '',
                    glue: '.'
                }
            }
        },
        {
            input: 'Something',
            expected: {
                unparsed: 'Something',
                parsed: {
                    data: [],
                    projectTag: '',
                    glue: '.'
                }
            }
        },
        {
            input: ' Something ',
            expected: {
                unparsed: ' Something ',
                parsed: {
                    data: [],
                    glue: '.',
                    projectTag: ''
                }
            }
        },
        {
            input: 'Something.fw',
            expected: {
                unparsed: 'Something',
                parsed: {
                    data: [],
                    glue: '.',
                    projectTag: 'fw'
                }
            }
        },
        {
            input: 'Something.fw.i',
            expected: {
                unparsed: 'Something',
                parsed: {
                    data: ['i'],
                    glue: '.',
                    projectTag: 'fw'
                }
            }
        },
        {
            input: 'Something.fw.i.d',
            expected: {
                unparsed: 'Something',
                parsed: {
                    data: ['i','d'],
                    glue: '.',
                    projectTag: 'fw'
                }
            }
        },
        {
            input: 'Something.fw.i.d.',
            expected: {
                unparsed: 'Something.fw.i.d.',
                parsed: {
                    data: [],
                    glue: '.',
                    projectTag: ''
                }
            }
        },
        {
            input: 'Something.i.d',
            expected: {
                unparsed: 'Something.i.d',
                parsed: {
                    data: [],
                    glue: '.',
                    projectTag: ''
                }
            }
        },
    ])('parse - %s', async ({input, expected}) => {

        const result = sut.parse(input);
        assert.deepEqual(result, expected);

        const serialized = sut.serialize(result);
        assert.equal(serialized, input);
    });
});