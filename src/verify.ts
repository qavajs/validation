import { expect, Assertion } from 'chai';

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
  INCLUDE_MEMBERS: 'include member'
};

const isClause = '(?:is |do |does |to )?';
const notClause = '(?<reverse>not |to not )?';
const toBeClause = '(?:to )?(?:be )?';
const validationClause = `(?:(?<validation>${Object.values(validations).join('|')})(?:s|es)?)`;

export const validationExtractRegexp = new RegExp(`^${isClause}${notClause}${toBeClause}${validationClause}$`);
export const validationRegexp = new RegExp(`(${isClause}${notClause}${toBeClause}${validationClause})`);

type VerifyInput = {
  AR: any;
  ER: any;
  validation: string;
  reverse: boolean;
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
};

/**
 * Basic verification function
 * @param {VerifyInput} object with all needed data for validation
 */
export function verify({ AR, ER, validation, reverse }: VerifyInput): void | Error {
  const expectClause = reverse ? expect(AR).to.not : expect(AR).to;
  const validate = validationFns[validation];
  validate(expectClause, ER);
}

export function getValidation(validationType: string): Function {
  const match = validationType.match(validationExtractRegexp) as RegExpMatchArray;
  if (!match) throw new Error(`validation '${validationType}' is not supported`);
  const { reverse, validation } = match.groups as {[p: string]: string};
  return function (AR: any, ER: any) {
    verify({ AR, ER, validation, reverse: Boolean(reverse) });
  };
}

function toNumber(n: any): number {
  const parsedNumber = parseFloat(n);
  if (Number.isNaN(parsedNumber)) {
    throw new Error(`${n} is not a number`);
  }
  return parsedNumber
}

function toRegexp(r: string | RegExp): RegExp {
  return r instanceof RegExp ? r : new RegExp(r)
}
