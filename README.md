# @qavajs/validation

A validation library for test automation that provides two interfaces:

- **Natural language transformer** — converts human-readable sentences like `"should deeply equal"` into executable validation functions, designed for BDD/Cucumber steps
- **Standalone `expect()` API** — a chainable, extensible assertion library with built-in matchers, negation, soft assertions, and polling

## Installation

```bash
npm install @qavajs/validation
```

## Natural Language Validation

### `getValidation(description, options?)`

Parses a plain English validation description and returns a `(received, expected) => void` function.

```typescript
import { getValidation } from '@qavajs/validation';

const validate = getValidation('to equal');
validate(1, 1);   // passes
validate(1, 2);   // throws AssertionError: [AssertionError] expected 1 to equal 2

// Negation
const notEqual = getValidation('not to equal');
notEqual(1, 2);   // passes

// Soft assertion (throws SoftAssertionError instead of AssertionError)
const softValidate = getValidation('to equal', { soft: true });
```

#### Accepted phrase patterns

```
[is|do|does|to] [not|to not] [to] [be] [softly] <validation>
```

Examples: `"equal"`, `"is equal"`, `"does not equal"`, `"to softly contain"`, `"is not deeply equal"`

### `getPollValidation(description, options?)`

Like `getValidation`, but returns an async function that retries until the assertion passes or the timeout is exceeded.

```typescript
import { getPollValidation } from '@qavajs/validation';

const pollEqual = getPollValidation('to equal');

// received must be a function returning a value or Promise
await pollEqual(() => fetchStatus(), 'ready', { timeout: 5000, interval: 500 });
```

### `poll(fn, options?)`

Generic polling helper — retries `fn` until it resolves without throwing.

```typescript
import { poll } from '@qavajs/validation';

await poll(async () => {
    const status = await getStatus();
    if (status !== 'ready') throw new Error('Not ready yet');
}, { timeout: 10000, interval: 500 });
```

### `validationRegexp`

A `RegExp` that matches any supported validation phrase within a larger string. Useful for building Cucumber step definitions.

```typescript
import { validationRegexp } from '@qavajs/validation';

// Example step pattern:
// /^value {validationRegexp} {string}$/
```

---

## Standalone `expect()` API

```typescript
import { expect } from '@qavajs/validation';
```

### Equality & Comparison

| Matcher | Description |
|---|---|
| `.toSimpleEqual(expected)` | Non-strict equality (`==`) |
| `.toEqual(expected)` | Strict equality using `Object.is` |
| `.toBe(expected)` | Strict equality using `Object.is` |
| `.toStrictEqual(expected)` | Strict equality (`===`) |
| `.toDeepEqual(expected)` | Deep equality, array order-insensitive |
| `.toDeepStrictEqual(expected)` | Deep equality via `util.isDeepStrictEqual`, order-sensitive |
| `.toCaseInsensitiveEqual(expected)` | Lowercased string comparison |
| `.toBeGreaterThan(expected)` | `received > expected` |
| `.toBeGreaterThanOrEqual(expected)` | `received >= expected` |
| `.toBeLessThan(expected)` | `received < expected` |
| `.toBeLessThanOrEqual(expected)` | `received <= expected` |

### Containment & Membership

| Matcher | Description |
|---|---|
| `.toContain(expected)` | String includes substring, or array includes element |
| `.toMatch(expected)` | String matches `RegExp` or includes substring |
| `.toHaveMembers(expected)` | Array has exactly the same members (order-insensitive) |
| `.toIncludeMembers(expected)` | Array is a superset of expected members |
| `.toHaveProperty(key, value?)` | Object has property; optionally checks value |
| `.toHaveLength(expected)` | Array or string has given length |

### Type Checks

| Matcher | Description |
|---|---|
| `.toHaveType(expected)` | `typeof received === expected`; also accepts `'array'` |
| `.toBeNull()` | `received === null` |
| `.toBeUndefined()` | `received === undefined` |
| `.toBeNaN()` | `Number.isNaN(received)` |
| `.toBeTruthy()` | `!!received` |

### Schema & Predicate

| Matcher | Description |
|---|---|
| `.toMatchSchema(schema)` | Validates against a JSON Schema using [ajv](https://ajv.js.org/) |
| `.toSatisfy(fn)` | Passes if `fn(received)` returns `true` |

### Functions & Promises

| Matcher | Description |
|---|---|
| `.toThrow(expected?)` | Function throws; optionally matches error message |
| `.toPass()` | Async function resolves without throwing |
| `.toResolveWith(expected)` | Promise resolves with expected value |
| `.toRejectWith(expected)` | Promise rejects with a message containing expected string |

### Negation — `.not`

Negate any matcher with `.not`:

```typescript
expect(2).not.toEqual(1);
expect('hello').not.toContain('xyz');
expect([1, 2]).not.toHaveMembers([3, 4]);
```

### Soft Assertions — `.soft`

Soft assertions throw `SoftAssertionError` instead of `AssertionError`. Useful when you want to distinguish blocking vs non-blocking failures.

```typescript
expect(value).soft.toEqual(expected);
expect(value).soft.not.toContain('bad');
```

### Polling — `.poll(options?)`

Wrap a function with `.poll()` to retry the assertion until it passes or times out. The received value must be a function.

```typescript
// Retries every 100ms for up to 5 seconds (defaults)
await expect(() => getValue()).poll().toEqual('ready');

// Custom timeout and interval
await expect(() => fetchStatus()).poll({ timeout: 10000, interval: 500 }).toEqual('done');
```

### `.configure(options)`

Apply multiple options at once. Useful for dynamically building assertions.

```typescript
expect(value).configure({
    not: true,       // negate
    soft: true,      // use SoftAssertionError
    poll: true,      // enable polling
    timeout: 5000,   // poll timeout in ms
    interval: 100    // poll interval in ms
});
```

---

## Custom Matchers

Extend `expect` with your own matchers using `.extend()`. Each matcher is a function with `this` typed as `MatcherContext` and must return `{ pass: boolean, message: string }`.

```typescript
import { expect } from '@qavajs/validation';

const customExpect = expect.extend({
    toBeEven(this, expected) {
        const pass = this.received % 2 === 0;
        const message = this.formatMessage(this.received, expected, 'to be even', this.isNot);
        return { pass, message };
    }
});

customExpect(4).toBeEven();
customExpect(3).not.toBeEven();
```

All built-in modifiers (`.not`, `.soft`, `.poll`) work automatically with custom matchers.

---

## Error Types

| Class | Extends | When thrown |
|---|---|---|
| `AssertionError` | Node.js `AssertionError` | Standard assertion failure |
| `SoftAssertionError` | `AssertionError` | Soft assertion failure (`.soft`) |

Error messages follow the format:

```
[AssertionError] expected 1 not to equal 1
[SoftAssertionError] expected 'hello' to contain 'xyz'
```

---

## Supported Natural Language Validations

All keywords can be combined with negation (`not`, `does not`, `is not`, `to not`) and the `softly` modifier.

| Keyword | Equivalent matcher |
|---|---|
| `equal` | `.toSimpleEqual()` (non-strict `==`) |
| `strictly equal` | `.toEqual()` (`Object.is`) |
| `deeply equal` | `.toDeepEqual()` (order-insensitive) |
| `deeply strictly equal` | `.toDeepStrictEqual()` (`util.isDeepStrictEqual`) |
| `case insensitive equal` | `.toCaseInsensitiveEqual()` |
| `contain` | `.toContain()` |
| `match` | `.toMatch()` |
| `have member` | `.toHaveMembers()` |
| `include member` | `.toIncludeMembers()` |
| `have property` | `.toHaveProperty()` |
| `above` / `greater than` | `.toBeGreaterThan()` |
| `below` / `less than` | `.toBeLessThan()` |
| `have type` | `.toHaveType()` |
| `match schema` | `.toMatchSchema()` |
| `satisfy` | `.toSatisfy()` |

---

## Running Tests

```bash
npm test
```

---

## License

MIT