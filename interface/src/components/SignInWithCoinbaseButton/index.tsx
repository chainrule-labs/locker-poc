"use client";

import { useRouter } from "next/navigation";

const coinbaseCallbackUrl = process.env.NEXT_PUBLIC_COINBASE_CALLBACK_URL;
const coinbaseClientId = process.env.NEXT_PUBLIC_COINBASE_CLIENT_ID;

export default function SignInWithCoinbaseButton() {
	const router = useRouter();

	function handleClick() {
		const scopes = [
			"wallet:accounts:read",
			"wallet:addresses:read",
			"wallet:transactions:read",
			"wallet:withdrawals:read",
			"wallet:sells:read",
			"wallet:buys:read",
			"wallet:transactions:send",
			// Does not work
			// 'wallet:transactions:send:bypass_2fa',
		];

		// State not currently being used
		const userId = "abc123";
		const state = window.btoa(JSON.stringify({ userId }));

		const coinbaseUrl =
			`https://www.coinbase.com/oauth/authorize?response_type=code&` +
			`client_id=${coinbaseClientId}` +
			`&redirect_uri=${coinbaseCallbackUrl}` +
			`&state=${state}&scope=${scopes.join(",")}` +
			`&account=all`;

		router.push(coinbaseUrl);
	}

	return (
		<div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
			<button
				style={
					{
						"--offset-border-color": "#395754", // dark-200
					} as React.CSSProperties
				}
				className="mt-3 *:offset-border flex h-12 shrink-0 items-center justify-center bg-dark-500 px-2 outline-none hover:bg-dark-400 hover:text-primary-100 mb-4"
				onClick={handleClick}
			>
				Sign in with Coinbase
			</button>
		</div>
	);
}
