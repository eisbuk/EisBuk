import App from './App.svelte'

import PouchDB from 'pouchdb';
import PouchdbQuickSearch from 'pouchdb-quick-search';

PouchDB.plugin(PouchdbQuickSearch);

const app = new App({
  target: document.getElementById('app')
})
console.log(app);
export default app

window.pouchDb = new PouchDB('http://localhost:5984/kittens');

const main = async function() {
  var res = await window.pouchDb.search({
    query: '',
    fields: ['title', 'description'],
    include_docs: true,
    highlighting: true
  });
}


main();
