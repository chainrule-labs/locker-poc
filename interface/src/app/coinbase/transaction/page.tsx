const COINBASE_API_URL = "https://api.coinbase.com/v2";

// Function to fetch the most recent transaction for a specific Ethereum account
export default async function fetchmostRecentTx(
	setMostRecentTxId: (value: string) => void,
	accessToken: string,
	accountId: string
) {
	const TRANSACTIONS_URL = `${COINBASE_API_URL}/accounts/${accountId}/transactions`;

	console.log(
		`Fetching the most recent transaction for account ${accountId}`
	);

	try {
		const response = await fetch(TRANSACTIONS_URL, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"CB-VERSION": "2024-03-27",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Error fetching transactions: ${response.statusText}`
			);
		}

		const transactionsData = await response.json();
		console.log("Most recent transaction fetched successfully.");

		// Check if there are any transactions returned
		if (transactionsData.data && transactionsData.data.length > 0) {
			// Return the most recent transaction
			const mostRecentTx = transactionsData.data[0];
			console.log(mostRecentTx); // For debugging, remove in production
			setMostRecentTxId(mostRecentTx.id as string);
			return mostRecentTx;
		} else {
			console.log("No transactions found.");
			return null; // Or handle as appropriate if no transactions are found
		}
	} catch (error) {
		console.error("Failed to fetch the most recent transaction:", error);
		return null; // Or handle the error as appropriate
	}
}
