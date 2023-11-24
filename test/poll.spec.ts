import { test } from '@jest/globals';
import { getPollValidation } from '../src/verify';
import { expect } from 'chai';

function asyncActualValueString() {
    let index = 0;
    const values = [
        'uno',
        'dos',
        'tres'
    ];
    return async function() {
        return values[index++]
    }
}
test('poll to equal', async () => {
    const actualFn = asyncActualValueString();
    const validation = getPollValidation('to equal');
    await validation(actualFn, 'tres', { timeout: 4000, interval: 500 });
});

test('poll to contain', async () => {
    const actualFn = asyncActualValueString();
    const validation = getPollValidation('to contain');
    await validation(actualFn, 'os', { timeout: 4000, interval: 500 });
});

test('poll timeout', async () => {
    const actualFn = asyncActualValueString();
    const validation = getPollValidation('to equal');
    try {
        await validation(actualFn, 'fail', { timeout: 1000, interval: 500 });
        throw new Error('error was not thown');
    } catch (err: any) {
        expect(err.message).to.equal("Fail: expected 'uno' to equal 'fail'");
    }
});
