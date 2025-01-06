import {SuffixOrderParser} from '../../../../core/fwFiles';
import * as assert from 'assert';

describe('SuffixOrderParser', () => {
    const sut = new SuffixOrderParser();

    test.each([
        {
            input: '',
            expected: {
                unparsed: '',
                parsed: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.',
                }
            }
        },
        {
            input: 'Something',
            expected: {
                unparsed: 'Something',
                parsed: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                }
            }
        }, {
            input: ' Something ',
            expected: {
                unparsed: ' Something ',
                parsed: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: '1 Something',
            expected: {
                unparsed: '1 Something',
                parsed: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: '1.2 Something',
            expected: {
                unparsed: '1.2 Something',
                parsed: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something 3',
            expected: {
                unparsed: 'Something',
                parsed: {
                    order: [3],
                    padding: [1],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something 0003',
            expected: {
                unparsed: 'Something',
                parsed: {
                    order: [3],
                    padding: [4],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something 1.2.3',
            expected: {
                unparsed: 'Something',
                parsed: {
                    order: [1, 2, 3],
                    padding: [1, 1, 1],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something 1.20.03',
            expected: {
                unparsed: 'Something',
                parsed: {
                    order: [1, 20, 3],
                    padding: [1, 2, 2],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something1',
            expected: {
                unparsed: 'Something',
                parsed: {
                    order: [1],
                    padding: [1],
                    glue: '',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something1.2',
            expected: {
                unparsed: 'Something',
                parsed: {
                    order: [1,2],
                    padding: [1, 1],
                    glue: '',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something1.2.',
            expected: {
                unparsed: 'Something1.2.',
                parsed: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: '1',
            expected: {
                unparsed: '1',
                parsed: {
                    order: [],
                    padding: [],
                    glue: ' ',
                    sep: '.'
                }
            }
        }
    ])('parse - %s', async ({input, expected}) => {

        const result = sut.parse(input);
        assert.deepEqual(result, expected);

        const serialized = sut.serialize(result);
        assert.equal(serialized, input);
    });
});