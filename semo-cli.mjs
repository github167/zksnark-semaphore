import { Identity, generateProof, verifyProof, Group } from "@semaphore-protocol/core"
import { SemaphoreEthers } from "@semaphore-protocol/data"
import { ethers, encodeBytes32String, decodeBytes32String, Contract, Wallet } from "ethers"
import Feedback from "./artifacts/contracts/Feedback.sol/Feedback.json" assert { type: "json" }
import sem from "./artifacts/@semaphore-protocol/contracts/Semaphore.sol/Semaphore.json" assert { type: "json" }

const GROUP_ID="0"
const network_index = 0
const task = parseInt(process.argv[2])
 
const network_profile = [
{
	network: "http://127.0.0.1:8545",
	semaphoreAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
	feedbackAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
	startBlock: 0,
	providerStr: "",
	provider: new ethers.JsonRpcProvider("http://127.0.0.1:8545"),
	ethereumPrivateKey: "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
},
{
	network: "sepolia",
	semaphoreAddress: "0x3f759B3C73f87D54FAb0239E7b2eDA0648387C3E",
	feedbackAddress: "0x56FbaFEbeEf6562a4BdaCA2C16d315e6f08E9B9c",
	startBlock: 3231111,
	providerStr: "infura",
	provider: new ethers.InfuraProvider("sepolia", "xxx"),
	ethereumPrivateKey: "xxx"	
}
]

var {network,semaphoreAddress,feedbackAddress,startBlock,providerStr,provider,ethereumPrivateKey} = network_profile[network_index]

var semaphore = new SemaphoreEthers(network, {address: semaphoreAddress, provider:providerStr, startBlock:startBlock})

async function joinId(identity) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(feedbackAddress, Feedback.abi, signer)	
	const transaction = await contract.joinGroup(identity.commitment)
}

async function sendFeebackId(users, identity, message) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(feedbackAddress, Feedback.abi, signer)	
	//var signal = BigInt(encodeBytes32String(message)).toString()
	var signal = encodeBytes32String(message)

	var group = new Group(users)
	var pf = await generateProof(identity, group, signal, GROUP_ID)
	

	var result = await verifyProof(pf, 20)
	console.log(`proof result: ${result}`)

	const { points, merkleTreeDepth, merkleTreeRoot, nullifier } = pf

	const transaction = await contract.sendFeedback(merkleTreeDepth, merkleTreeRoot, nullifier, signal, points)
}

async function main() {
	

	//console.log(await semaphore.getGroupIds())
	//console.log(await semaphore.getGroupAdmin(GROUP_ID))
	//console.log(await semaphore.getGroup(GROUP_ID))
	//console.log(await semaphore.getGroupMembers(GROUP_ID))	
	//console.log(await semaphore.getGroupValidatedProofs(GROUP_ID))

	switch(task) {
		case 1: {
			console.log("Network:", semaphore.network)
			console.log("Semaphore Addr:", semaphore.options.address)			
			console.log("Provider:", semaphore.options.provider)
			console.log("All group IDs:", await semaphore.getGroupIds())
			console.log("Current group ID:", await semaphore.getGroup(GROUP_ID))
			console.log("Admin contract Addr:", await semaphore.contract.getGroupAdmin(GROUP_ID))
			console.log("Group Members:", await semaphore.getGroupMembers(GROUP_ID));			
			var proofs = await semaphore.getGroupValidatedProofs(GROUP_ID);
			var signals = proofs.map(({message}) => ethers.decodeBytes32String("0x"+ BigInt(message).toString(16)));
			console.log("Messages:", signals)
			break;
			
		}
		case 2: {
			var id = new Identity();
			await joinId(id);
			console.log(`joining ${id.commitment}...`);
			break;
		}
		case 3: {
			var id=new Identity();
			await joinId(id);
			var _users = await semaphore.getGroupMembers(GROUP_ID);
			var message = (new Date()).toLocaleTimeString();
			console.log(`${id.commitment} send message ${message}`);
			await sendFeebackId(_users, id, message);
			console.log(await semaphore.getGroupMembers(GROUP_ID));	
			var proofs = await semaphore.getGroupValidatedProofs(GROUP_ID);			
			var signals = proofs.map(({message}) => ethers.decodeBytes32String("0x"+ BigInt(message).toString(16)));
			console.log(signals);			
			break;
		}
		default:
			console.log("1: Summary\n2: Create identity and join\n3: 2+Send feedback (current time)")	
	}
}

main().then(()=>{process.exit(0)})


EOF
