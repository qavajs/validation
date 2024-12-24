import { expect } from 'chai';
import { test } from 'vitest';
import { getValidation } from '../src/verify';

type TestParams = {
  testName: string;
  validation: string;
  positiveArgs: [any, any];
  negativeArgs: [any, any];
  expectedError: string;
};
const tests: Array<TestParams> = [
  {
    testName: 'equals',
    validation: 'equals',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to equal 2',
  },
  {
    testName: 'equals with type cast',
    validation: 'equals',
    positiveArgs: [1, '1'],
    negativeArgs: [1, '2'],
    expectedError: 'expected 1 to equal \'2\'',
  },
  {
    testName: 'to equal',
    validation: 'to equal',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to equal 2',
  },
  {
    testName: 'does not equal',
    validation: 'does not equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not equal 1',
  },
  {
    testName: 'not to equal',
    validation: 'not to equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not equal 1',
  },
  {
    testName: 'to not equal',
    validation: 'to not equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not equal 1',
  },
  {
    testName: 'strictly equals',
    validation: 'strictly equals',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to equal 2',
  },
  {
    testName: 'strictly equals with type cast',
    validation: 'strictly equals',
    positiveArgs: [1, 1],
    negativeArgs: [1, '1'],
    expectedError: 'expected 1 to equal \'1\'',
  },
  {
    testName: 'to strictly equal',
    validation: 'to strictly equal',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to equal 2',
  },
  {
    testName: 'does not strictly equal',
    validation: 'does not strictly equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not equal 1',
  },
  {
    testName: 'not to strictly equal',
    validation: 'not to strictly equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not equal 1',
  },
  {
    testName: 'to not strictly equal',
    validation: 'to not strictly equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not equal 1',
  },
  {
    testName: 'deeply equals',
    validation: 'deeply equals',
    positiveArgs: [{x: 1}, {x: 1}],
    negativeArgs: [{x: 1}, {x: 2}],
    expectedError: 'expected { x: 1 } to deeply equal { x: 2 }',
  },
  {
    testName: 'deeply equals array',
    validation: 'deeply equals',
    positiveArgs: [[1], [1]],
    negativeArgs: [[1], [2]],
    expectedError: 'expected [ 1 ] to deeply equal [ 2 ]',
  },
  {
    testName: 'to deeply equal',
    validation: 'to deeply equal',
    positiveArgs: [{x: 1}, {x: 1}],
    negativeArgs: [{x: 1}, {x: 2}],
    expectedError: 'expected { x: 1 } to deeply equal { x: 2 }',
  },
  {
    testName: 'does not deeply equal',
    validation: 'does not deeply equal',
    positiveArgs: [{x: 1}, {x: 2}],
    negativeArgs: [{x: 1}, {x: 1}],
    expectedError: 'expected { x: 1 } to not deeply equal { x: 1 }',
  },
  {
    testName: 'does not deeply equal array',
    validation: 'does not deeply equal',
    positiveArgs: [[1], [2]],
    negativeArgs: [[], []],
    expectedError: 'expected [] to not deeply equal []',
  },
  {
    testName: 'not to deeply equal',
    validation: 'not to deeply equal',
    positiveArgs: [{x: 1}, {x: 2}],
    negativeArgs: [{x: 1}, {x: 1}],
    expectedError: 'expected { x: 1 } to not deeply equal { x: 1 }',
  },
  {
    testName: 'to not deeply equal',
    validation: 'to not deeply equal',
    positiveArgs: [{x: 1}, {x: 2}],
    negativeArgs: [{x: 1}, {x: 1}],
    expectedError: 'expected { x: 1 } to not deeply equal { x: 1 }',
  },
  {
    testName: 'matches',
    validation: 'matches',
    positiveArgs: ['expression', '^expression$'],
    negativeArgs: ['expression', '^espresso$'],
    expectedError: "'expression' to match /^espresso$/",
  },
  {
    testName: 'to match',
    validation: 'to match',
    positiveArgs: ['expression', /^expression$/],
    negativeArgs: ['expression', /^espresso$/],
    expectedError: "'expression' to match /^espresso$/",
  },
  {
    testName: 'does not match',
    validation: 'does not match',
    positiveArgs: ['expression', '^espresso$'],
    negativeArgs: ['expression', '^expression$'],
    expectedError: "'expression' not to match /^expression$/",
  },
  {
    testName: 'contains',
    validation: 'contains',
    positiveArgs: ['expression', 'expr'],
    negativeArgs: ['expression', 'esp'],
    expectedError: "expected 'expression' to include 'esp'",
  },
  {
    testName: 'contains with type cast',
    validation: 'contains',
    positiveArgs: ['111111', 1],
    negativeArgs: ['1234', 5],
    expectedError: "expected '1234' to include 5",
  },
  {
    testName: 'does not contain',
    validation: 'does not contain',
    positiveArgs: ['expression', 'esp'],
    negativeArgs: ['expression', 'expr'],
    expectedError: "expected 'expression' to not include 'expr'",
  },
  {
    testName: 'have members',
    validation: 'have members',
    positiveArgs: [
      [1, 2, 3],
      [3, 2, 1],
    ],
    negativeArgs: [[1, 2, 3], [4]],
    expectedError: 'expected [ 1, 2, 3 ] to have the same members as [ 4 ]',
  },
  {
    testName: 'does not have members',
    validation: 'does not have members',
    positiveArgs: [[1, 2, 3], [4]],
    negativeArgs: [
      [1, 2, 3],
      [3, 2, 1],
    ],
    expectedError: 'expected [ 1, 2, 3 ] to not have the same members as [ 3, 2, 1 ]',
  },
  {
    testName: 'to include members',
    validation: 'include members',
    positiveArgs: [
      [1, 2, 3],
      [2, 1],
    ],
    negativeArgs: [[1, 2, 3], [4]],
    expectedError: 'expected [ 1, 2, 3 ] to be a superset of [ 4 ]',
  },
  {
    testName: 'not to include members',
    validation: 'not to include members',
    positiveArgs: [[1, 2, 3], [4]],
    negativeArgs: [
      [1, 2, 3],
      [2, 1],
    ],
    expectedError: 'expected [ 1, 2, 3 ] to not be a superset of [ 2, 1 ]',
  },
  {
    testName: 'to be above',
    validation: 'to be above',
    positiveArgs: [2, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be above 2',
  },
  {
    testName: 'to be above with type cast',
    validation: 'to be above',
    positiveArgs: [2, '1'],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be above 2',
  },
  {
    testName: 'to be above throw error if ER is not a number',
    validation: 'to be above',
    positiveArgs: [2, '1'],
    negativeArgs: [1, 'two'],
    expectedError: 'two is not a number',
  },
  {
    testName: 'not to be above',
    validation: 'not to be above',
    positiveArgs: [1, 1],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be at most 1',
  },
  {
    testName: 'to be below',
    validation: 'to be below',
    positiveArgs: [1, 2],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be below 1',
  },
  {
    testName: 'to be below with type cast',
    validation: 'to be below',
    positiveArgs: [1, '2'],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be below 1',
  },
  {
    testName: 'to be below throw an error if ER is not a number',
    validation: 'to be below',
    positiveArgs: [1, '2'],
    negativeArgs: [2, 'one'],
    expectedError: 'one is not a number',
  },
  {
    testName: 'not to be below',
    validation: 'not to be below',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be at least 2',
  },
  {
    testName: 'to be greater than',
    validation: 'to be greater than',
    positiveArgs: [2, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be above 2',
  },
  {
    testName: 'is not greater than',
    validation: 'is not greater than',
    positiveArgs: [2, 2],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be at most 1',
  },
  {
    testName: 'to be less than',
    validation: 'to be less than',
    positiveArgs: [1, 2],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be below 1',
  },
  {
    testName: 'not to be less than',
    validation: 'not to be less than',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be at least 2',
  },
  {
    testName: 'to have type',
    validation: 'to have type',
    positiveArgs: [1, 'number'],
    negativeArgs: [1, 'string'],
    expectedError: 'expected 1 to be a string',
  },
  {
    testName: 'not to have type',
    validation: 'not to have type',
    positiveArgs: [{}, 'string'],
    negativeArgs: [{}, 'object'],
    expectedError: 'expected {} not to be an object',
  },
  {
    testName: 'to have property',
    validation: 'to have property',
    positiveArgs: [{ prop: 42 }, 'prop'],
    negativeArgs: [{ prop: 42 }, 'anotherProp'],
    expectedError: 'expected { prop: 42 } to have property \'anotherProp\'',
  },
  {
    testName: 'not to have property',
    validation: 'not to have property',
    positiveArgs: [{ prop: 42 }, 'anotherProp'],
    negativeArgs: [{ prop: 42 }, 'prop'],
    expectedError: 'expected { prop: 42 } to not have property \'prop\'',
  },
  {
    testName: 'to match schema',
    validation: 'to match schema',
    positiveArgs: [{ prop: 42, str: 'abc' }, {
      type: 'object',
      properties: {
        prop: {type: 'integer'},
        str: {type: 'string', pattern: '^abc$'}
      },
      required: ['prop'],
      additionalProperties: false,
    }],
    negativeArgs: [{ prop: 42, str: 'ab' }, {
      type: 'object',
      properties: {
        prop: {type: 'integer'},
        str: {type: 'string', pattern: '^abc$'}
      },
      required: ['prop'],
      additionalProperties: false,
    }],
    expectedError: 'object does not match schema\n/str must match pattern "^abc$" (#/properties/str/pattern)',
  },
  {
    testName: 'case insensitive equals',
    validation: 'case insensitive equals',
    positiveArgs: ['some text', 'Some Text'],
    negativeArgs: ['some text', 'Another Text'],
    expectedError: 'expected \'some text\' to equal \'Another Text\'',
  },
  {
    testName: 'not to case insensitive equal',
    validation: 'not to case insensitive equal',
    positiveArgs: ['some text', 'Another Text'],
    negativeArgs: ['some text', 'Some Text'],
    expectedError: 'expected \'some text\' to not equal \'Some Text\'',
  },
];

test.each(tests)('$testName', ({ validation, positiveArgs, negativeArgs, expectedError }: TestParams) => {
  const verify = getValidation(validation);
  const catcherPositive = () => verify(...positiveArgs);
  const catcherNegative = () => verify(...negativeArgs);
  expect(catcherPositive).to.not.throw();
  expect(catcherNegative).to.throw(expectedError);
});

test('should throw an error if validation is not supported', () => {
  const catcher = () => getValidation('to be cool');
  expect(catcher).to.throw("Validation 'to be cool' is not supported");
});
