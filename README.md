# @qavajs/validation

A `@qavajs` library for validating data using plain English definitions. This package simplifies the process of creating validation functions by translating human-readable sentences into executable code.

## Installation

You can install the library using `npm`:

```bash
npm install @qavajs/validation
```

## Supported Validations

This library supports a variety of validation types, which can all be negated by adding the word `not`.

### Equality & Comparison

  - **`equal`**: Checks for non-strict equality (`==`).
  - **`strictly equal`**: Checks for strict equality (`===`).
  - **`deeply equal`**: Performs a deep comparison of object properties or array elements.
  - **`case insensitive equal`**: Compares two values for non-strict equality after converting them to lowercase.
  - **`contain`**: Verifies if a string contains a specific substring.
  - **`include members`**: Checks if an array or object includes a specific set of members.
  - **`have members`**: Validates if an array or object has an exact match of a specified set of members.
  - **`have property`**: Ensures an object has a particular property.
  - **`above`** / **`greater than`**: Checks if a value is greater than another.
  - **`below`** / **`less than`**: Checks if a value is less than another.
  - **`match`**: Validates if a string matches a regular expression.
  - **`have type`**: Checks the type of a variable (e.g., `string`, `number`, `boolean`).
  - **`match schema`**: Validates data against an [ajv](https://www.npmjs.com/package/ajv) schema, which is useful for complex object validation.

## Test

To run the test suite for this package, use the following command:

```bash
npm run test
```

## License

This project is licensed under the MIT License.
