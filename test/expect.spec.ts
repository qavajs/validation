/**
 * Example use cases for the assertion library with Vitest tests.
 */

import { expect as base } from '../src/expect';
import { test, describe, expect as vitestExpect } from 'vitest';

const expect = base.extend({
    toEqual(expected: any) {
        const pass = expected === this.received;
        const message = pass
            ? `expected ${this.received} not to equal ${expected}`
            : `expected ${this.received} to equal ${expected}`;
        return { pass, message };
    },
    toContain(expected: string) {
        const pass = this.received.includes(expected);
        const message = pass
            ? `expected ${this.received} not to contain ${expected}`
            : `expected ${this.received} to contain ${expected}`;
        return { pass, message };
    },
    async toSatisfy(expected: (received: any) => boolean) {
        const pass = expected(this.received);
        const message = pass
            ? `expected ${this.received} not to satisfy ${expected}`
            : `expected ${this.received} to satisfy ${expected}`;
        return { pass, message };
    }
})
describe('Basic assertions', () => {
    test('toEqual and not.toEqual', () => {
        expect(1).toEqual(12);
        expect(2).not.toEqual(2);
    });

    test('toContain', () => {
        expect('string').toContain('str');
        expect('string').not.toContain('str2');
    });

    test('soft assertions', () => {
        expect(1).soft.toEqual(1);
        expect(2).soft.not.toEqual(3);
    });

    test('custom matcher toSatisfy', async () => {
        await expect(3).toSatisfy((value: number) => value % 2 !== 0);
        await expect(4).not.toSatisfy((value: number) => value % 2 !== 0);
    });
});

describe('Promise assertions', () => {
    test('resolves', async () => {
        const promise = Promise.resolve({ id: 1 });
        await expect(promise).resolves.toEqual({ id: 1 });
    });

    test('rejects', async () => {
        const promise = Promise.reject(new Error('no id'));
        await expect(promise).rejects.toThrow('no id');
    });
});

describe('Polling assertions', () => {
    test('polling value', async () => {
        let value = 0;
        setTimeout(() => { value = 200; }, 1500);

        await expect.poll(() => value, { interval: 500, timeout: 5000 }).toBe(200);
    });
});

// Extend example: custom matcher toHaveAmount
export const extendedExpect = expect.extend({
    toHaveAmount(this: any, actual: number, expected: number) {
        const assertionName = 'toHaveAmount';
        let pass: boolean;
        let actualValue: any;
        try {
            const expectation = this.isNot ? expect(actual).not : expect(actual);
            expectation.toEqual(expected);
            pass = true;
            actualValue = actual;
        } catch (e: any) {
            actualValue = e?.actual ?? actual;
            pass = false;
        }

        if (this.isNot) pass = !pass;

        const message = pass
            ? () => `expected not to have amount ${expected}`
            : () => `expected ${expected}, but got ${actualValue}`;

        return {
            name: assertionName,
            pass,
            message,
            expected,
            actual: actualValue
        };
    }
});

// Example usage of extended matcher
describe('Custom matcher toHaveAmount', () => {
    test('success', async () => {
        extendedExpect(100).toHaveAmount(100);
    });

    test('failure', async () => {
        try {
            extendedExpect(50).toHaveAmount(100);
        } catch (e) {
            expect(e.message()).toContain('expected 100, but got 50');
        }
    });
});

// Additional useful use cases
describe('Additional useful assertions', () => {
    test('toBeTruthy and toBeFalsy', () => {
        expect(true).toBeTruthy();
        expect(false).toBeFalsy();
    });

    test('toBeGreaterThan and toBeLessThan', () => {
        expect(10).toBeGreaterThan(5);
        expect(5).toBeLessThan(10);
    });

    test('toBeCloseTo', () => {
        expect(3.1415).toBeCloseTo(3.14, 2);
    });

    test('toHaveProperty', () => {
        const obj = { a: { b: 2 } };
        expect(obj).toHaveProperty('a.b');
    });

    test('toThrow', () => {
        expect(() => { throw new Error('fail'); }).toThrow('fail');
        expect(() => { return 1; }).not.toThrow();
    });
});
