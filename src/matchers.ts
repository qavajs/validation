import { expect as base } from './expect';
import Ajv from 'ajv';

export const expect = base.extend({
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

function deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object' || !a || !b) return false;
    const keysA = Object.keys(a), keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
}