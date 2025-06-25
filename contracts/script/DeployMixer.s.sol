// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.0 <0.9.0;

import {Script} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {Mixer, Poseidon2} from "../src/Mixer.sol";

contract DeployMixer is Script {
    HonkVerifier public verifier;
    Poseidon2 public hasher;
    Mixer public mixer;

    function run() public {
        uint32 depth = uint32(vm.envUint("MIXER_DEPTH"));
        deploy(depth);
    }

    function deploy(uint32 _depth) public returns (HonkVerifier _verifier, Poseidon2 _hasher, Mixer _mixer) {
        vm.startBroadcast();
        _verifier = new HonkVerifier();
        _hasher = new Poseidon2();
        _mixer = new Mixer(_depth, _hasher, _verifier);
        vm.stopBroadcast();
    }
}
