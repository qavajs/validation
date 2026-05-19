import { inspect } from 'node:util';
import { AssertionError as NodeAssertionError } from 'node:assert';

/**
 * Error thrown when an assertion fails.
 * Extends the built-in Node.js `AssertionError` with a fixed `name` property.
 */
export class AssertionError extends NodeAssertionError {
    name: string = 'AssertionError';
}

/**
 * Error thrown when a *soft* assertion fails.
 * Unlike {@link AssertionError}, soft assertion errors are intended to be collected
 * and reported together rather than halting execution immediately.
 */
export class SoftAssertionError extends AssertionError {
    name: string = 'SoftAssertionError';
}

/**
 * Context object available as `this` inside a matcher function.
 * @template Target - Type of the value being tested.
 */
export type MatcherContext<Target> = {
    /** The value under test, resolved from the factory function when polling. */
    received: Target;
    /** Whether the assertion is negated (`.not`). */
    isNot: boolean;
    /** Whether the assertion uses soft mode (`.soft`). */
    isSoft: boolean;
    /** Whether the assertion is running in poll mode. */
    isPoll: boolean;
    formatMessage(received: any, expected: any, assert: string, isNot: boolean): string;
    asString(value: any): string;
};

/**
 * Object returned by every matcher function.
 * `pass` indicates whether the assertion passed;
 * `message` is displayed when the assertion fails (or when `.not` negates a passing assertion).
 */
export type MatcherResult = {
    pass: boolean;
    message: string;
};

type MatcherReturn = MatcherResult | Promise<MatcherResult>;

type MatcherFn<Target = any, Args extends any[] = any[]> = (
    this: MatcherContext<Target>,
    ...rest: Args
) => MatcherReturn;

type MatcherMap = Record<string, MatcherFn>;

const customMatchers: MatcherMap = {};

/**
 * Core assertion class. Wraps a received value and exposes matcher methods through a Proxy.
 * Instances are normally created via the {@link expect} factory function — you rarely need
 * to instantiate this class directly.
 *
 * @template Target - Type of the value under test.
 * @template Matcher - Map of custom matchers registered via {@link expect.extend}.
 */
export class Expect<Target, Matcher extends MatcherMap = {}> {
    isSoft: boolean = false;
    isPoll: boolean = false;
    pollConfiguration = { timeout: 5000, interval: 100 };
    isNot: boolean = false;

    /**
     * @param received - The value to test.
     * @param configuration - Optional flags to pre-configure the assertion.
     */
    constructor(
        public received: Target,
        configuration?: { soft?: boolean; poll?: boolean; not?: boolean }
    ) {
        this.isSoft = configuration?.soft ?? false;
        this.isPoll = configuration?.poll ?? false;
        this.isNot = configuration?.not ?? false;
    }

    /**
     * Negates the matcher — the assertion passes when the matcher would normally fail
     * and vice versa.
     */
    public get not(): this {
        this.isNot = true;
        return this;
    }

    /**
     * Enables soft assertion mode. A soft assertion throws a {@link SoftAssertionError}
     * instead of an {@link AssertionError}, allowing callers to collect multiple failures
     * before reporting them.
     */
    public get soft(): this {
        this.isSoft = true;
        return this;
    }

    get Error(): typeof AssertionError {
        return this.isSoft ? SoftAssertionError : AssertionError;
    }

    /**
     * Enables polling mode: the received value is treated as a factory function and
     * called repeatedly until the matcher passes or the timeout is reached.
     *
     * @param timeout - Maximum wait time in milliseconds (default: `5000`).
     * @param interval - Polling interval in milliseconds (default: `100`).
     * @throws {TypeError} If the received value is not a function.
     */
    poll({ timeout, interval }: { timeout?: number; interval?: number } = {}): this {
        if (typeof this.received !== 'function') {
            throw new TypeError('Provided value must be a function');
        }
        this.isPoll = true;
        this.pollConfiguration.timeout = timeout ?? 5000;
        this.pollConfiguration.interval = interval ?? 100;
        return this;
    }

    /**
     * Applies multiple configuration flags at once. Unspecified options retain their
     * current values.
     *
     * @param options - Flags to set (`not`, `soft`, `poll`, `timeout`, `interval`).
     */
    configure(options: { not?: boolean, soft?: boolean, poll?: boolean, timeout?: number; interval?: number }): this {
        this.isNot = options.not ?? this.isNot;
        this.isSoft = options.soft ?? this.isSoft;
        this.isPoll = options.poll ?? this.isPoll;
        this.pollConfiguration.timeout = options.timeout ?? this.pollConfiguration.timeout;
        this.pollConfiguration.interval = options.interval ?? this.pollConfiguration.interval;
        return this;
    }

    /**
     * Builds a human-readable assertion failure message.
     *
     * @param received - The value that was actually received.
     * @param expected - The value that was expected.
     * @param assert - A short phrase describing the assertion (e.g. `'to equal'`).
     * @param isNot - When `true`, inserts `"not"` into the message.
     */
    formatMessage(
        received: any,
        expected: any,
        assert: string,
        isNot: boolean
    ) {
        return `expected ${this.asString(received)} ${isNot ? 'not ': ''}${assert} ${this.asString(expected)}`
    }

    /**
     * Converts any value to a human-readable string for use in assertion messages.
     * Functions are stringified via `.toString()`; all other values use `util.inspect`.
     *
     * @param value - The value to convert.
     */
    asString(value: any) {
        if (typeof value === 'function') return value.toString();
        return inspect(value, { depth: 1, compact: true })
    };
}

/**
 * Factory that creates a typed `expect` function bound to the current custom-matcher registry.
 * Returns a new factory each time {@link expect.extend} is called so that TypeScript picks up
 * the extended matcher types.
 *
 * @template Matcher - Map of custom matchers already registered.
 */
function createExpect<Matcher extends MatcherMap = {}>() {
    function expect<Target>(target: Target) {
        const instance = new Expect<Target, Matcher>(target);

        const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

        return new Proxy(instance, {
            get(target, prop: string | symbol, receiver) {
                if (prop in target) return Reflect.get(target, prop, receiver);

                const matcher = customMatchers[prop as string] as MatcherFn<Target>;
                if (!matcher) throw new TypeError(`${prop as string} matcher not found`);

                return (...expected: any[]) => {
                    if (target.isPoll) {
                        return (async () => {
                            const { timeout, interval } = target.pollConfiguration;
                            const start = Date.now();

                            while (true) {
                                try {
                                    const pollTarget = Object.create(target);
                                    pollTarget.received = await (target.received as any)();
                                    const { pass, message } = await matcher.call(
                                        pollTarget,
                                        ...expected
                                    );

                                    if (target.isNot !== pass) return;

                                    if (Date.now() - start >= timeout) {
                                        throw new target.Error({
                                            message,
                                            actual: target.received,
                                            expected: expected.at(0),
                                            operator: prop as string,
                                            diff: 'simple'
                                        });
                                    }
                                } catch (err) {
                                    if (Date.now() - start >= timeout) throw err;
                                }
                                await sleep(interval);
                            }
                        })();
                    }

                    const result = matcher.call(target, ...expected);

                    if (result instanceof Promise) {
                        return result.then(({ pass, message }) => {
                            if (target.isNot === pass) throw new target.Error({
                                message,
                                actual: target.received,
                                expected: expected.at(0),
                                operator: prop as string,
                                diff: 'simple'
                            });
                        });
                    } else {
                        const { pass, message } = result;
                        if (target.isNot === pass) throw new target.Error({
                            message,
                            actual: target.received,
                            expected: expected.at(0),
                            operator: prop as string,
                            diff: 'simple'
                        });
                    }
                };
            },
        }) as Expect<Target, Matcher> & {
            [Key in keyof Matcher]: Matcher[Key] extends MatcherFn<Target, infer Args>
                ? (...expected: Args) =>
                    ReturnType<Matcher[Key]> extends Promise<any>
                        ? Promise<Expect<Target, Matcher>>
                        : Target extends (...args: any) => any
                            ? Promise<Expect<Target, Matcher>>
                            : Expect<Target, Matcher>
                : never;
        };
    }

    /**
     * Registers additional matchers and returns a new `expect` function whose TypeScript
     * type includes the newly registered matchers.
     *
     * @param matchers - An object mapping matcher names to matcher functions.
     * @returns A new `expect` function extended with the provided matchers.
     *
     * @example
     * const expect = base.extend({
     *   toBePositive() {
     *     return { pass: this.received > 0, message: `expected ${this.received} to be positive` };
     *   }
     * });
     */
    expect.extend = function <NewMatcher extends MatcherMap>(matchers: NewMatcher) {
        Object.assign(customMatchers, matchers);
        return createExpect<Matcher & NewMatcher>();
    };

    return expect;
}

export const expect = createExpect();
