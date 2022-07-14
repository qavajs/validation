import { expect } from 'chai';

export const validations = {
  EQUAL: 'equal',
  HAVE_MEMBERS: 'have member',
  MATCH: 'match',
  CONTAIN: 'contain',
  ABOVE: 'above',
  BELOW: 'below',
  GREATER: 'greater than',
  LESS: 'less than',
  HAVE_TYPE: 'have type',
};

const isClause = '(?:is |do |does |to )?';
const notClause = '(not |to not )?';
const toBeClause = '(?:to )?(?:be )?';
const validationClause = `(?:(${Object.values(validations).join('|')})(?:s|es)?)`;

export const validationExtractRegexp = new RegExp(`^${isClause}${notClause}${toBeClause}${validationClause}$`);
export const validationRegexp = new RegExp(`(${isClause}${notClause}${toBeClause}${validationClause})`);

type VerifyInput = {
  AR: any;
  ER: any;
  validation: string;
  reverse: boolean;
};

const aboveFn = (expectClause: any, ER: any) => expectClause.above(ER);
const belowFn = (expectClause: any, ER: any) => expectClause.below(ER);
const validationFns = {
  [validations.EQUAL]: (expectClause: any, ER: any) => expectClause.eql(ER),
  [validations.HAVE_MEMBERS]: (expectClause: any, ER: any) => expectClause.have.members(ER),
  [validations.MATCH]: (expectClause: any, ER: any) => expectClause.match(ER instanceof RegExp ? ER : new RegExp(ER)),
  [validations.CONTAIN]: (expectClause: any, ER: any) => expectClause.contain(ER),
  [validations.ABOVE]: aboveFn,
  [validations.BELOW]: belowFn,
  [validations.GREATER]: aboveFn,
  [validations.LESS]: belowFn,
  [validations.HAVE_TYPE]: (expectClause: any, ER: string) => expectClause.a(ER),
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
  const [_, reverse, validation] = match;
  return function (AR: any, ER: any) {
    verify({ AR, ER, validation, reverse: Boolean(reverse) });
  };
}
