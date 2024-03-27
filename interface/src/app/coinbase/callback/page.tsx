import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import qs from 'qs'

interface CoinbaseCodeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface CoinbaseState {
  userId: string;
}

// https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/sign-in-with-coinbase-integration#2-coinbase-redirects-back-to-your-site
export default async function GET(req: NextRequest) {
    console.log("processing coinbase callback")
    console.log(req)

    const {state: stateParam, code: codeParam} = req.searchParams

  // const state = JSON.parse(
  //   Buffer.from(stateParam, 'base64').toString()
  // ) as CoinbaseState;

  const formData = qs.stringify({
    grant_type: 'authorization_code',
    code: codeParam,
    client_id: process.env.NEXT_PUBLIC_COINBASE_CLIENT_ID!,
    client_secret: process.env.COINBASE_CLIENT_SECRET!,
    redirect_uri: process.env.NEXT_PUBLIC_COINBASE_CALLBACK_URL!,
  });

  console.log("formData", formData)

  const response = await fetch('https://api.coinbase.com/oauth/token', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const coinbaseKeys: CoinbaseCodeResponse = await response.json();

  console.log("coinbaseKeys", coinbaseKeys)

  const userResponse = await fetch('https://api.coinbase.com/v2/user', {
    headers: {
      Authorization: `Bearer ${coinbaseKeys.access_token}`,
      'CB-VERSION': '2024-03-27',
    },
  });

  const responseJson = await userResponse.json();
  const {
    data: { id: coinbaseId },
  } = responseJson;


  // Prod
    //   const host = '';

  // Dev
  const host = 'http://localhost:3000'

  const authInfo = {
    accessToken: coinbaseKeys.access_token,
    refreshToken: coinbaseKeys.refresh_token,
    expiresAt: Date.now() / 1000 + coinbaseKeys.expires_in,
    scope: coinbaseKeys.scope,
    coinbaseId,
  };
  console.log("authInfo", authInfo)

  const redirectTo = `${host}/?authInfo=${JSON.stringify(authInfo)}`;

  redirect(redirectTo);
}