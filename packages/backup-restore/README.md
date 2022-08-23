# Firestore Dump

Utilities for dumping and restoring organization data from an Eisbuk firestore instance. This package is a light CLI wrapper around another lib [`firestore-backup-restore`](https://github.com/dalenguyen/firestore-backup-restore).

### CLI Tool

1. Make sure all dependencies are installed and workspaces packages are built by running `rush update` and `rush build`
2. Run `rushx build-link` to build the package and link the executable globally
3. Run `db-dump` and the following instructions should appear:

```
Usage: cli [options] [command]

Options:
  -h, --help                    display help for command

Commands:
  projects:list                 List project IDs of available firebase credentials
  projects:add <filePath>       Save a projects service account JSON
  projects:remove <projectId>   Remove a projects service account JSON
  backup [options] [orgId]      Backup organization(s) to JSON in the current working directory.
  restore [options] <filePath>  Restore an organizations data from a JSON file.
  help [command]                display help for command
```

4. Store a set of project credentials ([Firebase Service Account JSON](https://firebase.google.com/docs/admin/setup)) by running `db-dump projects:add <pathToProjectServiceAccountJson>`
5. Run `db-dump backup -p <projectid> [orgId]` to export data from production, or add the "use emulator" flag `-e` to export it from an emulator instance.

#### Commands

**Projects**

1. Add/Remove [Firebase Service Account JSON](https://firebase.google.com/docs/admin/setup) from the CLI App Data
2. A list of `projectId`s of stored credential can be checked with `projects:list`
3. A valid `projectId` is a required option for both `backup` and `restore` actions => make sure to store a set of credentials before running either. The service accounts `project_id` key is then used to reference the credential set when running `backup | restore -p <project_id>`

**Backup**
Dumps organization data to an `orgId.json` file in the current working directory. If an `orgId` is not provided, all organizations within the project will be dumped. Each organizations JSON will be structured so that root document data will be accessible via field-name keys, while sub-collection data will be accessible via the "subCollection" key. Subcollection keys are determined by the document path, e.g `organizations/{organization}/bookings/{bookingsCustomer}/bookedSlots/{bookingEntry}`. See [tests in firestore-backup-restore](https://github.com/dalenguyen/firestore-backup-restore/blob/dev/test/firestore.spec.ts) for more details. This structure will be repeated for documents that are retrieved at all levels.

```
{
  "admins": [] // Root document data
  "subCollection": {
    "organizations/localhost/attendance": {
      "0r1geAupnQAxZCouhbmH": {
        "date": "2022-08-15",
        "attendances": {}
      },
      ...
    },
    "organizations/localhost/bookings": {
      "116d906d-467c-493e-ab00-92732f9e6177": {
        "deleted": false,
        "surname": "Ambrosio",
        "name": "Apollinare",
        "id": "d39f3703-d778-45c2-b766-27e21d8f9691",
        "category": "pre-competitive-minors"
        "subCollection: {
          ...
        }
    },
    ...
  }
}
```

**Restore**
Restores organization data from JSON. Each JSON should conform to the structure described above in "Backup". The organiations ID will be determined / set from the file name. It's also important to be aware that subCollection keys (`organizations/localhost/bookings`) will determine the path of the newly written document. If you want to, for example, migrate "localhost" to "newOrg", you would have to update the name of the exported file to "newOrg.json" AND change all subCollection keys in the JSON to `organizations/newOrg/bookings`
