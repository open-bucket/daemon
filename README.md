# Open Bucket Daemon
Open Bucket Daemon

For more information about the Open Bucket network, refer to: https://github.com/open-bucket/blueprint

## Installation
```bash
npm install @open-bucket/daemon
```

## Usage
### OBN Daemon uses the following environment variables:
- OBN_ETHEREUM_NODE_URL - default: `http://127.0.0.1:7545`
- OBN_CONSUMER_ACTIVATOR_ADDRESS - default: `null`
- OBN_PRODUCER_ACTIVATOR_ADDRESS - default: `null`
- OBN_GAS_PRICE - default: `2000000000` (2 Gwei)
- OBN_GAS_LIMIT - default: `4712388`

### Run commands
- Use `obn --help` for more information

## Development
- Refer to https://github.com/open-bucket/dev for more information

## Run Daemon on Docker
### Build Docker image
- Sample command:
    ```bash
    docker build -t obn-daemon .
    ```

### Execute OBN Daemon CLI command inside Docker container
```bash
docker run -it -e <env-vars> obn-daemon <obn-daemon-cli-command>
```
- Sample command:
    ```bash
    docker run -it --rm -e OBN_ETHEREUM_NODE_URL=http://127.0.0.1:8545 obn-daemon obn login
    ```
