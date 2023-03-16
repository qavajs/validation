# @qavajs/validation

`npm install @qavajs/validation`

This is internal @qavajs library that helps to transform plain english definition to validation functions

Lib supports following validations
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

All validations can be negated adding _not_ word.

##Test

`npm run test`
