# @qavajs/validation

```
npm install @qavajs/validation
```

@qavajs library that transforms plain english definition to validation functions

Library supports following validations:
* equal - not strict equal (==)
* strictly equal - strict equal (===)
* deeply equal - deep equal (chai eql)
* contain - contain a substring
* match - match a regular expression
* above / greater than - greater than
* below / less than - less than
* have type - type validation
* have members - validation if array/object have exact members
* include members - validation if array/object includes members
* have property - have property validation
* match schema - match [ajv](https://www.npmjs.com/package/ajv) schema
* case insensitive equal - not strict equal (==) with casting to lower case 

All validations can be negated adding `not` word.

## Test

```
npm run test
```
