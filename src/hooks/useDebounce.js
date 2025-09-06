import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Debounce any changing value. Returns a value that only updates
 * after `delay` ms have elapsed without further changes.
 *
 * @template T
 * @param {T} value
 * @param {number} [delay=500]
 * @param {{ equalityFn?: (a: T, b: T) => boolean }} [options]
 * @returns {T}
 */
export default function useDebounce(value, delay = 500, options = {}) {
    const { equalityFn } = options;
    const [debounced, setDebounced] = useState(value);
    const lastValueRef = useRef(value);
    const timerRef = useRef(/** @type {number|undefined} */(undefined));

    useEffect(() => {
        const equal =
            typeof equalityFn === "function"
                ? equalityFn(value, lastValueRef.current)
                : Object.is(value, lastValueRef.current);

        if (equal) return; // nothing meaningful changed

        if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            lastValueRef.current = value;
            setDebounced(value);
        }, Math.max(0, delay));

        return () => {
            if (timerRef.current !== undefined) {
                window.clearTimeout(timerRef.current);
                timerRef.current = undefined;
            }
        };
    }, [value, delay, equalityFn]);

    // If delay is 0, reflect changes immediately.
    useEffect(() => {
        if (delay === 0) {
            lastValueRef.current = value;
            setDebounced(value);
        }
    }, [delay, value]);

    return debounced;
}

/**
 * Debounce a callback function. Returns a stable debounced function plus
 * `cancel` and `flush` helpers.
 *
 * @param {(…args:any[]) => void} fn
 * @param {number} [delay=500]
 * @returns {{ callback: (...args:any[]) => void, cancel: () => void, flush: () => void }}
 */
export function useDebouncedCallback(fn, delay = 500) {
    const fnRef = useRef(fn);
    const timerRef = useRef(/** @type {number|undefined} */(undefined));

    useEffect(() => {
        fnRef.current = fn;
    }, [fn]);

    const cancel = useCallback(() => {
        if (timerRef.current !== undefined) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
    }, []);

    const flush = useCallback(() => {
        if (timerRef.current !== undefined) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
            fnRef.current();
        }
    }, []);

    const callback = useCallback(
        (...args) => {
            cancel();
            timerRef.current = window.setTimeout(() => {
                timerRef.current = undefined;
                fnRef.current(...args);
            }, Math.max(0, delay));
        },
        [cancel, delay]
    );

    useEffect(() => cancel, [cancel]);

    return { callback, cancel, flush };
}
