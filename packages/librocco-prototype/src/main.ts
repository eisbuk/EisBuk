import App from './App.svelte'

import PouchDB from 'pouchdb';
window.pouch_db = new PouchDB('http://localhost:5984/kittens');

pouch_db.info().then(function (info) {
    console.log(info);
  })

  var doc = {
    "_id": "mittens",
    "name": "Mittens",
    "occupation": "kitten",
    "age": 3,
    "hobbies": [
      "playing with balls of yarn",
      "chasing laser pointers",
      "lookin' hella cute"
    ]
};
pouch_db.put(doc);
const app = new App({
  target: document.getElementById('app')
})
console.log(app);
export default app

