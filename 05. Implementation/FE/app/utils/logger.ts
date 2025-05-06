const log = (...args: any[]) => {
    if (__DEV__) console.log('[LOG]', ...args);
  };
  
  const warn = (...args: any[]) => {
    if (__DEV__) console.warn('[WARN]', ...args);
  };
  
  const error = (...args: any[]) => {
    if (__DEV__) {
      // Comment out this line if you want to suppress all errors
      // console.error('[ERROR]', ...args);
    }
  };
  
  export { log, warn, error };
  