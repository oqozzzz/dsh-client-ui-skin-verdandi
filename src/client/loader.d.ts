/**
 * The dsh client loader wraps every client bundle in a `(require) => {}`
 * factory whose parameter is the platform module table's require — React is
 * served from it (never bundled, never installed here). In ESM test runs the
 * identifier simply does not exist and the `typeof` guard stays false.
 */
declare const require: ((id: string) => unknown) | undefined
