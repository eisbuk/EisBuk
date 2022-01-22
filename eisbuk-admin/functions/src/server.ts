/* eslint-disable no-console */
import http from "http";
import { StringDecoder } from "string_decoder";

const echoServer = http.createServer(async (req, res) => {
  const report: Record<string, any> = {};

  const urlString = req.url?.toString() || "";
  const [, rawParams] = urlString?.split("?") as [
    string,
    ...(string | undefined)[]
  ];

  console.log("Bump");

  const params = (rawParams?.split("&") || []).reduce((acc, param) => {
    const [key, value] = param.split("=");
    return { ...acc, [key]: value };
  }, {});

  report.url = urlString;
  report.params = params;
  report.method = req.method;
  report.headers = req.headers;

  res.setHeader("Content-Type", "application/json");

  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (d) => {
    buffer += decoder.write(d);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const reqData = JSON.parse(buffer);

    report.data = reqData;

    const data = JSON.stringify(report, null, 2);
    console.log(data);
    console.log();

    res.end(data);
  });
});

echoServer.listen(3000, "localhost", () => {
  console.log("Listening to port 3000 on localhost");
});
