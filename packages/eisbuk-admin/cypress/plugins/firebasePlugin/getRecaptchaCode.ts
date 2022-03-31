import http from "http";
import { StringDecoder } from "string_decoder";
import { TaskHandler } from "./types";

interface GetRecaptchaPayload {
  projectId: string;
  phone: string;
}

interface ResPayload {
  verificationCodes: {
    code: string;
    phoneNumber: string;
    sessionInfo: string;
  }[];
}

const handleGetRecaptchaCode: TaskHandler<GetRecaptchaPayload, string> =
  async ({ projectId, phone }) => {
    const reqOptions: Partial<http.RequestOptions> = {
      hostname: "localhost",
      path: `/emulator/v1/projects/${projectId}/verificationCodes`,
      port: 9099,
    };

    const res = await sendHttp<ResPayload>(reqOptions);

    return (
      res.verificationCodes
        // search from end to front (to find the latest code)
        .reverse()
        .find(({ phoneNumber }) => phoneNumber === phone).code
    );
  };

const sendHttp = <R extends Record<string, any>>(
  options: http.RequestOptions
): Promise<R> =>
  new Promise((resolve, reject) => {
    http
      .request(options, (res) => {
        const decoder = new StringDecoder("utf-8");
        let rs = "";

        res.on("error", (err) => {
          return reject(err);
        });
        res.on("data", (chunk) => (rs += decoder.write(chunk)));
        res.on("end", () => {
          rs += decoder.end();
          const rBody: R = JSON.parse(rs);
          return resolve(rBody);
        });
      })
      .end();
  });

export default handleGetRecaptchaCode;
