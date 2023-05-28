const __isCI__ = process.env.CI;

/**
 * A test helper, runs the callback with 50 ms interval until the assertion is fulfilled or it times out.
 * If it times out, it rejects with the latest error.
 * @param {Function} cb The callback to run (this would normally hold assertions)
 * @param {number} [timeout] The timeout in ms - default is 8000 as our test timeout is 10000 and we assume that most of the
 * assertions will be fulfilled within the remaining 2 seconds, leaving us room for the problematic ones to wait a bit longer,
 * whilst still failing within the test timeout constraints (in order to provide the helpful error message, rather than a test timeout error).
 */
export const waitFor = <CB extends () => any>(
  cb: CB,
  // The CI machine tends to be slower than the local ones, so we're allowing for more breathing room
  timeout = __isCI__ ? 13000 : 8000
) => {
  return new Promise<ReturnType<CB>>((resolve, reject) => {
    let error: any = null;

    // Retry the assertion every 50ms
    const interval = setInterval(() => {
      // Run callback as a promise (this way we're able to .then/.catch regardless of the 'cb' being sync or async)
      (async () => cb())()
        .then((res) => {
          if (interval) {
            clearInterval(interval);
          }
          return resolve(res);
        })
        .catch((err) => {
          // Store the error to reject with later (if timed out)
          error = err;
        });
    }, 50);

    // When timed out, reject with the latest error
    setTimeout(() => {
      clearInterval(interval);
      reject(error);
    }, timeout);
  });
};
