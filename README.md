
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

npm install
```

3. In terminal 1
```
cd apps/contracts
npx hardhat compile
npx hardhat node
```

4. In terminal 2
```
cd boilerplate/apps/contracts
npx hardhat deploy --network localhost --group 49

cd ../web-app
npm run dev
```

5. Goto: http://localhost:3000

---
# Use yarn
```
git clone https://github.com/semaphore-protocol/boilerplate
cd boilerplate
npm install -g yarn
yarn
yarn dev
```
