import { expect } from '../src';
import { test, describe, expect as vitestExpect } from 'vitest';

describe('Basic assertions', () => {
    test('toEqual and not.toEqual', () => {
        expect(1).toEqual(1);
        expect(2).not.toEqual(1);
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
        expect(3).toSatisfy((value: number) => value % 2 !== 0);
        expect(4).not.toSatisfy((value: number) => value % 2 !== 0);
    });
});

describe('Promise assertions', () => {
    test('resolves', async () => {
        const promise = Promise.resolve(1);
        await expect(promise).toResolveWith(1);
    });

    test('rejects', async () => {
        const promise = Promise.reject(new Error('no id'));
        await expect(promise).toRejectWith('no id');
    });
});

describe('Polling assertions', () => {
    test('polling value', async () => {
        let value = 0;
        setTimeout(() => { value = 200; }, 1500);

        await expect(() => value).poll({ interval: 100, timeout: 2000 }).toEqual(200);
    });
});

describe('expect matchers', () => {
    // toBe
    test('toBe', () => {
        vitestExpect(() => expect(5).toBe(5)).not.toThrow();
        vitestExpect(() => expect(5).toBe(4)).toThrow();
    });

    // toBeGreaterThan
    test('toBeGreaterThan', () => {
        vitestExpect(() => expect(10).toBeGreaterThan(5)).not.toThrow();
        vitestExpect(() => expect(5).toBeGreaterThan(10)).toThrow();
    });

    // toBeGreaterThanOrEqual
    test('toBeGreaterThanOrEqual', () => {
        vitestExpect(() => expect(10).toBeGreaterThanOrEqual(5)).not.toThrow();
        vitestExpect(() => expect(5).toBeGreaterThanOrEqual(10)).toThrow();
    });

    // toBeLessThan
    test('toBeLessThan', () => {
        vitestExpect(() => expect(5).toBeLessThan(10)).not.toThrow();
        vitestExpect(() => expect(10).toBeLessThan(5)).toThrow();
    });

    // toBeLessThanOrEqual
    test('toBeLessThanOrEqual', () => {
        vitestExpect(() => expect(5).toBeLessThanOrEqual(10)).not.toThrow();
        vitestExpect(() => expect(10).toBeLessThanOrEqual(5)).toThrow();
    });

    // toBeNaN
    test('toBeNaN', () => {
        vitestExpect(() => expect(Number.NaN).toBeNaN()).not.toThrow();
        vitestExpect(() => expect(5).toBeNaN()).toThrow();
    });

    // toBeNull
    test('toBeNull', () => {
        vitestExpect(() => expect(null).toBeNull()).not.toThrow();
        vitestExpect(() => expect(0).toBeNull()).toThrow();
    });

    // toBeUndefined
    test('toBeUndefined', () => {
        vitestExpect(() => expect(undefined).toBeUndefined()).not.toThrow();
        vitestExpect(() => expect(null).toBeUndefined()).toThrow();
    });

    // toBeTruthy
    test('toBeTruthy', () => {
        vitestExpect(() => expect(true).toBeTruthy()).not.toThrow();
        vitestExpect(() => expect(false).toBeTruthy()).toThrow();
    });

    // toContain
    test('toContain', () => {
        vitestExpect(() => expect([1,2,3]).toContain(2)).not.toThrow();
        vitestExpect(() => expect([1,2,3]).toContain(4)).toThrow();
        vitestExpect(() => expect('hello world').toContain('world')).not.toThrow();
    });

    // toEqual
    test('toEqual', () => {
        vitestExpect(() => expect(5).toEqual(5)).not.toThrow();
        vitestExpect(() => expect(5).toEqual(4)).toThrow();
    });

    // toDeepEqual
    test('toDeepEqual', () => {
        vitestExpect(() => expect({a:1,b:2}).toDeepEqual({a:1,b:2})).not.toThrow();
        vitestExpect(() => expect({a:1,b:2}).toDeepEqual({a:2})).toThrow();
    });

    // toHaveLength
    test('toHaveLength', () => {
        vitestExpect(() => expect([1,2,3]).toHaveLength(3)).not.toThrow();
        vitestExpect(() => expect([1,2,3]).toHaveLength(2)).toThrow();
    });

    // toHaveProperty
    test('toHaveProperty', () => {
        vitestExpect(() => expect({a:1}).toHaveProperty('a')).not.toThrow();
        vitestExpect(() => expect({a:1}).toHaveProperty('a',1)).not.toThrow();
        vitestExpect(() => expect({a:1}).toHaveProperty('a',2)).toThrow();
        vitestExpect(() => expect({a:1}).toHaveProperty('b')).toThrow();
    });

    // toMatch
    test('toMatch', () => {
        vitestExpect(() => expect('hello world').toMatch(/hello/)).not.toThrow();
        vitestExpect(() => expect('hello world').toMatch('world')).not.toThrow();
        vitestExpect(() => expect('hello world').toMatch(/bye/)).toThrow();
    });

    // toThrow
    test('toThrow', () => {
        vitestExpect(() => expect(() => { throw new Error('fail') }).toThrow()).not.toThrow();
        vitestExpect(() => expect(() => { throw new Error('fail') }).toThrow('fail')).not.toThrow();
        vitestExpect(() => expect(() => {}).toThrow()).toThrow();
        vitestExpect(() => expect(() => { throw new Error('fail') }).toThrow('other')).toThrow();
    });
});
