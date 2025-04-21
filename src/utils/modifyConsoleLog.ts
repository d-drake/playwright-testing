export const addTimestampToConsoleLog = () => {
  const originalConsoleLog = console.log;

  console.log = function (message) {
    const timestamp = new Date().toISOString();
    originalConsoleLog(`[${timestamp}] ${message}`);
  };
};
