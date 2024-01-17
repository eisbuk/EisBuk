export const shortName = (name: string, surname: string) => {
  const nameWords = name.trim().split(" ");
  const surnameWords = surname.trim().split(" ");

  const n = nameWords
    .map((word, i) => (i === 0 ? word : `${word[0]}.`))
    .join(" ");

  const sn = surnameWords
    .map((word, i, o) =>
      i === o.length - 1
        ? word
        : surnameParticles.includes(word.toLowerCase())
        ? word
        : `${word[0]}.`
    )
    .join(" ");

  return [n, sn];
};

/**
 * Returns string passed as prop with capitalized first letter.
 * If separated by "-" symbol, returns every word capitalized.
 * @param str
 * @returns
 */
export const capitalizeFirst = (str: string): string => {
  const words = str.split("-");

  // if last recursive node, return processed string
  if (words.length === 1) {
    const word = words[0];
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  }

  // if multi word, process all of the words
  return words.map((word) => capitalizeFirst(word)).join("-");
};

const surnameParticles = [
  "de",
  "di",
  "von",
  "van",
  "del",
  "della",
  "des",
  "du",
  "el",
  "la",
  "le",
  "los",
  "las",
  "der",
  "den",
  "het",
  "ten",
  "ter",
  "op",
  "of",
  "zu",
  "zum",
  "zur",
  "do",
  "dos",
  "da",
  "das",
  "dem",
  "d",
  "l",
  "o",
  "y",
  "e",
  "i",
  "san",
  "saint",
  "st",
  "s",
  "al",
  "bin",
  "ibn",
  "ben",
  "bar",
  "bat",
  "abd",
  "ap",
  "ab",
  "af",
  "mac",
  "mc",
  "m",
  "v",
  "ve",
  "vel",
  "dal",
  "dell",
  "dello",
  "dela",
  "degli",
  "delle",
];
