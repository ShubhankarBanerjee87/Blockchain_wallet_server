const express = require('express');
const { ethers } = require('ethers');
const config = require('./config');
const { resolveProperties } = require('ethers/lib/utils');
const cors = require('cors');
const { ContractFactory } = require('ethers');


const app = express();
const PORT = config.PORT;
app.use(cors());
app.use(express.json());

app.get('/createAccount', async (request, response) => {
    try {
        const wallet = ethers.Wallet.createRandom();

        console.log('address:', wallet.address)
        console.log('mnemonic:', wallet.mnemonic.phrase)
        console.log('privateKey:', wallet.privateKey)

        let newWallet = {
            "message": "Success",
            "Mnemonic": wallet.mnemonic.phrase.toString(),
            "Address": wallet.address.toString(),
            "PrivateKey": wallet.privateKey.toString()
        }

        response.send(newWallet);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }

});

app.post('/mainToken/balance', async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let address = request.query.address;
        console.log(rpc, address);

        EthersBalance = await connectToNetwork(rpc, address);

        let networkDetails = {
            "message": "Success",
            "balance": EthersBalance
        };
        response.send(networkDetails);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }

});

app.post('/importToken', async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let address = request.query.address;
        let contractId = request.query.contractAddress;
        let contractABI = request.query.contractAbi;

        result = await connectToken(rpc, address, contractId, contractABI);

        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }

});


app.post('/token/balance', async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let address = request.query.address;
        let contractId = request.query.contractAddress;
        let contractABI = request.query.contractAbi;

        result = await TokenBalance(rpc, address, contractId, contractABI);

        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }
});

app.post('/account/mnemonic', async (request, response) => {
    try {
        let mnemonic = request.query.Mnemonic;

        result = await generateAccountFromMnemonic(mnemonic);

        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }
});


app.post('/transfer/mainToken', async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let receiver = request.query.Receiver;
        let privateKey = request.query.PrivateKey;
        let amount = request.query.Amount;

        result = await EtherTransfer(rpc, receiver, privateKey, amount);

        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }

})

app.post("/change-network", async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let chainId = request.query.ChainId;

        result = await ChangeNetwork(rpc, chainId);
        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }

})

app.post("/transfer/token", async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let contractAddress = request.query.contractAddress;
        let contractAbi = request.query.contractAbi;
        let privateKey = request.query.PrivateKey;
        let receiver = request.query.Receiver;
        let amount = request.query.Amount;
        let decimals = request.query.Decimals

        result = await TransferToken(rpc, contractAddress, contractAbi, privateKey, receiver, amount, decimals);

        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }
})

app.post('/CreateNewMultiSig', async (request, response) => {

    try {
        let rpc = request.query.RPC;
        let privateKey = request.query.PrivateKey;

        const addresses = request.query.addressess.split(',');
        let numOfConfirmationRequired = request.query.numOfConfirmationRequired;

        result = await DeployContract(rpc, privateKey, addresses, numOfConfirmationRequired);

        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }
})

app.post('/checkMultisigOwner', async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let address = request.query.address;
        let contract_address = request.query.contractAddress;

        result = await CheckMultisigOwner(rpc, address, contract_address)

        response.send(result);
    }
    catch {
        result = {
            "message": "error"
        }
        response.send(result)
    }
})


app.post('/multisig/submitTransaction/deployContract', async (request, response) => {
    try {
        let rpc = request.query.RPC;
        let privateKey = request.query.PrivateKey;
        let multisigContractAddress = request.query.contractAddress


        abi = request.query.ABI;
        compileByteCode = request.query.bytecode;
        dataTypeArray = request.query.DataTypeStringArray;  //string array of data types
        parameterArray = request.query.parametersArray;  // array of parameters

        let bytedata = await deployContractFromMultisig(compileByteCode, dataTypeArray, parameterArray);

        result = await submitMultiSigTransaction(rpc, multisigContractAddress, privateKey, 2, "0x0000000000000000000000000000000000000000", 0, bytedata);

        result

        return "Ok"
    }
    catch {
        result = {
            message: "error"
        }
        response.send(result);
    }
})


// Functions of api methods

async function submitMultiSigTransaction(rpc, contractAddress, privateKey, txType, to, value, data) {
    let contractAbi = config.contract_abi;

    const provider = ethers.getDefaultProvider(rpc);
    let signer = new ethers.Wallet(privateKey, provider);

    contract = new ethers.Contract(contractAddress, contractAbi, signer);

    await contract.submitTransaction(txType, to, value, data).then((obj) => {
        console.log(obj);
    });

    return ;
}

async function deployContractFromMultisig(compileByteCode, dataTypeArray, parameterArray) {
    const abiCoder = new ethers.utils.AbiCoder();
    dataTypes = JSON.parse(dataTypeArray);
    parameters = JSON.parse(parameterArray);


    let data = abiCoder.encode(dataTypes, parameters);
    console.log(data);
    let bytecode = ethers.utils.solidityPack(["bytes", "bytes"], [compileByteCode, data]);

    console.log(bytecode);

    return bytecode;
}

async function CheckMultisigOwner(rpc, address, contractAddress) {
    try {
        let abi = config.contract_abi;

        const provider = new ethers.providers.JsonRpcProvider(rpc);
        myContract_read = new ethers.Contract(contractAddress, abi, provider)  // Read only

        let isOwner = await myContract_read.isOwner(address);

        result = {
            "message": "Success",
            "isOwner": isOwner
        }
        return result;
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }
}

async function DeployContract(rpc, privateKey, addresses, numOfConfirmationRequired) {
    try {
        const provider = ethers.getDefaultProvider(rpc);
        let signer = new ethers.Wallet(privateKey, provider);

        contractAbi = config.contract_abi;
        contractByteCode = config.contract_bytecode;

        const factory = new ContractFactory(contractAbi, contractByteCode, signer);
        contract = await factory.deploy(addresses, numOfConfirmationRequired);

        // contract.deployTransaction;
        await contract.deployTransaction.wait()

        result = {
            "message": "Success",
            "wallet_address": contract.address
        }

        return result
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }
}

async function TransferToken(rpc, contractAddress, contractAbi, privateKey, receiverAddress, amount, decimals) {
    try {


        let Status = 'Failure';
        let TxHash = '';
        const provider = ethers.getDefaultProvider(rpc);
        let signer = new ethers.Wallet(privateKey, provider);

        contract = new ethers.Contract(contractAddress, contractAbi, signer)  // Read only
        Decimals = parseInt(decimals, 10)
        console.log(Decimals)
        const howMuchTokens = ethers.utils.parseUnits(amount, Decimals);

        await contract.transfer(receiverAddress, howMuchTokens).then((obj) => {
            console.log(obj);
            TxHash = obj.hash;
            Status = 'Success'
        })

        result = {
            "message": "Success",
            "Status": Status,
            "TxHash": TxHash
        }
        return result
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }
}

async function ChangeNetwork(rpc, chainId) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpc);

        let objectNetwork = await provider.getNetwork();
        let chainID = parseInt(objectNetwork.chainId.toString());
        if (chainID == chainId) {
            result = {
                "message": "Success"
            }
        }

        else {
            result = {
                "message": "failed"
            }
        }

        return result;
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }

}

async function EtherTransfer(rpc, receiver, privateKey, amount) {
    try {
        const provider = ethers.getDefaultProvider(rpc);

        let txHash = ''
        let Status = ''

        let signer = new ethers.Wallet(privateKey, provider)

        const tx = {
            to: receiver,
            value: ethers.utils.parseEther(amount.toString())
        };

        await signer.sendTransaction(tx).then((txObj) => {
            console.log(txObj);
            txHash = txObj.hash.toString();
            Status = "Success"
            console.log(txObj.hash);
        })
        result = {
            "message": "Success",
            "Status": Status,
            "TxHash": txHash
        }
        return result;
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }


}

function generateAccountFromMnemonic(mnemonic) {
    try {
        // Create a wallet instance from the provided mnemonic
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);

        // Retrieve the Ethereum address and private key
        const address = wallet.address;
        const privateKey = wallet.privateKey;

        result = {
            "message": "Success",
            "Mnemonic": mnemonic,
            "Address": address,
            "PrivateKey": privateKey
        }

        return result;
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }

}

async function TokenBalance(url, accountAddress, contractId, abi) {
    try {

        const provider = new ethers.providers.JsonRpcProvider(url);

        myContract_read = new ethers.Contract(contractId, abi, provider)  // Read only

        await myContract_read.balanceOf(accountAddress).then((result) => {
            hexNumber = result._hex;
            decimalNumber = BigInt(hexNumber);
            tokenValue = (decimalNumber / BigInt(10 ** 18)).toString();
        })

        result = {
            "message": "Success",
            "TokenBalance": tokenValue
        }

        return result;
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }

}


async function connectToken(url, accountAddress, contractId, abi) {
    try {

        const provider = new ethers.providers.JsonRpcProvider(url);

        myContract_read = new ethers.Contract(contractId, abi, provider)  // Read only

        await myContract_read.name().then((result) => {
            tokenName = result.toString();
        })
        await myContract_read.symbol().then((result) => {
            tokenSymbol = result.toString();
        })
        await myContract_read.decimals().then((result) => {
            tokenDecimals = result.toString();
        })
        await myContract_read.balanceOf(accountAddress).then((result) => {
            hexNumber = result._hex;
            decimalNumber = BigInt(hexNumber);
            tokenValue = (decimalNumber / BigInt(10 ** 18)).toString();
        })

        result = {
            "message": "Success",
            "TokenName": tokenName,
            "TokenSymbol": tokenSymbol,
            "TokenDecimals": tokenDecimals,
            "TokenBalance": tokenValue
        }

        return result;
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }

}


async function connectToNetwork(url, accountAddress) {
    try {

        const provider = new ethers.providers.JsonRpcProvider(url);

        balance = await provider.getBalance(accountAddress);
        balanceInEthers = await ethers.utils.formatEther(balance);
        console.log(`balance in ethers = ${balanceInEthers}`);

        return balanceInEthers.toString();
    }
    catch {
        result = {
            "message": "failed"
        }
        return result;
    }

}




app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});
