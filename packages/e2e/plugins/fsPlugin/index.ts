import { rmdir } from "fs";

const fsPlugin = (on: Cypress.PluginEvents): void => {
  on("task", {
    deleteFolder(folderName) {
      console.log("deleting folder %s", folderName);

      return new Promise((resolve, reject) => {
        // eslint-disable-next-line consistent-return
        rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error(err);
            return reject(err);
          }
          resolve(null);
        });
      });
    },
  });
};

export default fsPlugin;
