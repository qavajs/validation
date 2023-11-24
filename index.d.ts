import { getValidation, getPollValidation, verify, validationRegexp } from './src/verify';

declare module '@qavajs/validation' {
    export { verify, getValidation, getPollValidation, validationRegexp }
}
