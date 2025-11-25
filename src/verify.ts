import { expect } from './matchers';

export const validations = {
    EQUAL: 'equal',
    DEEPLY_EQUAL: 'deeply equal',
    STRICTLY_EQUAL: 'strictly equal',
    DEEPLY_STRICTLY_EQUAL: 'deeply strictly equal',
    HAVE_MEMBERS: 'have member',
    MATCH: 'match',
    CONTAIN: 'contain',
    ABOVE: 'above',
    BELOW: 'below',
    GREATER: 'greater than',
    LESS: 'less than',
    HAVE_TYPE: 'have type',
    INCLUDE_MEMBERS: 'include member',
    HAVE_PROPERTY: 'have property',
    MATCH_SCHEMA: 'match schema',
    CASE_INSENSITIVE_EQUAL: 'case insensitive equal',
    SATISFY: 'satisfy'
};

const isClause = '(?:is |do |does |to )?';
const notClause = '(?<reverse>not |to not )?';
const toBeClause = '(?:to )?(?:be )?';
const softlyClause = '(?<soft>softly )?';
const validationClause = `(?:(?<validation>${Object.values(validations).join('|')})(?:s|es| to)?)`;

export const validationExtractRegexp = new RegExp(`^${isClause}${notClause}${toBeClause}${softlyClause}${validationClause}$`);
export const validationRegexp = new RegExp(`(${isClause}${notClause}${toBeClause}${softlyClause}${validationClause})`);

type VerifyInput = {
    received: any;
    expected: any;
    validation: string;
    reverse: boolean;
    soft: boolean;
};

const aboveFn = (expectClause: any, expected: any) => expectClause.toBeGreaterThan(toNumber(expected));
const belowFn = (expectClause: any, expected: any) => expectClause.toBeLessThan(toNumber(expected));
const validationFns: Record<string, (expectClause: any, expected: any) => void> = {
    [validations.EQUAL]: (expectClause, expected: any) => expectClause.toSimpleEqual(expected),
    [validations.STRICTLY_EQUAL]: (expectClause: any, expected: any) => expectClause.toEqual(expected),
    [validations.DEEPLY_EQUAL]: (expectClause: any, expected: any) => expectClause.toDeepEqual(expected),
    [validations.DEEPLY_STRICTLY_EQUAL]: (expectClause: any, expected: any) => expectClause.toDeepStrictEqual(expected),
    [validations.HAVE_MEMBERS]: (expectClause: any, expected: any) => expectClause.toHaveMembers(expected),
    [validations.MATCH]: (expectClause: any, expected: any) => expectClause.toMatch(toRegexp(expected)),
    [validations.CONTAIN]: (expectClause: any, expected: any) => expectClause.toContain(expected),
    [validations.ABOVE]: aboveFn,
    [validations.BELOW]: belowFn,
    [validations.GREATER]: aboveFn,
    [validations.LESS]: belowFn,
    [validations.HAVE_TYPE]: (expectClause: any, expected: string) => expectClause.toHaveType(expected),
    [validations.INCLUDE_MEMBERS]: (expectClause: any, expected: string) => expectClause.toIncludeMembers(expected),
    [validations.HAVE_PROPERTY]: (expectClause: any, expected: string) => expectClause.toHaveProperty(expected),
    [validations.MATCH_SCHEMA]: (expectClause: any, expected: string) => expectClause.toMatchSchema(expected),
    [validations.CASE_INSENSITIVE_EQUAL]: (expectClause: any, expected: any) => expectClause.toCaseInsensitiveEqual(expected),
    [validations.SATISFY]: (expectClause: any, expected: any) => expectClause.toSatisfy(expected),
};

/**
 * Basic verification function
 * @param {VerifyInput} object with all needed data for validation
 */
export function verify({received, expected, validation, reverse, soft}: VerifyInput): void {
    const expectClause = expect(received).configure({not: reverse, soft});
    const validate = validationFns[validation];
    try {
        validate(expectClause, expected);
    } catch (e: any) {
        e.message = `[${e.name ?? e.code}] ${e.message}`;
        throw e;
    }
}

export function getValidation(validationType: string, options?: { soft: boolean }): (AR: any, expected: any) => void {
    const match = validationExtractRegexp.exec(validationType);
    if (!match) throw new Error(`Validation '${validationType}' is not supported`);
    const {reverse, validation, soft} = match.groups as { [p: string]: string };
    const softProp = options?.soft || !!soft;
    return function (received: any, expected: any) {
        verify({received, expected, validation, reverse: Boolean(reverse), soft: softProp});
    };
}

export function getPollValidation(validationType: string, options?: {
    soft: boolean
}): (AR: any, expected: any, options?: { timeout?: number, interval?: number }) => Promise<unknown> {
    const match = validationExtractRegexp.exec(validationType);
    if (!match) throw new Error(`Poll validation '${validationType}' is not supported`);
    const {reverse, validation, soft} = match.groups as { [p: string]: string };
    const softProp = options?.soft || !!soft;
    return async function (received: any, expected: any, options?: { timeout?: number, interval?: number }) {
        const timeout = options?.timeout ?? 5000;
        const interval = options?.interval ?? 500;
        let lastError: Error = new Error(`Promise was not settled before timeout`);
        let intervalId: NodeJS.Timeout;
        const evaluatePromise = new Promise<void>(resolve => {
            intervalId = setInterval(async () => {
                try {
                    const actualValue = await received();
                    verify({
                        received: actualValue,
                        expected,
                        validation,
                        reverse: Boolean(reverse),
                        soft: softProp
                    });
                    clearInterval(intervalId);
                    resolve();
                } catch (err: any) {
                    lastError = err;
                }
            }, interval);
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
            clearInterval(intervalId);
            reject(lastError)
        }, timeout));
        return Promise.race([evaluatePromise, timeoutPromise]);
    };
}

export async function poll(fn: Function, options?: { timeout?: number, interval?: number }) {
    const timeout = options?.timeout ?? 5000;
    const interval = options?.interval ?? 500;
    let lastError: Error = new Error('Unexpected error');
    let intervalId: NodeJS.Timeout;
    const evaluatePromise = new Promise<void>(resolve => {
        intervalId = setInterval(async () => {
            try {
                await fn();
                clearInterval(intervalId);
                resolve();
            } catch (err: any) {
                lastError = err;
            }
        }, interval);
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
        clearInterval(intervalId);
        reject(lastError);
    }, timeout));
    return Promise.race([evaluatePromise, timeoutPromise]);
}

export { expect };

function toNumber(n: any): number {
    const parsedNumber = Number.parseFloat(n);
    if (Number.isNaN(parsedNumber)) {
        throw new TypeError(`${n} is not a number`);
    }
    return parsedNumber;
}

function toRegexp(r: string | RegExp): RegExp {
    return r instanceof RegExp ? r : new RegExp(r);
}
