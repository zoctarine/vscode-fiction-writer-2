import {PrefixOrderParser} from '../../../../core/fwFiles';
import * as assert from 'assert';

describe('PrefixOrderParser', () => {
    const sut = new PrefixOrderParser();

    test.each([
        {
            input: '',
            expected: {
                unparsed: '',
                parsed:{
                    order:[],
                    padding: [],
                    glue: '',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something',
            expected: {
                unparsed: 'Something',
                parsed:{
                    order:[],
                    padding: [],
                    glue: '',
                    sep: '.'
                }
            }
        },{
            input: ' Something ',
            expected: {
                unparsed: ' Something ',
                parsed:{
                    order:[],
                    padding: [],
                    glue: '',
                    sep: '.'
                }
            }
        },
        {
            input: 'Something 1.2',
            expected: {
                unparsed: 'Something 1.2',
                parsed:{
                    order:[],
                    padding: [],
                    glue: '',
                    sep: '.'
                }
            }
        },
        {
            input: '1 Something',
            expected: {
                unparsed: 'Something',
                parsed:{
                    order:[1],
                    padding: [1],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: '1 Something 3.fw.i',
            expected: {
                unparsed: 'Something 3.fw.i',
                parsed:{
                    order:[1],
                    padding: [1],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: '1.2.3 Something',
            expected: {
                unparsed: 'Something',
                parsed:{
                    order:[1,2,3],
                    padding: [1,1,1],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: '01.2.003 Something',
            expected: {
                unparsed: 'Something',
                parsed:{
                    order:[1,2,3],
                    padding: [2,1,3],
                    glue: ' ',
                    sep: '.'
                }
            }
        },
        {
            input: '1.2.Something',
            expected: {
                unparsed: 'Something',
                parsed:{
                    order:[1,2],
                    padding: [1,1],
                    glue: '.',
                    sep: '.'
                }
            }
        },
        {
            input: '01. Something',
            expected: {
                unparsed: 'Something',
                parsed:{
                    order:[1],
                    padding: [2],
                    glue: '. ',
                    sep: '.'
                }
            }
        },
        {
            input: '1.2Something',
            expected: {
                unparsed: '2Something',
                parsed:{
                    order:[1],
                    padding: [1],
                    glue: '.',
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