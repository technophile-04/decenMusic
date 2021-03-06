import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { getMarketContractRead, getNftContractRead } from '../utils';
import axios from 'axios';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../utils/firebase-config';

export const UserContext = React.createContext();

const { ethereum } = window;

export const UserProvider = ({ children }) => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
	const [loading, setLoading] = useState(false);
	const [allNFTs, setAllNFTs] = useState([]);
	const [myNfts, setMyNfts] = useState([]);
	const [createdNFTs, setCreatedNFTs] = useState([]);
	const checkIfWalletIsConnected = async () => {
		try {
			if (!ethereum) alert('You dont have ethereum wallet installed');
			const accounts = await ethereum.request({ method: 'eth_accounts' });
			// console.log(accounts);
			if (accounts.length > 0) {
				setCurrentAccount(accounts[0]);
			} else {
				console.log('NO accoutns found');
			}
			console.log(accounts);
		} catch (error) {
			console.log(error);
			throw new Error(error.message);
		}
	};

	const connectWallet = async () => {
		try {
			console.log('Connetct called ');
			if (!ethereum) alert('You dont have ethereum wallet installed');
			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});
			console.log(accounts);
			setCurrentAccount(accounts[0]);
			try {
				const userCollectionRef = collection(db, 'user');
				await addDoc(userCollectionRef, {
					hash: accounts[0],
					fav: [],
				});
			} catch (err) {
				console.log(err);
			}
		} catch (error) {
			console.log(error);
			throw new Error(error.message);
		}
	};

	const getAllNFTs = async () => {
		const nftContract = getNftContractRead();
		const marketContract = getMarketContractRead();

		setLoading(true);

		const data = await marketContract.fetchMarketItems();

		const items = await Promise.all(
			data.map(async (i) => {
				const tokenURI = await nftContract.tokenURIs(i.tokenId);
				const meta = await axios.get(tokenURI);
				const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
				const item = {
					price,
					tokenId: i.tokenId.toNumber(),
					seller: i.seller,
					owner: i.owner,
					song: meta.data.song,
					name: meta.data.name,
					image: meta.data.image,
					lyrics: meta.data.lyrics,
				};
				return item;
			})
		);
		setAllNFTs(items);
		setLoading(false);
	};

	const getMyNFTs = async () => {
		const marketContract = getMarketContractRead();
		const nftMarketContract = getNftContractRead();

		setLoading(true);

		const data = await marketContract.fetchMyNFTs();

		const items = await Promise.all(
			data.map(async (i) => {
				const tokenURI = await nftMarketContract.tokenURIs(i.tokenId);
				const meta = await axios.get(tokenURI);
				const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
				const item = {
					price,
					tokenId: i.tokenId.toNumber(),
					seller: i.seller,
					owner: i.owner,
					song: meta.data.song,
					name: meta.data.name,
					image: meta.data.image,
					lyrics: meta.data.lyrics,
				};
				return item;
			})
		);

		console.log('f;dljfasd;fjklasf;jk', myNfts);

		setMyNfts(items);
		setLoading(false);
	};

	const getCreatedNFTs = async () => {
		const marketContract = getMarketContractRead();
		const nftMarketContract = getNftContractRead();

		const data = await marketContract.fetchItemsCreated();

		console.log('data', data);

		const items = await Promise.all(
			data.map(async (i) => {
				const tokenURI = await nftMarketContract.tokenURIs(i.tokenId);
				const meta = await axios.get(tokenURI);
				const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
				const item = {
					price,
					tokenId: i.tokenId.toNumber(),
					seller: i.seller,
					owner: i.owner,
					song: meta.data.song,
					name: meta.data.name,
					image: meta.data.image,
					lyrics: meta.data.lyrics,
				};
				return item;
			})
		);

		console.log('createdNFTS', items);

		setCreatedNFTs(items);
	};

	useEffect(() => {
		if (ethereum) {
			const getChain = async () => {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const { chainId } = await provider.getNetwork(provider);
				console.log('CHAIN ID : ', chainId);
				setIsCorrectNetwork(chainId === 31337);
			};

			ethereum.on('accountsChanged', (accounts) => {
				setCurrentAccount(accounts[0]);
			});
			ethereum.on('networkChanged', function (networkId) {
				window.location.reload();
			});
			checkIfWalletIsConnected();
			getChain();
		}
	}, []);

	return (
		<UserContext.Provider
			value={{
				connectWallet,
				currentAccount,
				allNFTs,
				getAllNFTs,
				getMyNFTs,
				myNfts,
				loading,
				isCorrectNetwork,
				getCreatedNFTs,
				createdNFTs,
			}}
		>
			{children}
		</UserContext.Provider>
	);
};
