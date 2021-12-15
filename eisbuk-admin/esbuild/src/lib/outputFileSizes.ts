import fs from "fs";
import path from "path";

/**
 * Scans the outdir and lists all files and their size.
 */
export default async (dirpath: string): Promise<void> => {
  console.log("");
  console.log("File sizes after bundle finished:");
  console.log("");

  const { fileSizes, maxWidth } = await new Promise<{
    maxWidth: number;
    fileSizes: [number, string][];
  }>((res) =>
    fs.readdir(dirpath, async (err, fNames) => {
      if (err) throw err;

      // max width of the file size string
      // (used later to format all size outputs to the same length)
      let maxWidth = 12;

      const fileSizes = await Promise.all(
        fNames.map(async (fName) => {
          const fullPath = path.join(dirpath, fName);

          const sz = await new Promise<number>((res) =>
            fs.stat(fullPath, (_, { size }) => res(size))
          );

          // the length of the size converted to string
          // +1 character for decimal separator
          // +1 character for space after the number
          // +2 characters for "KB"
          // +4 spaces between size and the filename
          const szStrlen = sz.toString().length + 8;
          if (szStrlen > maxWidth) maxWidth = szStrlen;

          return [sz, fName] as [number, string];
        })
      );
      res({ maxWidth, fileSizes });
    })
  );

  // format and print output
  fileSizes.forEach(([sz, fPath]) => {
    const relPath = path.relative(process.cwd(), fPath);

    const kb = Math.floor(sz / 1000);
    const b = Math.floor(sz % 1000);
    const szStr = `${kb}.${b} KB`;
    const wsLen = maxWidth - szStr.length;
    const space = " ".repeat(wsLen);

    console.log(`${szStr}${space}${relPath}`);
  });

  console.log("");
};
