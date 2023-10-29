pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/mux1.circom";

template MerkleTreeInclusionProof(nLevels) {
    signal input leaf;
    signal input pathIndices[nLevels];
    signal input siblings[nLevels];

    signal output root;

    component poseidons[nLevels];
    component mux[nLevels];

    signal hashes[nLevels + 1];
    hashes[0] <== leaf;

    for (var i = 0; i < nLevels; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        poseidons[i] = Poseidon(2);
        mux[i] = MultiMux1(2);

        mux[i].c[0][0] <== hashes[i];
        mux[i].c[0][1] <== siblings[i];

        mux[i].c[1][0] <== siblings[i];
        mux[i].c[1][1] <== hashes[i];

        mux[i].s <== pathIndices[i];

        poseidons[i].inputs[0] <== mux[i].out[0];
        poseidons[i].inputs[1] <== mux[i].out[1];

        hashes[i + 1] <== poseidons[i].out;
    }

    root <== hashes[nLevels];
}



template CalculateSecret() {
    signal input identityNullifier;
    signal input identityTrapdoor;

    signal output out;

    component poseidon = Poseidon(2);

    poseidon.inputs[0] <== identityNullifier;
    poseidon.inputs[1] <== identityTrapdoor;

    out <== poseidon.out;
}

template CalculateIdentityCommitment() {
    signal input secret;

    signal output out;

    component poseidon = Poseidon(1);

    poseidon.inputs[0] <== secret;

    out <== poseidon.out;
}

template CalculateNullifierHash() {
    signal input externalNullifier;
    signal input identityNullifier;

    signal output out;

    component poseidon = Poseidon(2);

    poseidon.inputs[0] <== externalNullifier;
    poseidon.inputs[1] <== identityNullifier;

    out <== poseidon.out;
}

// The current Semaphore smart contracts require nLevels <= 32 and nLevels >= 16.
template Semaphore(nLevels) {
    signal input identityNullifier;
    signal input identityTrapdoor;
    signal input treePathIndices[nLevels];
    signal input treeSiblings[nLevels];

    signal input signalHash;
    signal input externalNullifier;

    signal output root;
    signal output nullifierHash;

    component calculateSecret = CalculateSecret();
    calculateSecret.identityNullifier <== identityNullifier;
    calculateSecret.identityTrapdoor <== identityTrapdoor;

    signal secret;
    secret <== calculateSecret.out;

    component calculateIdentityCommitment = CalculateIdentityCommitment();
    calculateIdentityCommitment.secret <== secret;

    component calculateNullifierHash = CalculateNullifierHash();
    calculateNullifierHash.externalNullifier <== externalNullifier;
    calculateNullifierHash.identityNullifier <== identityNullifier;

    component inclusionProof = MerkleTreeInclusionProof(nLevels);
    inclusionProof.leaf <== calculateIdentityCommitment.out;

    for (var i = 0; i < nLevels; i++) {
        inclusionProof.siblings[i] <== treeSiblings[i];
        inclusionProof.pathIndices[i] <== treePathIndices[i];
    }

    root <== inclusionProof.root;

    // Dummy square to prevent tampering signalHash.
    signal signalHashSquared;
    signalHashSquared <== signalHash * signalHash;

    nullifierHash <== calculateNullifierHash.out;
}

component main {public [signalHash, externalNullifier]} = Semaphore(20);

/*INPUT = {"identityTrapdoor":"216025325985134297549303092925939209613601789575076125658700017839632155093", "identityNullifier": "41218208430404329146733129584536586092984950854149688623659994834024000338", "treePathIndices":[1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "treeSiblings": [7160750832815949204023989555615207634426321327868301149379558775618536210278, 10043441858821864410972478892992224092981477795201562336363157596537059962424, 13951585150872596316903294707507187210725007263076063112333517568268019762956, 2079565529553490553763839867967399982258193776915297266842537640197338316024, 14400807733359909375334052425880239937014653551523738942842874858154492974460, 2107244683357670179446117797545247930481471119403053994704448153923733292553, 4257675069992100369009905722383964364891040527879679172960530764957720614503, 14989058899942548423407771309270161951534171156941497765266176155518437712554, 19966451134561253874305185500751850865151441035579922796789432696795972028971, 21134794312762354839923964371519154556755045316061790535702490989018540788883, 21446817052249075962230096641589117401873570421074313736554383834221343810660, 3340153446099577750134517681092375815858323203401389469419127298070248446928, 6082802756039911644582595752934668117681299495394666425004663578953589402037, 19508027047572682574768720595758730733655995449973761530865213502503780801561, 7419855112101594406720029012718363038825394667589381778905031554454283305202, 6059930980875627159876107656256885495948114293117012313122000389419815844639, 18680157374262647674067988482429820632727101866921901799516442316501746275799, 17517827503880317297311761270982762801435827518945140867518815644545991452247, 15990272084220592512275565618321435642329893384001730895761029606007404773290, 12080660647775769302834621848779024508209179690781691315248386739093883654262], "externalNullifier":"348512470143117915647567306080458906054419056037679437038078933836745303167", "signalHash":"388421595912670744615495412505974163865916759385199795401047974289313491068"}*/
