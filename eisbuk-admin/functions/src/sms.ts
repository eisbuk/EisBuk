import https from "https";
import { TextEncoder } from "util";

const sendSMS = () => {
  const token = process.env["GATEWAYAPI_TOKEN"];

  const req = https.request(
    {
      hostname: `gatewayapi.com`,
      path: `/rest/mtsms/?token=${token}`,
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    (res) => {
      res.on("data", (d) => {
        process.stdout.write(d);
      });

      res.on("error", (err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
    }
  );

  const data = new TextEncoder().encode(
    JSON.stringify({
      message: "Hello world",
      sender: "IgorIceTeam",
      recipients: [{ msisdn: "+385998653414" }],
    })
  );

  req.write(data);
  req.end();
};

sendSMS();
