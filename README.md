Playground: https://killercoda.com/playgrounds

Email: https://www.emailtick.com/

1. Install npm and yarn
```
apt install npm -y
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install yarn

```

2. Create semaphore project
```
npx @semaphore-protocol/cli create my-app --template monorepo-ethers
cd my-app
yarn install

```

3. In terminal 1 run local blockchain
```
yarn dev:contracts

```

4. In terminal 2 
```
cd ~/my-app/apps/contracts
curl -s https://raw.githubusercontent.com/github167/zksnark-semaphore/main/semo-cli.mjs > semo-cli.mjs
node semo-cli.mjs 1
node semo-cli.mjs 3
node semo-cli.mjs 3
node semo-cli.mjs 1

```
