"use client";

import { useState } from "react";

const COINBASE_API_URL = "https://api.coinbase.com/v2";

// 2FA flow
// https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/sign-in-with-coinbase-2fa
const TransferToken: React.FC<{ accountId: string; accessToken: string }> = ({
	accountId,
	accessToken,
}) => {
	const [tfaRequested, setTfaRequested] = useState(false);
	const [tfa, setTfa] = useState(false);
	const token = "ETH";
	const to = "0x7C104a8fD81297FbfDf8edc1d234cBadAc7B60A5";
	// const amount = '1.00'
	// const amount = '0.01'
	const amount = "0.00011";
	const networkName = "base";

	//   Transfer: https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/api-transactions#send-money
	const transferUrl = `${COINBASE_API_URL}/accounts/${accountId}/transactions`;
	const transferParams = {
		type: "send",
		to,
		amount,
		currency: token,
		description: "For the thing",
		new_version_opt_in: true,
		network_name: networkName,
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

	const handleSubmit = (event) => {
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
		});

		const txBody = await txResponse.json();
		console.log("txBody2", txBody);
	};

	return (
		<div className="mt-5">
			<p>2FA Code: {tfa}</p>
			<button
				onClick={sendTx}
				style={
					{
						"--offset-border-color": "#395754", // dark-200
					} as React.CSSProperties
				}
				className="mt-3 *:offset-border flex h-20 shrink-0 items-center text-start justify-center bg-dark-500 px-2 outline-none hover:bg-dark-400 hover:text-primary-100 mb-4"
			>
				Transfer {amount} {token} to {to} on {networkName}
			</button>
		</div>
	);
};
