
const API_URL = "https://script.google.com/macros/s/AKfycbzhEoB__-jbA7yWFS50tSzADpPduMKtiso3Rirq8rDdAycAo9s63Xe2FiLgW4UtGQ9A-Q/exec";

export function api(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "assignMateCallback_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2);

    const query = new URLSearchParams({
      action,
      ...params,
      callback: callbackName,
    });

    const script = document.createElement("script");
    script.src = `${API_URL}?${query.toString()}`;
    script.async = true;

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("API timed out. Check your deployment URL."));
    }, 20000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (data) => {
      cleanup();
      if (data?.success) {
        resolve(data);
      } else {
        reject(new Error(data?.error || "API request failed."));
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not connect to Apps Script."));
    };

    document.head.appendChild(script);
  });
}
