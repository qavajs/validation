import { expect } from './matchers';

/**
 * Human-readable validation type identifiers used in natural-language assertion strings.
 * Each value corresponds to a supported comparison operation and can appear in phrases
 * parsed by {@link validationRegexp} / {@link validationExtractRegexp}.
 */
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

/**
 * Regexp that **fully** matches a validation phrase and extracts named groups:
 * - `validation` — the matched {@link validations} value
 * - `reverse` — present when the phrase contains a negation word (e.g. `"not"`)
 * - `soft` — present when the phrase contains `"softly"`
 *
 * @example
 * validationExtractRegexp.exec('not deeply equal')?.groups
 * // => { reverse: 'not ', validation: 'deeply equal', soft: undefined }
 */
export const validationExtractRegexp = new RegExp(`^${isClause}${notClause}${toBeClause}${softlyClause}${validationClause}$`);

/**
 * Regexp that **searches** for a validation phrase within a larger string.
 * Captures the same named groups as {@link validationExtractRegexp} but does not
 * require the phrase to occupy the full string.
 */
export const validationRegexp = new RegExp(`(${isClause}${notClause}${toBeClause}${softlyClause}${validationClause})`);

/** Arguments required by the {@link verify} function. */
type VerifyInput = {
    /** The actual value produced by the system under test. */
    received: any;
    /** The value to compare against. */
    expected: any;
    /** A {@link validations} value identifying the comparison to perform. */
    validation: string;
    /** When `true`, the assertion is negated (i.e. it must *not* pass). */
    reverse: boolean;
    /** When `true`, throws a `SoftAssertionError` instead of an `AssertionError` on failure. */
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
 * Runs a single synchronous assertion and throws an enriched error on failure.
 *
 * @param received - The actual value produced by the system under test.
 * @param expected - The value to compare against.
 * @param validation - A {@link validations} key identifying the comparison to perform.
 * @param reverse - When `true`, the assertion is negated.
 * @param soft - When `true`, throws a `SoftAssertionError` instead of an `AssertionError`.
 * @throws {AssertionError | SoftAssertionError} When the assertion fails.
 */
export function verify({received, expected, validation, reverse, soft}: VerifyInput): void {
    const expectClause = expect(received).configure({not: reverse, soft});
    const validate = validationFns[validation];
    try {
        validate(expectClause, expected);
    } catch (e: any) {
        e.message = `[${e.name ?? e.code}] ${e.message}`;
        Error.captureStackTrace(e, verify);
        throw e;
    }
}

/**
 * Parses a natural-language validation phrase and returns a ready-to-use assertion function.
 *
 * The phrase may include optional modifiers such as `"not"` (negation) and `"softly"` (soft mode).
 * The returned function calls {@link verify} internally.
 *
 * @param validationType - A natural-language string describing the validation
 *   (e.g. `'not deeply equal'`, `'softly contain'`).
 * @param options - Additional options; `soft: true` forces soft mode regardless of the phrase.
 * @returns A function `(received, expected) => void` that performs the assertion.
 * @throws {Error} If `validationType` cannot be parsed.
 *
 * @example
 * const assertEqual = getValidation('equal');
 * assertEqual('hello', 'hello'); // passes
 * assertEqual('hello', 'world'); // throws AssertionError
 */
export function getValidation(validationType: string, options?: { soft: boolean }): (AR: any, expected: any) => void {
    const match = validationExtractRegexp.exec(validationType);
    if (!match) throw new Error(`Validation '${validationType}' is not supported`);
    const {reverse, validation, soft} = match.groups as { [p: string]: string };
    const softProp = options?.soft || !!soft;
    return function (received: any, expected: any) {
        verify({received, expected, validation, reverse: Boolean(reverse), soft: softProp});
    };
}

/**
 * Parses a natural-language validation phrase and returns an async polling assertion function.
 *
 * The returned function repeatedly calls the `received` factory until the assertion passes
 * or the timeout is exceeded. Supports the same phrase modifiers as {@link getValidation}.
 *
 * @param validationType - A natural-language string describing the validation.
 * @param options - Additional options; `soft: true` forces soft mode regardless of the phrase.
 * @returns An async function `(received, expected, options?) => Promise<void>` that polls
 *   until the assertion passes or times out.
 * @throws {Error} If `validationType` cannot be parsed.
 *
 * @example
 * const pollEqual = getPollValidation('equal');
 * await pollEqual(() => fetchStatus(), 'done', { timeout: 10000, interval: 500 });
 */
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
        if (timeout <= 0) throw new Error('timeout must be greater than 0');
        if (interval <= 0) throw new Error('interval must be greater than 0');
        let lastError: Error = new Error(`Promise was not settled before timeout (${timeout}ms)`);
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

/**
 * Repeatedly invokes `fn` on a fixed interval until it resolves without throwing,
 * or until the timeout is reached.
 *
 * @param fn - An async (or sync) function containing the assertions or logic to retry.
 * @param options.timeout - Maximum wait time in milliseconds (default: `5000`).
 * @param options.interval - Polling interval in milliseconds (default: `500`).
 * @returns A promise that resolves when `fn` passes, or rejects with the last error on timeout.
 *
 * @example
 * await poll(async () => {
 *   const value = await fetchValue();
 *   expect(value).toBe('ready');
 * }, { timeout: 10000 });
 */
export async function poll(fn: Function, options?: { timeout?: number, interval?: number }) {
    const timeout = options?.timeout ?? 5000;
    const interval = options?.interval ?? 500;
    if (timeout <= 0) throw new Error('timeout must be greater than 0');
    if (interval <= 0) throw new Error('interval must be greater than 0');
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
