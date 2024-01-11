const express = require('express');
const mysql = require('mysql2');
const { ethers } = require('ethers');
const cors = require('cors');
const axios = require('axios');
const CoinGecko = require('coingecko-api');
const bodyParser = require('body-parser'); // Add this line to parse JSON payloads

require("dotenv").config();


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());


// Replace these values with your actual database connection details
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Password$2',
    database: 'WalletNotification'
})
// connect to db
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});


// Middleware to parse JSON request bodies
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    // Process the incoming webhook payload here
    //console.log('Webhook payload:', req.body.event.activity);

    let userAddress = req.body.event.activity[0].toAddress;
    let userMessage = `You received ${req.body.event.activity[0].value} ${req.body.event.activity[0].asset} from ${req.body.event.activity[0].fromAddress}`;

    console.log(userAddress);
    console.log(userMessage);

    // Store the data in the database
    const query = 'INSERT INTO notification (userAddress, notification_msg, isRead) VALUES (?,?,?)';
    const values = [userAddress, userMessage, false];

    connection.query(query, values, (err, results) => {
        if (err) {
            console.error('Error inserting data into MySQL:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        console.log("stored in DB")
    });

    // Send a response if needed
    res.json({ status: 'Received the webhook payload' });
});


app.get('/notifications', (req, res) => {
    const userAddress = req.query.userAddress;

    console.log(userAddress);
    // Query to fetch notifications for a given userId
    const query = 'SELECT * FROM notification WHERE userAddress = ?';

    connection.query(query, [userAddress], (err, results) => {
        if (err) {
            console.error('Error fetching notifications from MySQL:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        let finalResult = {
            status: true,
            result: results
        }
        res.setHeader('Content-Type', 'application/json');
        console.log(results);
        res.send(finalResult);
    });
});



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


app.post('/update-webhook-addresses', async (req, res) => {
    try {
        const XAclechyToken = "your_alchemy_webhook_token";

        const requestData = {
            webhook_id: req.body.Webhook_id,
            addresses_to_add: req.body.To_add,
            addresses_to_remove: req.body.To_remove
        };

        const response = await axios.patch("https://dashboard.alchemy.com/api/update-webhook-addresses", requestData, {
            headers: {
                "Accept": "application/json",
                "X-Alchemy-Token": "q7q1HHCH14VzgsQGAUbyeWdoELrQx7Bl",
                "Content-Type": "application/json"
            }
        });

        // Check if the request was successful
        if (response.status !== 200) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // If needed, you can handle the response body here
        const responseBody = response.data;
        console.log(responseBody);

        // Handle success
        console.log("Webhook addresses updated successfully!");

        res.status(200).json({ message: 'Webhook addresses updated successfully!' });
    } catch (error) {
        // Handle errors
        console.error("Error updating webhook addresses:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get("/getPriceInDollor", async (req, res) => {
    try {
        const coin = req.query.CoinSymbol;
        const coinName = req.query.CoinName

        let result = await convertToDollor(coin, coinName);
        res.send(result);
    }
    catch (error) {
        result = {
            "message": error
        }
        res.send(result)
    }
})


app.get("/importTokenDetails", async (req, res) => {
    try {
        const contractAddress = req.query.contractAddress;
        const rpc_url = req.query.RPC_URL;
        const accountAddress = req.query.accountAddress;


        let result = await importTokenDetails(contractAddress, rpc_url,accountAddress);
        res.send(result);
    }
    catch (error) {
        result = {
            "message": "error",
            "result": {
                "error": error.toString()
            }
        }
        res.send(result)
    }
});









//Functions

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

async function importTokenDetails(contractAddress, rpc_url,accountAddress) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpc_url);

        const abi = process.env.erc20TokenABI;

        myContract_read = new ethers.Contract(contractAddress, abi, provider)  // Read only
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
            "result": {
                "TokenName": tokenName,
                "TokenSymbol": tokenSymbol,
                "TokenDecimals": tokenDecimals,
                "TokenBalance": tokenValue
            }
        }

        return result;
    }
    catch (error) {
        result = {
            "message": "Failure",
            "result": {
                "error": error.toString()
            }
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


async function convertToDollor(coin, coinId) {
    try {
        let coinInUpperCase = coin.toUpperCase();
        let coinIdInLowerCase = coinId.toLowerCase();

        // using CoinGecko API to fetch real time Matic price in dollor
        const CoinGeckoClient = new CoinGecko();
        let data = await CoinGeckoClient.exchanges.fetchTickers('bitfinex', {
            coin_ids: [coinIdInLowerCase]
        });
        var _coinList = {};
        var _datacc = data.data.tickers.filter(t => t.target == 'USD');
        [
            coinInUpperCase
        ].forEach((i) => {
            var _temp = _datacc.filter(t => t.base == i);
            var _res = _temp.length == 0 ? [] : _temp[0];
            _coinList[i] = _res.last;
        })

        console.log(_coinList);

        result = {
            "message": "SUCCESS",
            "priceInDollor": _coinList
        }

        return result;
    }
    catch (error) {
        result = {
            "message": "failed",
            "error": error

        }
        return result;

    }
}



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
