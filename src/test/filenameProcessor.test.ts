import {FsRefToFwInfo, PrefixOrderParser, SuffixOrderParser} from '../core/fwFiles';
import {FwExtensionParser} from '../core/fwFiles/parsers/fileName/FwExtensionParser';
import * as assert from 'assert';

describe('filenameProcessor', () => {
    const sut = new FsRefToFwInfo(
        new PrefixOrderParser(),
        new SuffixOrderParser(),
        new FwExtensionParser()
    );

    test.each([
        {
            input: '',
            expected: {
            }
        },
        {
            input: 'Something 1.2',
            expected: {
            }
        },
        {
            input: '1 Something',
            expected: {
            }
        },
        {
            input: 'Something',
            expected: {
            }
        },
        {
            input: 'Something.fw',
            expected: {
            }
        },
        {
            input: 'Something.fw.i',
            expected: {
            }
        },
        {
            input: 'Something.fw.i.d',
            expected: {
            }
        },
        {
            input: 'Something 3.fw.i',
            expected: {
            }
        },
        {
            input: '1 Something 3.fw.i',
            expected: {
            }
        },
        {
            input: '1 Something 3.fw.i',
            expected: {
            }
        },
        {
            input: '1.2 Something 3.fw.i',
            expected: {
            }
        }])('parse - %s', async ({input, expected}) => {
        let ctx = {};

    });
});