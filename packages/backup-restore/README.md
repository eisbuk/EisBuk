# Firestore Dump

Utilities for dumping and restoring organization data from an Eisbuk firestore instance.

## Usage

The package can be leveraged in two contexts, either as:

1. A CLI tool that can be installed globally to manage multiple firestore projects
2. Scripts that can be integrated into Cloud Functions / Cron Jobs

### CLI Tool

1. Make sure all dependencies are installed and workspaces packages are built by running `rush update` and `rush build`
2. Run `rushx build-link` to build the package and link the executable globally
3. Run `firestore-dump` and the following instructions should appear:

```
Usage: cli [options] [command]

Options:
  -h, --help                    display help for command

Commands:
  config:get [options]
      Get config options using -o | --option <name>
      Options include:  'activeProject', 'useEmulators', 'emulatorHost'

  config:set [options] <value>
      Set config options using -o | --option <name> <value>
      Options include:  'activeProject', 'useEmulators', 'emulatorHost'

  projects:list                 List project IDs of available firebase credentials
  projects:add <filePath>       Save a projects service account JSON
  projects:remove <projectId>   Remove a projects service account JSON
  backup [orgId]                Backup organization(s) to JSON in the current working directory.
  restore <filePath>            Restore an organizations data from a JSON file.
  help [command]                display help for command
```

#### Commands

**Config**
Get/Set CLI tool config. The options and their defaults include:

1. `activeProject = null` => The active project ID. Determines which firestore instance `backup | restore` actions will be run against
2. `useEmulators = false` => Flag to redirect `backup | restore` actions to an emulator instance
3. `emulatorHost = "localhost:8080` => Determines the host of the emulator connection, incase it has been changed in e.g`firebase-testing.json`

**Projects**

1. Add/Remove [Firebase Service Account JSON](https://firebase.google.com/docs/admin/setup) from the CLI App Data.
2. The list of currently available credentials can be checked with `projects:list`
3. To set a projects credentials as active, use `firestore-dump config:set -o activeProject <projectId>`

**Backup**
Dumps organization data to JSON in the current working directory. If an `orgId` is not provided, all organizations within the project will be dumped. Each organizations JSON will be structured:

```
{
    "id": "" // The Organization ID - Document name
    "data": {} // Root document data
    "subCollections": {} // SubCollection data organized by key
}
```

**Restore**
Restores organization data from JSON. Each JSON should minimally define the structure specified in "Backup" - `{ id, data, subCollections }`. The Organizations ID and document name/path will be written from `id`.

Note: existing data (root `data` or `subCollections`) will not be overwritten unless a matching document ID exists in the collection.

### Scripts

1. Make sure all dependencies are installed and workspaces packages are built by running `rush update` and `rush build`
2. The `index` defines 3 exports:

- `backupAllOrganizations` - Returns root document and subcollection data for **all organizations**
- `backupSingleOrganization` - Returns root document and subcollection data for a **single organization**
- `restoreOrganizations` - Sets all data for an array of organizations

3. For the underlying firestore-db calls to succeed, an admin app instance needs to be initialised in the calling context - e.g `admin.initializeApp(credentials)`. To achieve this using ENV variables, see [this resource](https://www.benmvp.com/blog/initializing-firebase-admin-node-sdk-env-vars/)
