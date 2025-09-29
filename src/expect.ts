class AssertionError extends Error {
    name: string = 'AssertionError';
}

class SoftAssertionError extends AssertionError {
    name: string = 'SoftAssertionError';
}

type MatcherContext<Target> = {
    received: Target;
    isNot: boolean;
    isSoft: boolean;
    isPoll: boolean;
};

type MatcherResult = {
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

export class Expect<Target, Matcher extends MatcherMap = {}> {
    isSoft: boolean = false;
    isPoll: boolean = false;
    pollConfiguration = { timeout: 5000, interval: 100 };
    isNot: boolean = false;

    constructor(
        public received: Target,
        configuration?: { soft?: boolean; poll?: boolean; not?: boolean }
    ) {
        this.isSoft = configuration?.soft ?? false;
        this.isPoll = configuration?.poll ?? false;
        this.isNot = configuration?.not ?? false;
    }

    public get not(): this {
        this.isNot = true;
        return this;
    }

    public get soft(): this {
        this.isSoft = true;
        return this;
    }

    get Error(): typeof AssertionError {
        return this.isSoft ? SoftAssertionError : AssertionError;
    }

    poll({ timeout, interval }: { timeout?: number; interval?: number } = {}): this {
        if (typeof this.received !== 'function') {
            throw new TypeError('Provided value must be a function');
        }
        this.isPoll = true;
        this.pollConfiguration.timeout = timeout ?? 5000;
        this.pollConfiguration.interval = interval ?? 100;
        return this;
    }
}

function createExpect<Matcher extends MatcherMap = {}>() {
    function expect<Target>(target: Target) {
        const instance = new Expect<Target, Matcher>(target);

        return new Proxy(instance, {
            get(target, prop: string | symbol, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                if (customMatchers[prop as string]) {
                    return (...expected: any[]) => {
                        const matcher = customMatchers[prop as string] as MatcherFn<Target>;

                        if (target.isPoll) {
                            const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
                            const { timeout, interval } = target.pollConfiguration;

                            return (async () => {
                                const start = Date.now();
                                while (true) {
                                    try {
                                        const received = await (target.received as () => Promise<any>)();
                                        const { pass, message } = await matcher.call({ ...target, received }, ...expected);
                                        if (target.isNot !== pass) {
                                            return;
                                        }
                                        if (Date.now() - start >= timeout) {
                                            throw new target.Error(message);
                                        }
                                    } catch (err) {
                                        if (Date.now() - start >= timeout) {
                                            throw err;
                                        }
                                    }
                                    await sleep(interval);
                                }
                            })();
                        }

                        const result = matcher.call(target, ...expected);
                        if (result instanceof Promise) {
                            return result.then(({ pass, message }) => {
                                if (target.isNot === pass) throw new target.Error(message);
                            });
                        } else {
                            const { pass, message } = result;
                            if (target.isNot === pass) throw new target.Error(message);
                        }
                    };
                }
                return undefined;
            },
        }) as Expect<Target, Matcher> & {
            [Key in keyof Matcher]: Matcher[Key] extends MatcherFn<Target, infer Args>
                ? (...expected: Args) =>
                    ReturnType<Matcher[Key]> extends Promise<any>
                        ? Promise<Expect<Target, Matcher>>
                        : Expect<Target, Matcher>
                : never;
        };
    }

    expect.extend = function <NewMatcher extends MatcherMap>(matchers: NewMatcher) {
        Object.assign(customMatchers, matchers);
        return createExpect<Matcher & NewMatcher>();
    };

    return expect;
}

export const expect = createExpect();
