import { getValidation, verify } from "./src/verify";

declare module '@qavajs/validation' {
    export { verify, getValidation }
}
