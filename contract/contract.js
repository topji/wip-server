const { ethers } = require("ethers");
const wipContractABI = require("./wipContractAbi.json");
require('dotenv').config()

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;
const wipContractAddress = process.env.WIP_CONTRACT_ADDRESS;


const wipContractInstance = () => {

    const provider = new ethers.providers.JsonRpcProvider(
        `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
    );
    
    const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY);
    const connectedWallet = wallet.connect(provider);

    const wipContract = new ethers.Contract(
        wipContractAddress,
        wipContractABI,
        connectedWallet
      );

    return {wipContract,provider,wallet};

}

const wipContractWSInstance = () => {

    const websocketProvider = new ethers.providers.WebSocketProvider(
        // `wss://base-sepolia.infura.io/ws/v3/${process.env.INFURA_KEY}`
        `wss://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
    );

    const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY);
    const connectedWalletWS = wallet.connect(websocketProvider);

    const wipContractWS = new ethers.Contract(
        wipContractAddress,
        wipContractABI,
        connectedWalletWS
    );

    return {wipContractWS};

}

module.exports = {
    wipContractInstance:wipContractInstance,
    wipContractWSInstance:wipContractWSInstance,
}