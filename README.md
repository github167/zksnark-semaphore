
Playground: https://www.katacoda.com/scenario-examples/courses/environment-usages/nodejs

# Use npm
1. If we run it in playground, update node version
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
source ~/.bashrc
nvm install node

```

2. Git clone and install
```
git clone https://github.com/semaphore-protocol/boilerplate
cd boilerplate

cat <<EOF > .env
DEFAULT_NETWORK=localhost
INFURA_API_KEY=
ETHEREUM_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
FEEDBACK_CONTRACT_ADDRESS=0x5fc8d32690cc91d4c39d9d3abcbd16989f875707
SEMAPHORE_CONTRACT_ADDRESS=0xdc64a140aa3e981100a9beca4e685f962f0cf6c9
OPENZEPPELIN_AUTOTASK_WEBHOOK=
GROUP_ID=49
REPORT_GAS=false
COINMARKETCAP_API_KEY=
ETHERSCAN_API_KEY=

EOF

cd apps
mkdir mycli && cd mycli
npm init -y
cp -r ../web-app/contract-artifacts/ .
curl https://www.trusted-setup-pse.org/semaphore/20/semaphore.zkey --output semaphore.zkey
curl https://www.trusted-setup-pse.org/semaphore/20/semaphore.wasm --output semaphore.wasm
curl https://raw.githubusercontent.com/semaphore-protocol/semaphore/main/packages/data/src/semaphoreABI.json --output semaphoreABI.json
curl https://raw.githubusercontent.com/github167/zksnark-semaphore/main/semo-cli.mjs --output semo-cli.mjs
cd ../..

npm install
cd apps/mycli
npm install snarkjs

```

3. In terminal 1: start blockchain
```
#cd boilerplate/apps/contracts
npx hardhat node

```

4. In terminal 2: deploy contract
```
cd ../contracts
npx hardhat compile
npx hardhat deploy --network localhost --group 49

```

5. Use web: http://localhost:3000
```
cd ../web-app
npm run dev

```

7. Use cli
```
cd ../mycli
node semo-cli.mjs 1

```

---
# Use yarn
```
git clone https://github.com/semaphore-protocol/boilerplate
cd boilerplate
npm install -g yarn
yarn
yarn dev

```
Goto: http://localhost:3000



