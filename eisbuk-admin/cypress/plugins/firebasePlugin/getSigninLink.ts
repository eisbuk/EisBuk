import http from "http";
import { StringDecoder } from "string_decoder";
import { TaskHandler } from "./types";

interface GetSigninLinkPayload {
  projectId: string;
  email: string;
}

interface ResPayload {
  oobCodes: {
    email: string;
    requestType: string;
    oobCode: string;
    oobLink: string;
  }[];
}

const handleGetSigninLink: TaskHandler<GetSigninLinkPayload, string> = async ({
  projectId,
  email: requestEmail,
}) => {
  const reqOptions: Partial<http.RequestOptions> = {
    hostname: "localhost",
    path: `/emulator/v1/projects/${projectId}/oobCodes`,
    port: 9099,
  };

  const res = await sendHttp<ResPayload>(reqOptions);

  const oobCode = res.oobCodes
    // search from end to front (to find the latest code)
    .reverse()
    .find(
      ({ email, requestType }) =>
        email === requestEmail && requestType === "EMAIL_SIGNIN"
    ).oobCode;

  // normally, the signin link would go to auth emulator (port 9099) and redirected back to the dev server (port 3000)
  // cypress (browser actually), however, doesn't allow switching origin in the test, so we're manually constructing a login link
  // going directoy to dev server
  const signInLink = `http://localhost:3000/login?mode=signIn&lang=en&oobCode=${oobCode}&apiKey=fake-api-key`;

  return signInLink;
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

export default handleGetSigninLink;
