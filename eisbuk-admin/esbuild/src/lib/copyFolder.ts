import fs from "fs";
import path from "path";

import { createLogger } from "./utils";

/**
 * Uses (async) `fs.copyFile` to copy the contents of `/public` folder
 * to the `/dist` folder, ready for deployment
 */
export default async (src: string, dist: string): Promise<void> => {
  const logger = createLogger("COPY_PUBLIC_FILES");

  logger.log(`Looking for public files in ${src}`);
  const pFiles = fs.readdirSync(src);
  logger.log("/public folder found");
  logger.log(`Copying public files to ${dist}`);

  // create a `/dist` folder if one doesn't already exist
  try {
    // convert `fs.mkdir` to promise to prevent race condition
    // with single file copy/paste flow
    await new Promise<void>((res) =>
      fs.mkdir(dist, () => {
        logger.log(`No ${dist} folder found, created new`);
        res();
      })
    );
  } catch (err) {
    logger.error(err);
  }

  // copy all files from `src` to `dist` folder
  await Promise.all(
    pFiles.map((fName) => {
      const pathToFile = path.join(src, fName);
      const distFilePath = path.join(dist, fName);

      // return promise resolved inside `fs.copyFile` callback
      // in order to be able to await on resolution
      return new Promise<void>((res) =>
        fs.copyFile(pathToFile, distFilePath, (err) => {
          if (err) throw err;
          logger.log(`Copied ${pathToFile} to '/dist' folder for deployment`);
          res();
        })
      );
    })
  );
};
