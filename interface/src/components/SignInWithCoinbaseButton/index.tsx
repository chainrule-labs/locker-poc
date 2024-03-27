"use client"

import { useRouter } from 'next/navigation';

const coinbaseCallbackUrl = process.env.NEXT_PUBLIC_COINBASE_CALLBACK_URL
const coinbaseClientId = process.env.NEXT_PUBLIC_COINBASE_CLIENT_ID

export default function SignInWithCoinbaseButton() {
    const router = useRouter();

    function handleClick() {
        const scopes = [      
            'wallet:accounts:read',
            'wallet:addresses:read',
            'wallet:transactions:read',
            'wallet:withdrawals:read',
            'wallet:sells:read',
            'wallet:buys:read',
            'wallet:transactions:send'
            // Does not work
            // 'wallet:transactions:send:bypass_2fa',
        ]

        // State not currently being used
        const userId = 'abc123'
        const state = window.btoa(JSON.stringify({ userId }));

        const coinbaseUrl =
        `https://www.coinbase.com/oauth/authorize?response_type=code&` +
        `client_id=${coinbaseClientId}` +
        `&redirect_uri=${coinbaseCallbackUrl}` +
        `&state=${state}&scope=${scopes.join(',')}` +
        `&account=all`;

        router.push(coinbaseUrl);
        }

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <button className="bg-slate-500 rounded-md p-4" onClick={handleClick}>Sign in with Coinbase</button>
        </div>
        </main>
    );
}
