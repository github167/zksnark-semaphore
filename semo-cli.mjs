import { Identity } from "@semaphore-protocol/identity"
import { SemaphoreEthers } from "@semaphore-protocol/data"
import { BigNumber, utils } from "ethers"
import { Group } from "@semaphore-protocol/group"
import { generateProof, verifyProof } from "@semaphore-protocol/proof"
import { groth16 } from "snarkjs"
import { Contract, providers, Wallet } from "ethers"
import Feedback from "./contract-artifacts/Feedback.json" assert { type: "json" }
import sem from "./semaphoreABI.json" assert { type: "json" }



//const identity1 = new Identity()
//const identity2 = new Identity("secret-message")
//["0x1b997696cf3fa02b8596940a37d19cd63dfc4677f6b7ff9196dea6152541e5d9", "0x19cf56c35d0e8e1d9e7a12a29552905288bf333b75c0f2592fcf23c033f46f96"]
//const identity3 = new Identity(identity1.toString())
//const { trapdoor, nullifier, commitment, secret } = identity2

const GROUP_ID="49"
const network_index = 0
const id_secret = "hello5"
const task = parseInt(process.argv[2])
 
const network_profile = [
{
	network: "http://127.0.0.1:8545",
	semaphoreAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
	feedbackAddress: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
	startBlock: 0,
	providerStr: "",
	provider: new providers.JsonRpcProvider("http://127.0.0.1:8545"),
	ethereumPrivateKey: "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
},
{
	network: "sepolia",
	semaphoreAddress: "0x3f759B3C73f87D54FAb0239E7b2eDA0648387C3E",
	feedbackAddress: "0x56FbaFEbeEf6562a4BdaCA2C16d315e6f08E9B9c",
	startBlock: 3231111,
	providerStr: "infura",
	provider: new providers.InfuraProvider("sepolia", "xxx"),
	ethereumPrivateKey: "xxx"	
}
]

var {network,semaphoreAddress,feedbackAddress,startBlock,providerStr,provider,ethereumPrivateKey} = network_profile[network_index]


async function getEvents(contract, eventName, filterArgs, startBlock) {
	const filter = contract.filters[eventName](...filterArgs)
	const events = await contract.queryFilter(filter, startBlock)
	return events.map(({ args, blockNumber }) => ({ ...args, blockNumber }))
}

async function getGroup(groupId) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(semaphoreAddress, sem, signer)
	const groups = await getEvents(contract, "GroupCreated", [groupId], startBlock)

	return groups
}

async function getGroupIds() {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(semaphoreAddress, sem, signer)
	const groups = await getEvents(contract, "GroupCreated", [], startBlock)

    return groups.map((event) => event[0].toString())
}


async function getGroupMembers(groupId) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(semaphoreAddress, sem, signer)
	const [groupCreatedEvent] = await getEvents(contract, "GroupCreated", [groupId], startBlock)

	if (!groupCreatedEvent) {
		throw new Error(`Group '${groupId}' not found`)
	}

	const zeroValue = groupCreatedEvent.zeroValue.toString()
	const memberRemovedEvents = await getEvents(contract, "MemberRemoved", [groupId], startBlock)
	const memberUpdatedEvents = await getEvents(contract, "MemberUpdated", [groupId], startBlock)
	const memberAddedEvents = await getEvents(contract, "MemberAdded", [groupId], startBlock)


	var groupUpdates = new Map();
	
	for (var { blockNumber, index, newIdentityCommitment } of memberUpdatedEvents) {
            groupUpdates.set(index.toString(), [blockNumber, newIdentityCommitment.toString()])
	}
	
    for (var { blockNumber, index } of memberRemovedEvents) {
		const groupUpdate = groupUpdates.get(index.toString())

        if (!groupUpdate || (groupUpdate && groupUpdate[0] < blockNumber)) {
			groupUpdates.set(index.toString(), [blockNumber, zeroValue])
        }
    }
	
    var members = []

    for (var { index, identityCommitment } of memberAddedEvents) {
		const groupUpdate = groupUpdates.get(index.toString())
		const member = groupUpdate ? groupUpdate[1].toString() : identityCommitment.toString()

		members.push(member)
	}

	return members
}

async function getGroupVerifiedProofs(groupId) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(semaphoreAddress, sem, signer)
	const [groupCreatedEvent] = await getEvents(contract, "GroupCreated", [groupId], startBlock)

    if (!groupCreatedEvent) {
		throw new Error(`Group '${groupId}' not found`)
    }
	
	const proofVerifiedEvents = await getEvents(contract, "ProofVerified", [groupId], startBlock)
	
    return proofVerifiedEvents.map((event) => ({
            signal: event.signal.toString(),
            merkleTreeRoot: event.merkleTreeRoot.toString(),
            externalNullifier: event.externalNullifier.toString(),
            nullifierHash: event.nullifierHash.toString()
    }))
}


async function getGroupAdmin(groupId) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(semaphoreAddress, sem, signer)
	const groupAdminUpdatedEvents = await getEvents(contract, "GroupAdminUpdated", [groupId], startBlock)

    if (groupAdminUpdatedEvents.length === 0) {
		throw new Error(`Group '${groupId}' not found`)
    }

    return groupAdminUpdatedEvents[groupAdminUpdatedEvents.length - 1].newAdmin.toString()
}

async function joinId(identity) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(feedbackAddress, Feedback.abi, signer)	
	const transaction = await contract.joinGroup(identity.commitment)
}

async function sendFeebackId(users, identity, message) {
    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(feedbackAddress, Feedback.abi, signer)	
	
	var signal = BigNumber.from(utils.formatBytes32String(message)).toString()

	var group = new Group(GROUP_ID)
	await group.addMembers(users) 

	var pf = await generateProof(identity, group, GROUP_ID, signal, {wasmFilePath: "semaphore.wasm", zkeyFilePath: "semaphore.zkey"})

	var result = await verifyProof(pf, 20)
	console.log(`proof result: ${result}`)

	const { proof, merkleTreeRoot, nullifierHash } = pf

	const transaction = await contract.sendFeedback(signal, merkleTreeRoot, nullifierHash, proof)
}

async function main() {
	
	//console.log(await getGroupAdmin(GROUP_ID))
	//console.log(await getGroupIds())
	//console.log(await getGroup(GROUP_ID))
	//console.log(await getGroupMembers(GROUP_ID))
	//console.log(await getGroupVerifiedProofs(GROUP_ID))
	switch(task) {
		case 1: {
			console.log(await getGroupMembers(GROUP_ID));			
			var proofs = await getGroupVerifiedProofs(GROUP_ID);
			var signals = proofs.map(({signal}) => utils.parseBytes32String(BigNumber.from(signal).toHexString()));
			console.log(signals)
			break;
		}
		case 2: {
			var id = new Identity(id_secret);
			await joinId(id);
			console.log(`joining ${id.commitment}...`);
			break;
		}
		case 3: {
			var id = new Identity(id_secret);
			var _users = await getGroupMembers(GROUP_ID)
			var message = (new Date()).toLocaleTimeString();
			console.log(`${id.commitment} send message ${message}`)
			await sendFeebackId(_users, id, message)
			break
		}
		case 4: {
			var id=new Identity();
			await joinId(id);
			var _users = await getGroupMembers(GROUP_ID);
			var message = (new Date()).toLocaleTimeString();
			console.log(`${id.commitment} send message ${message}`);
			await sendFeebackId(_users, id, message);
			var proofs = await getGroupVerifiedProofs(GROUP_ID);
			//console.log(proofs);
			var signals = proofs.map(({signal}) => utils.parseBytes32String(BigNumber.from(signal).toHexString()));
			console.log(signals);
			
			break;
		}
			
	}

	
	//var semaphore = new SemaphoreEthers(network, {address: semaphoreAddress, provider:providerStr, startBlock:startBlock})
	//console.log(await semaphore.getGroupIds())
	//console.log(await semaphore.getGroupAdmin(GROUP_ID))
	//console.log(await semaphore.getGroup(GROUP_ID))
	//console.log(await semaphore.getGroupMembers(GROUP_ID))	
	//console.log(await semaphore.getGroupVerifiedProofs(GROUP_ID)
}

main().then(()=>{process.exit(0)})



