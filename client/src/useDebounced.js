import { useEffect, useRef } from 'react';

/** Returns a function that runs `fn` once the user pauses typing for `ms`. */
export function useDebounced(fn, ms = 600) {
  const timer = useRef();
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => () => clearTimeout(timer.current), []);
  return (...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => latest.current(...args), ms);
  };
}
