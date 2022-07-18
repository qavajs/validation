import { getValidation, verify, validationRegexp } from './src/verify';

declare module '@qavajs/validation' {
    export { verify, getValidation, validationRegexp }
}
