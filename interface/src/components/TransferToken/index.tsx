"use client";

import { useState } from "react";

const COINBASE_API_URL = "https://api.coinbase.com/v2";

// 2FA flow
// https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/sign-in-with-coinbase-2fa
export default function TransferToken({ accountId, accessToken }: any) {
	const [tfaRequested, setTfaRequested] = useState(false);
	const [successfulTransfer, setSuccessfulTransfer] = useState(false);
	const [tfa, setTfa] = useState(false);
	const token = "ETH";
	const to = "0xDe076D651613C7bde3260B8B69C860D67Bc16f49";
	// const amount = '1.00'
	// const amount = '0.01'
	const amount = "0.00011";
	const networkName = "Ethereum Mainnet";

	//   Transfer: https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/api-transactions#send-money
	const transferUrl = `${COINBASE_API_URL}/accounts/${accountId}/transactions`;
	const transferParams = {
		type: "send",
		to,
		amount,
		currency: token,
		description: "For the thing",
	};

	console.log("transferParams", transferParams);

	const gen2FA = async () => {
		const txResponse = await fetch(transferUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify(transferParams),
		});

		const txBody = await txResponse.json();
		console.log("txBody1", txBody);
		setTfaRequested(true);
	};

	const handleSubmit = (event: any) => {
		event.preventDefault();
		const formVal = event.target.elements.tfaInput.value;
		console.log("formVal", formVal);
		setTfa(formVal);
	};

	if (!tfaRequested)
		return (
			<button
				onClick={gen2FA}
				style={
					{
						"--offset-border-color": "#395754", // dark-200
					} as React.CSSProperties
				}
				className="mt-3 *:offset-border flex h-12 shrink-0 items-center justify-center bg-dark-500 px-2 outline-none hover:bg-dark-400 hover:text-primary-100 mb-4"
			>
				Transfer Savings
			</button>
		);

	if (!tfa)
		return (
			<form onSubmit={handleSubmit}>
				<label htmlFor="tfaInput">
					Enter 2FA:
					<input
						className="h-10 w-full bg-dark-500 p-2 outline-none ring-1 ring-dark-200 focus:ring-dark-100"
						id="tfaInput"
						type="text"
						required
					/>
				</label>
				<button
					type="submit"
					style={
						{
							"--offset-border-color": "#395754", // dark-200
						} as React.CSSProperties
					}
					className="mt-3 *:offset-border flex h-14 shrink-0 items-center justify-center bg-dark-500 px-2 outline-none hover:bg-dark-400 hover:text-primary-100 mb-4"
				>
					Submit
				</button>
			</form>
		);

	const sendTx = async () => {
		const txResponse = await fetch(transferUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"CB-2FA-TOKEN": tfa,
				"CB-VERSION": "2024-03-27",
			},
			body: JSON.stringify(transferParams),
		} as any);

		const txBody = await txResponse.json();

		if (txResponse.ok) {
			setSuccessfulTransfer(true);
		} else {
			throw new Error(`Error transferring from Coinbase.`);
		}

		console.log("txBody2", txBody);
	};

	return (
		<div className="mt-5">
			{successfulTransfer ? (
				<div className="mt-2 flex w-full flex-col items-center justify-center text-sm">
					<span className="break-all text-good-accent">
						Successfull Transfer!
					</span>
					<a
						className=" mt-5 text-blue-500 hover:text-blue-400"
						href={`https://etherscan.io/address/${to}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<span>View on explorer</span>
					</a>
				</div>
			) : (
				<>
					<p>2FA Code: {tfa}</p>
					<button
						style={
							{
								"--offset-border-color": "#395754", // dark-200
							} as React.CSSProperties
						}
						className="mt-3 *:offset-border flex h-20 shrink-0 items-center text-start justify-center bg-dark-500 px-2 outline-none hover:bg-dark-400 hover:text-primary-100 mb-4"
					>
						Coinbase transfer temporarily deactivated
					</button>
				</>
			)}
		</div>
	);
}
