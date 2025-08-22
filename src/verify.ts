import { expect, Assertion, AssertionError } from 'chai';
import Ajv from 'ajv'

export class SoftAssertionError extends AssertionError {
  name = 'SoftAssertionError';
}

Assertion.addMethod('notStrictEqual', function (ER) {
  const obj = this._obj;

  this.assert(
      obj == ER,
      'expected #{this} to equal #{exp}',
      'expected #{this} to not equal #{exp}',
      ER,
      obj
 );
});

Assertion.addMethod('caseInsensitiveEqual', function (ER) {
  const obj = this._obj;

  this.assert(
      obj.toLowerCase() == ER.toLowerCase(),
      'expected #{this} to equal #{exp}',
      'expected #{this} to not equal #{exp}',
      ER,
      obj
  );
});

Assertion.addMethod('matchSchema', function (schema) {
  const obj = this._obj;
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  const isValid = validate(obj);
  const messages = validate.errors
      ? validate.errors?.map(err => `${err.instancePath} ${err.message} (${err.schemaPath})`)
      : [];
  const errors = [
    'object does not match schema',
    ...messages
  ].join('\n');
  this.assert(
      isValid,
      errors,
      'expected #{this} to not match schema #{exp}',
      '',
      ''
  );
});

Assertion.addMethod('satisfy', function (predicate: (arg: any) => boolean) {
  const actual = this._obj;

  this.assert(
      predicate(actual),
      'expected #{this} to satisfy #{exp}',
      'expected #{this} to not satisfy #{exp}',
      predicate.toString(),
      actual
  );
});

export const validations = {
  EQUAL: 'equal',
  DEEPLY_EQUAL: 'deeply equal',
  STRICTLY_EQUAL: 'strictly equal',
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
  AR: any;
  ER: any;
  validation: string;
  reverse: boolean;
  soft: boolean;
};

const aboveFn = (expectClause: any, ER: any) => expectClause.above(toNumber(ER));
const belowFn = (expectClause: any, ER: any) => expectClause.below(toNumber(ER));
const validationFns = {
  [validations.EQUAL]: (expectClause: any, ER: any) => expectClause.notStrictEqual(ER),
  [validations.STRICTLY_EQUAL]: (expectClause: any, ER: any) => expectClause.equal(ER),
  [validations.DEEPLY_EQUAL]: (expectClause: any, ER: any) => expectClause.eql(ER),
  [validations.HAVE_MEMBERS]: (expectClause: any, ER: any) => expectClause.have.members(ER),
  [validations.MATCH]: (expectClause: any, ER: any) => expectClause.match(toRegexp(ER)),
  [validations.CONTAIN]: (expectClause: any, ER: any) => expectClause.contain(ER),
  [validations.ABOVE]: aboveFn,
  [validations.BELOW]: belowFn,
  [validations.GREATER]: aboveFn,
  [validations.LESS]: belowFn,
  [validations.HAVE_TYPE]: (expectClause: any, ER: string) => expectClause.a(ER),
  [validations.INCLUDE_MEMBERS]: (expectClause: any, ER: string) => expectClause.include.members(ER),
  [validations.HAVE_PROPERTY]: (expectClause: any, ER: string) => expectClause.have.property(ER),
  [validations.MATCH_SCHEMA]: (expectClause: any, ER: string) => expectClause.matchSchema(ER),
  [validations.CASE_INSENSITIVE_EQUAL]: (expectClause: any, ER: any) => expectClause.caseInsensitiveEqual(ER),
  [validations.SATISFY]: (expectClause: any, ER: any) => expectClause.satisfy(ER),
};

/**
 * Basic verification function
 * @param {VerifyInput} object with all needed data for validation
 */
export function verify({ AR, ER, validation, reverse, soft }: VerifyInput): void {
  const prefix = 'Fail';
  const expectClause = reverse ? expect(AR, prefix).to.not : expect(AR, prefix).to;
  const validate = validationFns[validation];
  try {
    validate(expectClause, ER);
  } catch (err) {
    if (soft && err instanceof Error) throw new SoftAssertionError(err.message, { cause: err });
    throw err;
  }
}

export function getValidation(validationType: string, options?: { soft: boolean }): (AR: any, ER: any) => void {
  const match = validationExtractRegexp.exec(validationType);
  if (!match) throw new Error(`Validation '${validationType}' is not supported`);
  const { reverse, validation, soft } = match.groups as {[p: string]: string};
  const softProp = options?.soft || !!soft;
  return function (AR: any, ER: any) {
    verify({ AR, ER, validation, reverse: Boolean(reverse), soft: softProp });
  };
}

export function getPollValidation(validationType: string, options?: { soft: boolean }): (AR: any, ER: any, options?: { timeout?: number, interval?: number }) => Promise<unknown> {
  const match = validationExtractRegexp.exec(validationType);
  if (!match) throw new Error(`Poll validation '${validationType}' is not supported`);
  const { reverse, validation, soft } = match.groups as {[p: string]: string};
  const softProp = options?.soft || !!soft;
  return async function (AR: any, ER: any, options?: { timeout?: number, interval?: number }) {
    const timeout = options?.timeout ?? 5000;
    const interval = options?.interval ?? 500;
    let lastError: Error = new Error(`Promise was not settled before timeout`);
    let intervalId: NodeJS.Timeout;
    const evaluatePromise = new Promise<void>(resolve => {
      intervalId = setInterval(async () => {
        try {
          const actualValue = await AR();
          verify({
            AR: actualValue,
            ER,
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

function toNumber(n: any): number {
  const parsedNumber = parseFloat(n);
  if (Number.isNaN(parsedNumber)) {
    throw new Error(`${n} is not a number`);
  }
  return parsedNumber;
}

function toRegexp(r: string | RegExp): RegExp {
  return r instanceof RegExp ? r : new RegExp(r);
}
