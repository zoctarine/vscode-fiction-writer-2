import {ensureLength, increment} from '../../../core/lib';

describe('orderTools', () => {
	describe('increment', () => {
		test.each([
			{
				input: [1, 2, 3],
				expected: [1, 2, 4]
			},
			{
				input: [1],
				expected: [2]
			},
			{
				input: [],
				expected: []
			}
		])('should increment last element $input', ({input, expected}) => {
			expect(increment(input)).toEqual(expected);
		});

		test.each([
			{
				input: [1, 2, 3],
				level: 0,
				expected: [2, 2, 3]
			},
			{
				input: [1, 2, 3, 4],
				level: 1,
				expected: [1, 3, 3, 4]
			},
			{
				input: [],
				level: 1,
				expected: []
			},
			{
				input: [1, 2],
				level: 3,
				expected: [1, 2]
			}
		])('with level $level, should increment that level if exists $input', ({input, level, expected}) => {
			expect(increment(input, level)).toEqual(expected);
		});
	});

	describe('ensureLength', () => {
		test.each([
			{
				input: [],
				length: 0,
				expected: [1]
			},
			{
				input: [],
				length: 2,
				expected: [1, 1, 1]
			},
			{
				input: [2, 3],
				length: 2,
				expected: [2, 3, 1]
			},
			{
				input: [3],
				length: 2,
				expected: [3, 1, 1]
			},
			{
				input: [1],
				length: 0,
				expected: [1]
			},
			{
				input: [1, 2, 3],
				length: 2,
				expected: [1, 2, 3]
			},
			{
				input: [1, 2],
				length: -1,
				expected: [1, 2]
			}
		])('with level length, should increase order array if necessary to accomodate level $input', ({
																										  input,
																										  length,
																										  expected
																									  }) => {
			expect(ensureLength(input, length)).toEqual(expected);
		});
	});

})