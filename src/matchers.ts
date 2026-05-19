import { expect as base, type MatcherResult, type MatcherContext } from './expect';
import Ajv from 'ajv';
import { isDeepStrictEqual } from 'node:util';

/**
 * Collection of built-in matcher methods available on every `expect()` call.
 * Each method returns a {@link MatcherResult} (or `Promise<MatcherResult>` for async matchers).
 */
export type BaseMatchers = {
    /** Loose equality (`==`). Passes when `received == expected`. */
    toSimpleEqual(this: MatcherContext<any>, expected: any): MatcherResult;
    /** Strict identity (`Object.is`). Passes when `Object.is(received, expected)`. */
    toEqual(this: MatcherContext<any>, expected: any): MatcherResult;
    /** Case-insensitive string equality. Both values are lowercased before comparison. */
    toCaseInsensitiveEqual(this: MatcherContext<any>, expected: string): MatcherResult;
    /** Strict identity using `Object.is`. Equivalent to {@link toEqual}. */
    toBe(this: MatcherContext<any>, expected: any): MatcherResult;
    /** Passes when `received > expected`. */
    toBeGreaterThan(this: MatcherContext<any>, expected: number): MatcherResult;
    /** Passes when `received >= expected`. */
    toBeGreaterThanOrEqual(this: MatcherContext<any>, expected: number): MatcherResult;
    /** Passes when `received < expected`. */
    toBeLessThan(this: MatcherContext<any>, expected: number): MatcherResult;
    /** Passes when `received <= expected`. */
    toBeLessThanOrEqual(this: MatcherContext<any>, expected: number): MatcherResult;
    /** Passes when `Number.isNaN(received)`. */
    toBeNaN(this: MatcherContext<any>): MatcherResult;
    /** Passes when `received === null`. */
    toBeNull(this: MatcherContext<any>): MatcherResult;
    /** Passes when `received === undefined`. */
    toBeUndefined(this: MatcherContext<any>): MatcherResult;
    /** Passes when `!!received` is truthy. */
    toBeTruthy(this: MatcherContext<any>): MatcherResult;
    /** Passes when `received.includes(expected)`. Works on strings and arrays. */
    toContain(this: MatcherContext<any>, expected: any): MatcherResult;
    /**
     * Deep equality with **unordered** array comparison.
     * Two arrays are considered equal when they contain the same elements regardless of order.
     */
    toDeepEqual(this: MatcherContext<any>, expected: any): MatcherResult;
    /**
     * Deep strict equality using Node.js `util.isDeepStrictEqual`.
     * Array order matters and type coercion is not performed.
     */
    toDeepStrictEqual(this: MatcherContext<any>, expected: any): MatcherResult;
    /** Strict reference equality (`===`). Passes when `received === expected`. */
    toStrictEqual(this: MatcherContext<any>, expected: any): MatcherResult;
    /** Passes when `received.length === expected`. */
    toHaveLength(this: MatcherContext<any>, expected: number): MatcherResult;
    /**
     * Passes when `received` has the given property `key`.
     * When `value` is also provided, the property must additionally equal that value (`Object.is`).
     */
    toHaveProperty(this: MatcherContext<any>, key: string, value?: any): MatcherResult;
    /** Passes when `received` matches the string or regular expression `expected`. */
    toMatch(this: MatcherContext<any>, expected: string | RegExp): MatcherResult;
    /**
     * Passes when invoking `received()` throws an error.
     * When `expected` is provided, the thrown error's message must match it.
     */
    toThrow(this: MatcherContext<() => any>, expected?: string | RegExp): MatcherResult;
    /**
     * Passes when the predicate `expected(received)` returns `true`.
     * @param expected - A function that receives the tested value and returns a boolean.
     */
    toSatisfy(this: MatcherContext<any>, expected: (received: any) => boolean): MatcherResult;
    /** Passes when the promise `received` resolves with a value equal to `expected`. */
    toResolveWith(this: MatcherContext<Promise<any>>, expected: any): Promise<MatcherResult>;
    /** Passes when the promise `received` rejects with an error message containing `expected`. */
    toRejectWith(this: MatcherContext<Promise<any>>, expected: string): Promise<MatcherResult>;
    /**
     * Passes when calling `received()` completes without throwing.
     * Useful for asserting that an async operation finishes successfully.
     */
    toPass(this: MatcherContext<() => any>): Promise<MatcherResult>;
    /** Validates `received` against a JSON Schema using AJV. */
    toMatchSchema(this: MatcherContext<any>, schema: object): MatcherResult;
    /**
     * Passes when `received` and `expected` arrays contain the same members, regardless of order.
     * Uses deep equality for element comparison.
     */
    toHaveMembers(this: MatcherContext<any[]>, expected: any[]): MatcherResult;
    /**
     * Passes when `received` is a superset of `expected` — every element in `expected`
     * has a matching element in `received` (deep equality, unordered).
     */
    toIncludeMembers(this: MatcherContext<any[]>, expected: any[]): MatcherResult;
    /**
     * Passes when `typeof received === expected`, or when `expected === 'array'` and
     * `Array.isArray(received)` is `true`.
     */
    toHaveType(this: MatcherContext<any>, expected: string): MatcherResult;
}

/**
 * Pre-configured `expect` function extended with all {@link BaseMatchers}.
 * Use this as the primary entry point for writing assertions.
 */
export const expect = base.extend<BaseMatchers>({
    toSimpleEqual(expected: any) {
        const pass = this.received == expected;
        const message = this.formatMessage(this.received, expected, 'to equal', this.isNot);
        return { pass, message };
    },

    toEqual(expected: any) {
        const pass = Object.is(this.received, expected);
        const message = this.formatMessage(this.received, expected, 'to equal', this.isNot);
        return { pass, message };
    },

    toCaseInsensitiveEqual(expected: string) {
        const pass = this.received.toLowerCase() === expected.toLowerCase();
        const message = this.formatMessage(this.received, expected, 'to equal', this.isNot);
        return { pass, message };
    },

    toBe(expected: any) {
        const pass = Object.is(this.received, expected);
        const message = pass
            ? `expected ${this.received} not to be ${expected}`
            : `expected ${this.received} to be ${expected}`;
        return { pass, message };
    },

    toBeGreaterThan(expected: number) {
        const pass = this.received > expected;
        const message = pass
            ? `expected ${this.received} not to be greater than ${expected}`
            : `expected ${this.received} to be greater than ${expected}`;
        return { pass, message };
    },

    toBeGreaterThanOrEqual(expected: number) {
        const pass = this.received >= expected;
        const message = pass
            ? `expected ${this.received} not to be greater than or equal to ${expected}`
            : `expected ${this.received} to be greater than or equal to ${expected}`;
        return { pass, message };
    },

    toBeLessThan(expected: number) {
        const pass = this.received < expected;
        const message = pass
            ? `expected ${this.received} not to be less than ${expected}`
            : `expected ${this.received} to be less than ${expected}`;
        return { pass, message };
    },

    toBeLessThanOrEqual(expected: number) {
        const pass = this.received <= expected;
        const message = pass
            ? `expected ${this.received} not to be less than or equal to ${expected}`
            : `expected ${this.received} to be less than or equal to ${expected}`;
        return { pass, message };
    },

    toBeNaN() {
        const pass = Number.isNaN(this.received);
        const message = pass
            ? `expected ${this.received} not to be NaN`
            : `expected ${this.received} to be NaN`;
        return { pass, message };
    },

    toBeNull() {
        const pass = this.received === null;
        const message = pass
            ? `expected ${this.received} not to be null`
            : `expected ${this.received} to be null`;
        return { pass, message };
    },

    toBeUndefined() {
        const pass = this.received === undefined;
        const message = pass
            ? `expected ${this.received} not to be undefined`
            : `expected ${this.received} to be undefined`;
        return { pass, message };
    },

    toBeTruthy() {
        const pass = !!this.received;
        const message = pass
            ? `expected ${this.received} not to be truthy`
            : `expected ${this.received} to be truthy`;
        return { pass, message };
    },

    toContain(expected: any) {
        const pass = this.received.includes(expected);
        const message = this.formatMessage(this.received, expected, 'to contain', this.isNot);
        return { pass, message };
    },

    toDeepEqual(expected: any) {
        const pass = deepEqual(this.received, expected);
        const message = this.formatMessage(this.received, expected, 'to deeply equal', this.isNot);
        return { pass, message };
    },

    toDeepStrictEqual(expected: any) {
        const pass = isDeepStrictEqual(this.received, expected);
        const message = this.formatMessage(this.received, expected, 'to deeply strictly equal', this.isNot);
        return { pass, message };
    },

    toStrictEqual(expected: any) {
        const pass = this.received === expected;
        const message = this.formatMessage(this.received, expected, 'to strictly equal', this.isNot);
        return { pass, message };
    },

    toHaveLength(expected: number) {
        const pass = this.received.length === expected;
        const message = this.formatMessage(this.received, expected, 'to have length', this.isNot);
        return { pass, message };
    },

    toHaveProperty(key: string, value?: any) {
        const hasKey = key in this.received;
        let pass = hasKey;
        if (hasKey && value !== undefined) pass = Object.is(this.received[key], value);
        const message = this.formatMessage(this.received, key, 'to have property', this.isNot);
        return { pass, message };
    },

    toMatch(expected: string | RegExp) {
        const pass = expected instanceof RegExp
            ? expected.test(this.received)
            : this.received.includes(expected);
        const message = this.formatMessage(this.received, expected, 'to match', this.isNot);
        return { pass, message };
    },

    toThrow(expected?: string | RegExp) {
        let pass = false;
        let message = `expected function to throw`;
        try {
            this.received();
        } catch (err: any) {
            const errorMsg = err?.message || String(err);
            if (!expected) pass = true;
            else if (expected instanceof RegExp) pass = expected.test(errorMsg);
            else pass = errorMsg.includes(expected);
            if (!pass) message = `expected function to throw ${expected}, but received "${errorMsg}"`;
        }
        return { pass, message };
    },

    toSatisfy(expected: (received: any) => boolean) {
        const pass = expected(this.received);
        const message = this.formatMessage(this.received, expected, 'to satisfy', this.isNot);
        return { pass, message };
    },

    async toResolveWith(expected: any) {
        let pass = true;
        let message = `expected promise to resolve with ${expected}`;
        try {
            const received = await this.received;
            pass = received === expected;
        } catch (error: any) {
            pass = false;
            message = `promise rejected: ${error.message}`;
        }
        return { pass, message };
    },

    async toRejectWith(expected: string) {
        let pass = true;
        let message = `expected promise to reject with ${expected}`;
        try {
            await this.received;
            pass = false;
        } catch (error: any) {
            pass = error.message.includes(expected);
        }
        return { pass, message };
    },

    async toPass() {
        let pass = true;
        let message = `expected provided function to pass, but it failed with:\n`;
        try {
            await this.received();
        } catch (e: any) {
            pass = false;
            message += e.message;
        }
        return { pass, message };
    },

    toMatchSchema(schema: Object) {
        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        const pass = validate(this.received);
        const messages = validate.errors
            ? validate.errors?.map(err => `${err.instancePath} ${err.message} (${err.schemaPath})`)
            : [];
        const errors = [
            'object does not match schema',
            ...messages
        ].join('\n');
        const message = `expected ${this.asString(this.received)} ${this.isNot ? 'not ': ''}to match schema\n` + errors;
        return { pass, message };
    },

    toHaveMembers(expected: any[]) {
        const pass = deepEqual(expected.toSorted(), this.received.toSorted());
        const message = this.formatMessage(this.received, expected, 'to have the same members as', this.isNot);
        return { pass, message };
    },

    toIncludeMembers(expected: any[]) {
        const pass = expected.every(member => this.received.some((receivedMember: any) => deepEqual(member, receivedMember)));
        const message = this.formatMessage(this.received, expected, 'to be a superset of', this.isNot);
        return { pass, message };
    },

    toHaveType(expected: string) {
        const pass = expected === 'array'
            ? Array.isArray(this.received)
            : typeof this.received === expected;
        const message = this.formatMessage(this.received, expected, 'to have type', this.isNot);
        return { pass, message };
    }
});

/**
 * Recursively compares two values for deep equality, treating arrays as **unordered** sets.
 * Objects are compared by sorted key order so that `{ a: 1, b: 2 }` equals `{ b: 2, a: 1 }`.
 *
 * @param a - First value.
 * @param b - Second value.
 * @returns `true` if both values are deeply equal.
 */
function deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object' || !a || !b) return false;

    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);

    if (isArrayA !== isArrayB) return false;

    if (isArrayA) {
        if (a.length !== b.length) return false;
        const usedIndices = new Set<number>();
        for (const itemA of a) {
            let found = false;
            for (let i = 0; i < b.length; i++) {
                if (!usedIndices.has(i) && deepEqual(itemA, b[i])) {
                    usedIndices.add(i);
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        return true;
    }

    // Handle objects with sorted keys
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (keysA.length !== keysB.length) return false;

    // Compare sorted keys first
    if (!keysA.every((key, i) => key === keysB[i])) return false;

    // Then compare values
    return keysA.every(k => deepEqual(a[k], b[k]));
}
