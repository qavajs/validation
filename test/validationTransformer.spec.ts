import { expect } from 'chai';
import { test } from '@jest/globals';
import { getValidation } from '../src/verify';

type TestParams = {
  validation: string;
  positiveArgs: [any, any];
  negativeArgs: [any, any];
  expectedError: string;
};
const tests: Array<TestParams> = [
  {
    validation: 'equals',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to deeply equal 2',
  },
  {
    validation: 'to equal',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to deeply equal 2',
  },
  {
    validation: 'does not equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not deeply equal 1',
  },
  {
    validation: 'not to equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not deeply equal 1',
  },
  {
    validation: 'to not equal',
    positiveArgs: [1, 2],
    negativeArgs: [1, 1],
    expectedError: 'expected 1 to not deeply equal 1',
  },
  {
    validation: 'matches',
    positiveArgs: ['expression', '^expression$'],
    negativeArgs: ['expression', '^espresso$'],
    expectedError: "'expression' to match /^espresso$/",
  },
  {
    validation: 'to match',
    positiveArgs: ['expression', /^expression$/],
    negativeArgs: ['expression', /^espresso$/],
    expectedError: "'expression' to match /^espresso$/",
  },
  {
    validation: 'does not match',
    positiveArgs: ['expression', '^espresso$'],
    negativeArgs: ['expression', '^expression$'],
    expectedError: "'expression' not to match /^expression$/",
  },
  {
    validation: 'contains',
    positiveArgs: ['expression', 'expr'],
    negativeArgs: ['expression', 'esp'],
    expectedError: "expected 'expression' to include 'esp'",
  },
  {
    validation: 'does not contain',
    positiveArgs: ['expression', 'esp'],
    negativeArgs: ['expression', 'expr'],
    expectedError: "expected 'expression' to not include 'expr'",
  },
  {
    validation: 'have members',
    positiveArgs: [
      [1, 2, 3],
      [3, 2, 1],
    ],
    negativeArgs: [[1, 2, 3], [4]],
    expectedError: 'expected [ 1, 2, 3 ] to have the same members as [ 4 ]',
  },
  {
    validation: 'does not have members',
    positiveArgs: [[1, 2, 3], [4]],
    negativeArgs: [
      [1, 2, 3],
      [3, 2, 1],
    ],
    expectedError: 'expected [ 1, 2, 3 ] to not have the same members as [ 3, 2, 1 ]',
  },
  {
    validation: 'to be above',
    positiveArgs: [2, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be above 2',
  },
  {
    validation: 'not to be above',
    positiveArgs: [1, 1],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be at most 1',
  },
  {
    validation: 'to be below',
    positiveArgs: [1, 2],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be below 1',
  },
  {
    validation: 'not to be below',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be at least 2',
  },
  {
    validation: 'to be greater than',
    positiveArgs: [2, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be above 2',
  },
  {
    validation: 'is not greater than',
    positiveArgs: [2, 2],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be at most 1',
  },
  {
    validation: 'to be less than',
    positiveArgs: [1, 2],
    negativeArgs: [2, 1],
    expectedError: 'expected 2 to be below 1',
  },
  {
    validation: 'not to be less than',
    positiveArgs: [1, 1],
    negativeArgs: [1, 2],
    expectedError: 'expected 1 to be at least 2',
  },
  {
    validation: 'to have type',
    positiveArgs: [1, 'number'],
    negativeArgs: [1, 'string'],
    expectedError: 'expected 1 to be a string',
  },

  {
    validation: 'not to have type',
    positiveArgs: [{}, 'string'],
    negativeArgs: [{}, 'object'],
    expectedError: 'expected {} not to be an object',
  },
];

test.each(tests)('$validation', ({ validation, positiveArgs, negativeArgs, expectedError }: TestParams) => {
  const verify = getValidation(validation);
  const catcherPositive = () => verify(...positiveArgs);
  const catcherNegative = () => verify(...negativeArgs);
  expect(catcherPositive).to.not.throw();
  expect(catcherNegative).to.throw(expectedError);
});

test('should throw an error if validation is not supported', () => {
  const catcher = () => getValidation('to be cool');
  expect(catcher).to.throw("validation 'to be cool' is not supported");
});
