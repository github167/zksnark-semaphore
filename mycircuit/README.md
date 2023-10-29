Playground:

- https://www.katacoda.com/scenario-examples/courses/environment-usages/nodejs
- https://codedamn.com/online-compiler/node#start

1. install cargo and circom
```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf > install_cargo.sh
chmod u+x install_cargo.sh
./install_cargo.sh -y
source "$HOME/.cargo/env"
git clone https://github.com/iden3/circom.git
cd circom

cargo build --release
cargo install --path circom

```

2. create and compile circuit
```
cd ~
mkdir semaphore-circom && cd semaphore-circom
npm install -g snarkjs
npm init -y
npm install circomlib

mkdir mycircuit && cd mycircuit
curl https://raw.githubusercontent.com/github167/zksnark-semaphore/main/mycircuit/semaphore.circom --output semaphore.circom
curl https://raw.githubusercontent.com/github167/zksnark-semaphore/main/mycircuit/tree.circom --output tree.circom
circom semaphore.circom --r1cs --wasm --sym --c

```

3. generate keys
```
curl https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau --output pot12_final.ptau
snarkjs groth16 setup semaphore.r1cs pot12_final.ptau semaphore_0000.zkey
snarkjs zkey contribute semaphore_0000.zkey semaphore_0001.zkey --name="1st Contributor Name" -v -e="some text"
snarkjs zkey export verificationkey semaphore_0001.zkey verification_key.json

```

4. create proof and verify
```
cd semaphore_js
curl https://raw.githubusercontent.com/github167/zksnark-semaphore/main/mycircuit/input.json --output input.json
node generate_witness.js semaphore.wasm input.json witness.wtns
snarkjs groth16 prove ../semaphore_0001.zkey witness.wtns proof.json public.json
snarkjs groth16 verify ../verification_key.json public.json proof.json

```

5. generate sol
```
snarkjs zkey export solidityverifier ../semaphore_0001.zkey verifier.sol
snarkjs generatecall

```
---
Use zkrepl
1. update node version in playground
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
source ~/.bashrc
nvm install node

```
2. install zkrepl
```
git clone https://github.com/0xPARC/zkrepl
cd zkrepl
npm install -g yarn
yarn
replace src/example.circom with your file

```
3. launch website
```
yarn dev --host

```
