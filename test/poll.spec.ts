import { test, expect } from 'vitest';
import { getPollValidation, poll } from '../src/verify';

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

function asyncActualValueStringWithTimeout(timeout: number) {
    let index = 0;
    const values = [
        'uno',
        'dos',
        'tres'
    ];
    return async function() {
        return new Promise<string>(resolve => {
            setTimeout(() => {
                resolve(values[index++])
            }, timeout)
        })
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
    await expect(() => validation(actualFn, 'fail', { timeout: 1000, interval: 500 })).rejects.toThrow("Fail: expected 'uno' to equal 'fail'")
});

test('poll delay greater than interval', async () => {
    const actualFn = asyncActualValueStringWithTimeout(1000);
    const validation = getPollValidation('to equal');
    await validation(actualFn, 'tres', { timeout: 4000, interval: 500 });
});

test('poll delay greater than timeout', async () => {
    const actualFn = asyncActualValueStringWithTimeout(3000);
    const validation = getPollValidation('to equal');
    await expect(() => validation(actualFn, 'tres', { timeout: 2000, interval: 500 })).rejects.toThrow('Promise was not settled before timeout')
});

test('should throw an error if validation is not supported', () => {
    const catcher = () => getPollValidation('to be cool');
    expect(catcher).to.throw("Poll validation 'to be cool' is not supported");
});

test('should throw an error if validation is not supported', () => {
    const catcher = () => getPollValidation('to be cool');
    expect(catcher).to.throw("Poll validation 'to be cool' is not supported");
});

test('generic poll', async () => {
    await poll(async () => true, { timeout: 2000, interval: 500 });
});

test('generic err', async () => {
    const catcher = () => poll(async () => {
        throw new Error('custom error')
    }, { timeout: 2000, interval: 500 });
    await expect(catcher).rejects.toThrow('custom error');
});