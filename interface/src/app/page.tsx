"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { zeroAddress } from "../resources";
import { RootState } from "../state/store";
import { getTokenBaseUnits } from "../utils";
import SavingsService from "../services/savings";
import { counter_contract } from "../data/constants";
import SignInWithCoinbaseButton from "../components/SignInWithCoinbaseButton";
import fetchmostRecentTx from "./coinbase/transaction/page";
import TransferToken from "../components/TransferToken";

// export default function Home({
// 	searchParams,
// }: {
// 	searchParams: URLSearchParams;
// }) {
export default function Home() {
	const { isWalletConnected, currentNetwork } = useSelector(
		(state: RootState) => state.wallet
	);
	const [amountInput, setAmountInput] = useState<string>("");
	const [timelockDaysInput, setTimelockDaysInput] = useState<string>("");
	const [timelockSec, setTimelockSec] = useState<bigint>(BigInt(0));
	const [daysUntilUnlock, setDaysUntilUnlock] = useState<string>("");
	const [amount, setAmount] = useState<bigint>(BigInt(0));
	const [count, setCount] = useState<bigint>(BigInt(0));
	const [saveAmount, setSaveAmount] = useState<string>("");
	const [totalSaved, setTotalSaved] = useState<string>("");
	const [targetContract, setTargetContract] = useState<string>(
		counter_contract[currentNetwork?.chainId as number]
	);
	const [savingsContract, setSavingsContract] = useState<string>("");
	const [successMessage, setSuccessMessage] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [authInfo, setAuthInfo] = useState<{
		accessToken: string;
		refreshToken: string;
		expiresAt: number;
		scope: string;
		coinbaseId: string;
	} | null>(null);
	const [accountId, setAccountId] = useState<string | null>(null);
	const [mostRecentTxId, setMostRecentTxId] = useState<any | null>(null);
	const [isTxIdInitialized, setIsTxIdInitialized] = useState(false);
	const [isNewTransactionDetected, setIsNewTransactionDetected] =
		useState<boolean>(false);

	// const authInfo = searchParams.get("authInfo");
	// let accessToken: string;
	// if (!!authInfo) accessToken = JSON.parse(authInfo).accessToken;

	// console.log("authInfo", authInfo);

	const clearState = () => {
		setAmountInput("");
		setTimelockDaysInput("");
		setTimelockSec(BigInt(0));
		setDaysUntilUnlock("");
		setAmount(BigInt(0));
		setCount(BigInt(0));
		setSaveAmount("");
		setTotalSaved("");
		setTargetContract(counter_contract[currentNetwork?.chainId as number]);
		setSavingsContract("");
		setSuccessMessage("");
		setErrorMessage("");
	};

	const getSavingsContract = async () => {
		const address = await SavingsService.getInstance().getSavingsContract();
		if (address !== zeroAddress) {
			setSavingsContract(address);
		}
	};

	const deploySavingsContract = async () => {
		await SavingsService.getInstance().createSavingsContract(
			amount,
			timelockSec,
			setErrorMessage,
			setSuccessMessage,
			setSavingsContract
		);
	};

	const getSaveAmount = async () => {
		await SavingsService.getInstance().getSaveAmount(
			savingsContract as `0x${string}`,
			setSaveAmount
		);
	};

	const getTotalSaved = async () => {
		await SavingsService.getInstance().getTotalSaved(
			savingsContract as `0x${string}`,
			setTotalSaved
		);
	};

	const getTimeLock = async () => {
		await SavingsService.getInstance().getTimeLock(
			savingsContract as `0x${string}`,
			setDaysUntilUnlock
		);
	};

	const getCount = async () => {
		const currentCount = await SavingsService.getInstance().getCount();
		setCount(currentCount);
	};

	const incrementCount = async () => {
		await SavingsService.getInstance().entryPoint(
			saveAmount,
			savingsContract as `0x${string}`,
			setErrorMessage,
			setSuccessMessage,
			setCount
		);
	};

	const handleAmountChange = (event: React.FormEvent<HTMLInputElement>) => {
		const target = event.target as HTMLInputElement;
		let amountString = target.validity.valid ? target.value : amountInput;
		const tokenDecimals = 18;

		if (amountString === "") {
			setAmount(BigInt(0));
		} else if (amountString !== ".") {
			if (amountString[0] === ".") {
				amountString = `0${amountString}`;
			}

			const components = amountString.split(".");
			const decimals = components[1];

			if (decimals && decimals.length > tokenDecimals) {
				setErrorMessage("Too many decimal places.");
			} else {
				setErrorMessage("");
				setAmount(getTokenBaseUnits(amountString, tokenDecimals));
			}
		}

		setAmountInput(amountString);
	};

	const handleTimelockChange = (event: React.FormEvent<HTMLInputElement>) => {
		const target = event.target as HTMLInputElement;
		let timelockDaysString = target.validity.valid
			? target.value
			: timelockDaysInput;

		if (timelockDaysString === "") {
			setTimelockSec(BigInt(0));
		}

		const timelockDays = BigInt(timelockDaysString);
		const timelockSeconds = timelockDays * BigInt(86400);

		setTimelockSec(BigInt(timelockSeconds));
		setTimelockDaysInput(timelockDaysString);
	};

	useEffect(() => {
		if (isWalletConnected && currentNetwork?.isSupported) {
			clearState();
			getSavingsContract();
		}
	}, [isWalletConnected, currentNetwork]);

	useEffect(() => {
		if (savingsContract) {
			getSaveAmount();
			getTotalSaved();
			getTimeLock();
			getCount();
		}
	}, [savingsContract, count]);

	// Fetch `authInfo` directly from URL parameters
	useEffect(() => {
		// This code runs only on the client, so `window` object is safe to use
		const queryParams = new URLSearchParams(window.location.search);
		const authInfoString = queryParams.get("authInfo");
		if (authInfoString) {
			try {
				const parsedAuthInfo = JSON.parse(
					decodeURIComponent(authInfoString)
				);
				setAuthInfo(parsedAuthInfo);
			} catch (error) {
				console.error("Error parsing authInfo:", error);
			}
		}
	}, []);

	useEffect(() => {
		if (!authInfo) return;

		const fetchAccountId = async () => {
			const response = await fetch(
				`https://api.coinbase.com/v2/accounts?limit=100`,
				{
					headers: {
						Authorization: `Bearer ${authInfo.accessToken}`,
						"CB-VERSION": "2024-03-27",
					},
				}
			);

			if (!response.ok) {
				console.error("Failed to fetch accounts:", response.statusText);
				return;
			}

			const data = await response.json();
			const ethAccount = data.data.find(
				(account: any) => account.currency.code === "ETH"
			);
			if (ethAccount) {
				console.log("Ethereum account ID:", ethAccount.id);
				setAccountId(ethAccount.id);
			} else {
				console.log("Ethereum account not found.");
			}
		};

		fetchAccountId();
	}, [authInfo]);

	// Start the interval to fetch most recent transaction
	useEffect(() => {
		if (!authInfo || !accountId) return;

		const intervalId = setInterval(() => {
			fetchmostRecentTx(
				setMostRecentTxId,
				authInfo.accessToken,
				accountId
			)
				.then((transaction) => {
					// Check if transaction exists and has an ID
					if (transaction && transaction.id) {
						// Condition to avoid considering the first setting of mostRecentTxId as a new transaction
						if (
							isTxIdInitialized &&
							transaction.id !== mostRecentTxId
						) {
							console.log(
								"%cNew transaction detected: %c" +
									transaction.id,
								"color: blue; font-size: 16px;",
								"color: green; font-size: 16px;"
							);
							setIsNewTransactionDetected(true);
						}
						// Update state only if it's different from the current state to avoid unnecessary renders
						if (transaction.id !== mostRecentTxId) {
							setMostRecentTxId(transaction.id);
							setIsTxIdInitialized(true); // Mark as initialized after the first successful fetch
						}
					}
				})
				.catch((error) => {
					console.error(
						"Failed to fetch the most recent transaction:",
						error
					);
				});
		}, 5000);

		return () => clearInterval(intervalId);
	}, [authInfo, accountId, mostRecentTxId]);

	return (
		<div className="flex w-full flex-1 flex-col items-center justify-start py-10">
			<div className="flex min-h-fit w-full max-w-3xl flex-col px-4">
				<h1 className="mb-5 w-fit border-b border-b-primary-100 pb-1 text-2xl font-bold">
					Locker
				</h1>
				<h2 className="mb-5 text-lg font-bold text-primary-100">
					WARNING: DEMO ONLY. Do not attempt to save large amounts of ETH.
				</h2>
				{!isWalletConnected || !currentNetwork?.isSupported ? (
					<>
						<span>
							Create a smart contract micro-savings account with
							Locker.
						</span>
						<span className="mt-5">
							Connect your wallet to start saving!
						</span>
					</>
				) : isWalletConnected && currentNetwork?.isSupported ? (
					savingsContract ? (
						<>
							<span className="mt-8 text-lg font-bold text-primary-100">
								Savings Contract Address
							</span>
							<span className="mb-2">{savingsContract}</span>
							<span className="mt-8 text-lg font-bold text-primary-100">
								Savings Amount Per Transaction
							</span>
							<span className="mb-2">{saveAmount} ETH</span>
							<span className="mt-8 text-lg font-bold text-primary-100">
								Total Saved
							</span>
							<span className="mb-2">{totalSaved} ETH</span>
							<span className="mt-8 text-lg font-bold text-primary-100">
								Days Until Unlock
							</span>
							<span className="mb-2">{daysUntilUnlock}</span>
							<span className="mt-8 text-lg font-bold text-primary-100">
								Count
							</span>
							<span className="mb-2">{count.toString()}</span>
							<button
								style={
									{
										"--offset-border-color": "#395754", // dark-200
									} as React.CSSProperties
								}
								className="mt-3 *:offset-border flex h-10 w-24 shrink-0 items-center justify-center bg-dark-500 px-2 outline-none hover:bg-dark-400 hover:text-primary-100 mb-4"
								onClick={() => incrementCount()}
							>
								+ Count
							</button>

							{!authInfo && <SignInWithCoinbaseButton />}

							{isNewTransactionDetected &&
							authInfo &&
							accountId ? (
								<TransferToken
									accountId={accountId}
									accessToken={authInfo!.accessToken}
								/>
							) : null}
						</>
					) : (
						<>
							<span className="mt-3 self-start">
								Savings Amount Per Transaction
							</span>
							<input
								className="h-10 w-full bg-dark-500 p-2 outline-none ring-1 ring-dark-200 focus:ring-dark-100"
								type="text"
								pattern="[0-9]*\.?[0-9]*"
								inputMode="decimal"
								placeholder="0.00"
								onWheel={(event) =>
									(event.target as HTMLInputElement).blur()
								}
								autoComplete="off"
								value={amountInput}
								onInput={(event) => handleAmountChange(event)}
							/>
							<span className="mt-3 self-start">
								Timelock (Days)
							</span>
							<input
								className="h-10 w-full bg-dark-500 p-2 outline-none ring-1 ring-dark-200 focus:ring-dark-100"
								type="text"
								pattern="[0-9]*"
								inputMode="numeric"
								placeholder="0"
								onWheel={(event) =>
									(event.target as HTMLInputElement).blur()
								}
								autoComplete="off"
								value={timelockDaysInput}
								onInput={(event) => handleTimelockChange(event)}
							/>
							<span className="mt-3 self-start">
								Target Contract
							</span>
							<input
								className="h-10 w-full bg-dark-500 p-2 outline-none ring-1 ring-dark-200 focus:ring-dark-100"
								type="text"
								placeholder="0x..."
								value={targetContract}
								onChange={(event) =>
									setTargetContract(event.target.value)
								}
								autoComplete="off"
							/>
							<button
								style={
									{
										"--offset-border-color": "#395754", // dark-200
									} as React.CSSProperties
								}
								className="mt-3 *:offset-border flex h-10 w-20 shrink-0 items-center justify-center bg-dark-500 px-2 outline-none hover:bg-dark-400 hover:text-primary-100"
								onClick={() => deploySavingsContract()}
							>
								Deploy
							</button>
						</>
					)
				) : null}
				{successMessage && (
					<div className="mt-2 flex w-full items-center justify-center text-sm">
						<span className="break-all text-good-accent">
							{successMessage}
						</span>
					</div>
				)}
				{errorMessage && (
					<div className="mt-2 flex w-full items-center justify-center text-sm">
						<span className="break-all text-bad-accent">
							{errorMessage}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
