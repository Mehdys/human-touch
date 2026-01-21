import { toast } from "sonner";

export enum ErrorType {
    NETWORK = "NETWORK",
    AUTH = "AUTH",
    VALIDATION = "VALIDATION",
    NOT_FOUND = "NOT_FOUND",
    SERVER = "SERVER",
    UNKNOWN = "UNKNOWN",
}

export interface AppError {
    type: ErrorType;
    message: string;
    originalError?: unknown;
    userMessage: string;
    shouldRetry: boolean;
}

/**
 * Classify an error and determine appropriate user messaging
 */
export function classifyError(error: unknown): AppError {
    // Network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
            type: ErrorType.NETWORK,
            message: "Network request failed",
            originalError: error,
            userMessage: "Network error. Please check your connection.",
            shouldRetry: true,
        };
    }

    // Supabase/API errors
    if (typeof error === "object" && error !== null) {
        const err = error as any;

        // Auth errors
        if (err.status === 401 || err.message?.toLowerCase().includes("auth") || err.message?.toLowerCase().includes("unauthorized")) {
            return {
                type: ErrorType.AUTH,
                message: err.message || "Authentication failed",
                originalError: error,
                userMessage: "Please sign in again.",
                shouldRetry: false,
            };
        }

        // Validation errors
        if (err.status === 400 || err.message?.includes("validation") || err.message?.includes("Invalid")) {
            return {
                type: ErrorType.VALIDATION,
                message: err.message || "Invalid input",
                originalError: error,
                userMessage: err.message || "Please check your input.",
                shouldRetry: false,
            };
        }

        // Not found
        if (err.status === 404) {
            return {
                type: ErrorType.NOT_FOUND,
                message: "Resource not found",
                originalError: error,
                userMessage: "The requested item was not found.",
                shouldRetry: false,
            };
        }

        // Server errors
        if (err.status >= 500) {
            return {
                type: ErrorType.SERVER,
                message: err.message || "Server error",
                originalError: error,
                userMessage: "Something went wrong on our end. Please try again later.",
                shouldRetry: true,
            };
        }
    }

    // Unknown errors
    return {
        type: ErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : "Unknown error",
        originalError: error,
        userMessage: "An unexpected error occurred.",
        shouldRetry: false,
    };
}

/**
 * Handle an error with consistent logging and user notification
 */
export function handleError(
    error: unknown,
    context: string,
    options?: {
        silent?: boolean;
        customMessage?: string;
        onRetry?: () => void;
    }
): AppError {
    const appError = classifyError(error);

    // Log for debugging
    console.error(`[${context}]`, {
        type: appError.type,
        message: appError.message,
        error: appError.originalError,
    });

    // Show toast unless silent
    if (!options?.silent) {
        const message = options?.customMessage || appError.userMessage;

        if (appError.shouldRetry && options?.onRetry) {
            toast.error(message, {
                action: {
                    label: "Retry",
                    onClick: options.onRetry,
                },
            });
        } else {
            toast.error(message);
        }
    }

    return appError;
}
