# Change Log

All notable changes to the "@qavajs/validation" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

:rocket: - new feature

:beetle: - bugfix

:x: - deprecation/removal

:pencil: - chore

## [1.4.2]
- :beetle: fixed deep equal to ignore array sort

## [1.4.1]
- :beetle: fixed huge declaration file

## [1.4.0]
- :rocket: dropped chai dependency in favor of own `expect` implementation

## [1.3.0]
- :rocket: added `to satisfy` validation to verify user-defined expectation provided as predicate
```Gherkin
Then I expect '$value' to satisfy '$either(1, 2)'
```
where `$either` is a function
```typescript
function either(...expected) {
    return function (actual) {
        return expected.includes(actual)
    }
}
```

## [1.2.1]
- :rocket: added capability to pass `softly` prefix and throw `SoftAssertionError`

## [1.2.0]
- :rocket: added capability to pass `soft` flag and throw `SoftAssertionError`

## [1.1.1]
- :rocket: added capability to pass _to_ suffix (e.g _equal to_)

## [1.1.0]
- :rocket: added source maps

## [1.0.0]
- :rocket: improved error message if poll promise is not resolved in time

## [0.10.]0
- :rocket: added _poll_ function to perform generic validation

## [0.9.0]
- :rocket: improved ajv report

## [0.8.0]
- :pencil: update dependencies

## [0.7.1]
- :beetle: fixed pollValidation dts
- :beetle: introduced default poll error
- :beetle: clear interval on fail validation

## [0.7.0]
- :rocket: added _case insensitive equal_ validation
- :rocket: added poll validation

## [0.6.0]
- :rocket: added prefix to enable displaying error message

## [0.0.5]
- :rocket: added _match schema_ validation

## [0.0.4]
- :rocket: added _have property_ validation
