import http from "http";

/**
 * A convenience method used to create SMS request options.
 * Used purely for code readability
 * @param url
 * @param token
 * @returns
 */
export const createSMSReqOptions = (
  method: "GET" | "POST",
  url: string,
  token: string
): http.RequestOptions & { proto: "http" | "https" } => {
  let proto: "http" | "https" = "https";
  let hostname = "";
  let endpoint = "/";
  let portString = "";

  // check for protocol in url string (the fallback is https)
  if (/^https?:\/\//.test(url)) {
    [proto, hostname] = url.split("://") as ["http" | "https", string];
  } else {
    hostname = url;
  }

  // split hostname and endpoint from url
  const breakingPoint = hostname.indexOf("/");
  if (breakingPoint !== -1) {
    endpoint = hostname.slice(breakingPoint);
    hostname = hostname.slice(0, breakingPoint);
  }

  // check for port number
  if (hostname.includes(":")) {
    [hostname, portString] = hostname.split(":");
  }

  const port = Number(portString) || undefined;

  return {
    proto,
    hostname,
    path: [endpoint, `token=${token}`].join("?"),
    port,
    // a standard part of each SMS post request we're sending
    headers: { ["Content-Type"]: "application/json" },
    method,
  };
};
