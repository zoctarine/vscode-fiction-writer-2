export interface RetryOptions {
    maxRetries: number;

}

/**
 * Defines the maximum allowable number of retry attempts.
 * This constant is used to limit the number of retry operations
 * to avoid potential infinite loops and ensure system stability.
 */
const RETRY_MAX_CAP = 10;

function getMaxRetries(opt: RetryOptions): number {
    return Math.min(opt.maxRetries, RETRY_MAX_CAP);
}

export function retry<T>(fn: (retryCount: number) => T | undefined, opt: RetryOptions = {maxRetries: 10}): T | undefined {
    const maxRetries = getMaxRetries(opt);
    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        const result = fn(retryCount);
        if (result !== undefined) {
            return result;
        }
    }
    return undefined;
}

export async function retryAsync<T>(fn: (retryCount: number) => Promise<T | undefined>, opt: RetryOptions = {maxRetries: 10}): Promise<T | undefined> {
    const maxRetries = getMaxRetries(opt);
    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        const result = await fn(retryCount);
        if (result !== undefined) {
            return result;
        }
    }
    return undefined;
}