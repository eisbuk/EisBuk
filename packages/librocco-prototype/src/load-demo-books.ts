#!/usr/bin/env -S deno run --allow-read --allow-net

import { CouchClient } from "https://denopkg.com/keroxp/deno-couchdb/couch.ts";

export type Book = {
  ISBN: string;
  title: string;
  author: string;
  year: string;
};

async function main() {
  // create couch client with endpoint
  const couch = new CouchClient("http://admin:admin@localhost:5984");
  // choose db to use
  const db = couch.database<Book>("books");
  // check if specified database exists
  if (!(await couch.databaseExists("books"))) {
    // create new database
    await couch.createDatabase("books");
    console.log("Created database 'books'")
  } else {
    console.log("Database 'books' already present")
  }
  const __dirname = new URL('.', import.meta.url).pathname;
  const text = await Deno.readTextFile(__dirname + "/testdata.json");

  const DATA = JSON.parse(text);
  console.log(DATA.response.books.length);


  // Loop over DATA.response.books
  for (let book of DATA.response.books) {
    const { id, rev } = await db.insert(book);
  }
}


await main();
