import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { ethers } from "ethers";
import contractAbi from "./utils/Domains.json";
import twitterLogo from "./assets/twitter-logo.svg";
import { networks } from "./utils/networks";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";

// Constants
const TWITTER_HANDLE = "c2tarun";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = ".xaero";
const CONTRACT_ADDRESS = "0xA133f4A260C16BB2D4262dAC4a29895A67D6157C";

const App = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [domain, setDomain] = useState("");
    const [record, setRecord] = useState("");
    const [network, setNetwork] = useState("");
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mints, setMints] = useState([]);

    const connectWallet = async () => {
        console.log("Connect wallet method called.");
        try {
            const { ethereum } = window;
            if (!ethereum) {
                alert("Get MetMask -> https://metamask.io/");
                return;
            }

            const accounts = await ethereum.request({
                method: "eth_requestAccounts",
            });

            console.log(`Connected: ${accounts[0]}`);
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
        }
    };

    const checkIfWalletIsConnected = async () => {
        const { ethereum } = window;
        if (!ethereum) {
            console.log("Make sure you have MetaMask!");
            return;
        } else {
            console.log("We have the ethereum object", ethereum);
        }
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts.length !== 0) {
            console.log(`Found an authorized account: ${accounts[0]}`);
            setCurrentAccount(accounts[0]);
        } else {
            console.log("No authorized account found");
        }

        const chainId = await ethereum.request({ method: "eth_chainId" });
        setNetwork(networks[chainId]);

        ethereum.on("chainChanged", handleChainChanged);

        function handleChainChanged(_chainId) {
            window.location.reload();
        }
    };

    const mintDomain = async () => {
        if (!domain) {
            return;
        }
        if (domain.length < 3) {
            alert("Domain must be at least 3 characters long");
            return;
        }

        const price =
            domain.length === 3
                ? "0.05"
                : domain.length === 4
                ? "0.03"
                : "0.01";
        console.log(`Minting domain ${domain} with price ${price}`);
        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    contractAbi.abi,
                    signer
                );
                console.log(`Going to pop wallet now to pay gas...`);
                let tx = await contract.register(domain, {
                    value: ethers.utils.parseEther(price),
                });
                const receipt = await tx.wait();
                if (receipt.status === 1) {
                    console.log(
                        `Domain minted! https://mumbai.polygonscan.com/tx/${tx.hash}`
                    );

                    tx = await contract.setRecord(domain, record);
                    await tx.wait();
                    console.log(
                        `Record set! https://mumbai.polygonscan.com/tx/${tx.hash}`
                    );

                    setTimeout(() => {
                        fetchMints();
                    }, 2000);

                    setRecord("");
                    setDomain("");
                } else {
                    console.log(receipt);
                    alert("Transaction failed! please try again");
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    // Add this render function next to your other render functions
    const renderMints = () => {
        if (currentAccount && mints.length > 0) {
            return (
                <div className="mint-container">
                    <p className="subtitle"> Recently minted domains!</p>
                    <div className="mint-list">
                        {mints.map((mint, index) => {
                            return (
                                <div className="mint-item" key={index}>
                                    <div className="mint-row">
                                        <a
                                            className="link"
                                            href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <p className="underlined">
                                                {" "}
                                                {mint.name}
                                                {tld}{" "}
                                            </p>
                                        </a>
                                        {/* If mint.owner is currentAccount, add an "edit" button*/}
                                        {mint.owner.toLowerCase() ===
                                        currentAccount.toLowerCase() ? (
                                            <button
                                                className="edit-button"
                                                onClick={() =>
                                                    editRecord(mint.name)
                                                }
                                            >
                                                <img
                                                    className="edit-icon"
                                                    src="https://img.icons8.com/metro/26/000000/pencil.png"
                                                    alt="Edit button"
                                                />
                                            </button>
                                        ) : null}
                                    </div>
                                    <p> {mint.record} </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
    };

    // This will take us into edit mode and show us the edit buttons!
    const editRecord = (name) => {
        console.log("Editing record for", name);
        setEditing(true);
        setDomain(name);
    };

    const renderNotConnectedContainer = () => {
        if (!currentAccount) {
        }
        return (
            <div className="connect-wallet-container">
                <img
                    src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif"
                    alt="Ninja gif"
                />
                {!currentAccount && (
                    <button
                        className="cta-button connect-wallet-button"
                        onClick={connectWallet}
                    >
                        Connect Wallet
                    </button>
                )}
                {currentAccount && (
                    <div>
                        Connected account: ******************
                        {currentAccount.slice(-10)}
                    </div>
                )}
            </div>
        );
    };

    const switchNetwork = async () => {
        if (window.ethereum) {
            try {
                // Try to switch to the Mumbai testnet
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x13881" }], // Check networks.js for hexadecimal network ids
                });
            } catch (error) {
                // This error code means that the chain we want has not been added to MetaMask
                // In this case we ask the user to add it to their MetaMask
                if (error.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [
                                {
                                    chainId: "0x13881",
                                    chainName: "Polygon Mumbai Testnet",
                                    rpcUrls: [
                                        "https://rpc-mumbai.maticvigil.com/",
                                    ],
                                    nativeCurrency: {
                                        name: "Mumbai Matic",
                                        symbol: "MATIC",
                                        decimals: 18,
                                    },
                                    blockExplorerUrls: [
                                        "https://mumbai.polygonscan.com/",
                                    ],
                                },
                            ],
                        });
                    } catch (error) {
                        console.log(error);
                    }
                }
                console.log(error);
            }
        } else {
            // If window.ethereum is not found then MetaMask is not installed
            alert(
                "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
            );
        }
    };

    // Add this function anywhere in your component (maybe after the mint function)
    const fetchMints = async () => {
        console.log("Fetching mints");
        try {
            const { ethereum } = window;
            if (ethereum) {
                // You know all this
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    contractAbi.abi,
                    signer
                );

                // Get all the domain names from our contract
                const names = await contract.getAllNames();
                console.log(`Fetched names ${names}`);

                // For each name, get the record and the address
                const mintRecords = await Promise.all(
                    names.map(async (name) => {
                        const mintRecord = await contract.records(name);
                        const owner = await contract.domains(name);
                        return {
                            id: names.indexOf(name),
                            name: name,
                            record: mintRecord,
                            owner: owner,
                        };
                    })
                );

                console.log("MINTS FETCHED ", mintRecords);
                setMints(mintRecords);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // This will run any time currentAccount or network are changed
    useEffect(() => {
        if (network === "Polygon Mumbai Testnet") {
            fetchMints();
        }
    }, [currentAccount, network]);

    const updateDomain = async () => {
        if (!record || !domain) {
            return;
        }
        setLoading(true);
        console.log("Updating domain", domain, "with record", record);
        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    contractAbi.abi,
                    signer
                );

                let tx = await contract.setRecord(domain, record);
                await tx.wait();
                console.log(
                    "Record set https://mumbai.polygonscan.com/tx/" + tx.hash
                );

                fetchMints();
                setRecord("");
                setDomain("");
            }
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    };

    const renderInputForm = () => {
        // If not on Polygon Mumbai Testnet, render "Please connect to Polygon Mumbai Testnet"
        if (network !== "Polygon Mumbai Testnet") {
            return (
                <div className="connect-wallet-container">
                    <p>Please connect to the Polygon Mumbai Testnet</p>
                    <button
                        className="cta-button mint-button"
                        onClick={switchNetwork}
                    >
                        Click here to switch
                    </button>
                </div>
            );
        }
        return (
            <div className="form-container">
                <div className="first-row">
                    <input
                        type="text"
                        value={domain}
                        placeholder="domain"
                        onChange={(e) => setDomain(e.target.value)}
                    />
                    <p className="tld">{tld}</p>
                </div>
                <input
                    type="text"
                    value={record}
                    placeholder="Whats ur ninja power"
                    onChange={(e) => setRecord(e.target.value)}
                />
                {editing ? (
                    <div className="button-container">
                        <button
                            className="cta-button mint-button"
                            disabled={loading}
                            onClick={updateDomain}
                        >
                            Set record
                        </button>
                        <button
                            className="cta-button mint-button"
                            onClick={() => {
                                setEditing(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        className="cta-button mint-button"
                        disabled={null}
                        onClick={mintDomain}
                    >
                        Mint
                    </button>
                )}
                <div className="button-container">
                    <button
                        className="cta-button mint-button"
                        disabled={null}
                        onClick={null}
                    >
                        Set data
                    </button>
                </div>
            </div>
        );
    };

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    return (
        <div className="App">
            <div className="container">
                <div className="header-container">
                    <header>
                        <div className="left">
                            <p className="title">🐱‍👤 Xaero Name Service</p>
                            <p className="subtitle">
                                Your immortal API on the blockchain!
                            </p>
                        </div>
                        <div className="right">
                            <img
                                alt="Network logo"
                                className="logo"
                                src={
                                    network.includes("Polygon")
                                        ? polygonLogo
                                        : ethLogo
                                }
                            />
                            {currentAccount ? (
                                <p>
                                    {" "}
                                    Wallet: {currentAccount.slice(0, 6)}...
                                    {currentAccount.slice(-4)}{" "}
                                </p>
                            ) : (
                                <p> Not connected </p>
                            )}
                        </div>
                    </header>
                </div>
                {!currentAccount && renderNotConnectedContainer()}
                {currentAccount && renderInputForm()}
                {mints && renderMints()}

                <div className="footer-container">
                    <img
                        alt="Twitter Logo"
                        className="twitter-logo"
                        src={twitterLogo}
                    />
                    <a
                        className="footer-text"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >{`built with @${TWITTER_HANDLE}`}</a>
                </div>
            </div>
        </div>
    );
};

export default App;
