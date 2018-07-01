# Open Bucket Daemon
## Usage
- Install npm packages: `npm i -g @open-bucket/daemon`
- Register: `obn register`

## Development
1) Start transpiling & watching OBN-Daemon code: `npm run watch`
2) Start OBN-Tracker
3) Copy the Activator address shown on OBN-Tracker log
4) Run CLI commands with the created Activator address: `OBN_ACTIVATOR_ADDRESS=<activatorAddress> npm run cli -- <command>`
