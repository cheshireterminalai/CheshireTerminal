/// <reference types="jest" />

declare namespace jest {
    interface Matchers<R> {
        toBeWithinRange(floor: number, ceiling: number): R;
    }
}

declare module '@types/jest' {
    interface Matchers<R> {
        toBeWithinRange(floor: number, ceiling: number): R;
    }
}

declare module 'jest' {
    interface Matchers<R> {
        toBeWithinRange(floor: number, ceiling: number): R;
    }
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWithinRange(floor: number, ceiling: number): R;
        }
    }
}

// Mock types
interface MockInstance<T extends (...args: any) => any> extends jest.Mock<ReturnType<T>, Parameters<T>> {
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
    mockImplementation(fn: T): this;
    mockImplementationOnce(fn: T): this;
    mockReturnThis(): this;
    mockReturnValue(value: ReturnType<T>): this;
    mockReturnValueOnce(value: ReturnType<T>): this;
    mockResolvedValue<U extends ReturnType<T>>(value: U extends Promise<infer V> ? V : never): this;
    mockResolvedValueOnce<U extends ReturnType<T>>(value: U extends Promise<infer V> ? V : never): this;
    mockRejectedValue(value: any): this;
    mockRejectedValueOnce(value: any): this;
}

declare global {
    interface Window {
        solana: any;
    }

    namespace NodeJS {
        interface Global {
            WebSocket: any;
            console: {
                log: jest.Mock;
                info: jest.Mock;
                debug: jest.Mock;
                warn: jest.Mock;
                error: jest.Mock;
            };
        }
    }
}

// Extend expect
declare global {
    namespace jest {
        interface Expect {
            toBeWithinRange(floor: number, ceiling: number): any;
        }
    }
}

export {};
