/*
 * @license
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
export const _fetch = async (path, payload = "") => {
  const headers = {
    "X-Requested-With": "XMLHttpRequest"
  };
  if (payload && !(payload instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(payload);
  }
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: headers,
    body: payload
  });
  if (res.status === 200) {
    // Server authentication succeeded
    return res.json();
  } else {
    // Server authentication failed
    const result = await res.json();
    throw result.error;
  }
};

// サーバーのエンドポイントからチャレンジとその他のオプションを取得する
export const registerCredential = async () => {
  const opts = {
    attestation: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      requireResidentKey: false
    }
  };

  // optionのデータを取得
  const options = await _fetch("/auth/registerRequest", opts);
  // console.log (options);

  // 文字列としてbase64urlエンコードしてたのでデコードしてバリナリに戻す
  options.user.id = base64url.decode(options.user.id);
  options.challenge = base64url.decode(options.challenge);

  if (options.excludeCredentials) {
    for (let cred of options.excludeCredentials) {
      cred.id = base64url.decode(cred.id);
    }
  }

  // console.log ("========= authenticatorAttachment platform =============");
  // options.authenticatorSelection.authenticatorAttachment = "platform";
  // const cred1 = await navigator.credentials.create({ publicKey: options });

  // console.log ("========= authenticatorAttachment cross-platform =============");
  // options.authenticatorSelection.authenticatorAttachment = "cross-platform";
  // const cred2 = await navigator.credentials.create({ publicKey: options });

  // console.log ("========= userVerification required =============");
  // options.authenticatorSelection.userVerification = "discouraged";
  // console.log (options.authenticatorSelection.userVerification);

  // 認証の選択肢をもたせる
  // delete options.authenticatorSelection.authenticatorAttachment

  // attestationの指定の変更
  // options.attestation = 'enterprise'

  console.log("====== [option] =======");
  console.log(options)

  // 新しいクレデンシャルを作る
  const cred = await navigator.credentials.create({
    publicKey: options
  });

  console.log(cred.response.getTransports())
  // ['internal']

  console.log("====== [cred] =======");
  console.log(cred)

  // クレデンシャルを登録する際に受け取ったオプションオブジェクトと同様、
  // クレデンシャルのバイナリパラメータをエンコードして、
  // 文字列としてサーバーに送信できるようにする
  const credential = {};
  credential.id = cred.id;
  credential.rawId = base64url.encode(cred.rawId);
  credential.type = cred.type;

  if (cred.response) {
    const clientDataJSON = base64url.encode(cred.response.clientDataJSON);
    const attestationObject = base64url.encode(cred.response.attestationObject);
    credential.response = {
      clientDataJSON,
      attestationObject
    };
  }

  // ユーザーが戻ってきた時に認証に使用できるよう、クレデンシャル ID をローカルに保存
  localStorage.setItem(`credId`, credential.id);

  // クレデンシャルをサーバーのエンドポイントに登録する
  return await _fetch("/auth/registerResponse", credential);
};

// クレデンシャルを削除
export const unregisterCredential = async credId => {
  localStorage.removeItem("credId");
  return _fetch(`/auth/removeKey?credId=${encodeURIComponent(credId)}`);
};

// 指紋を使用してユーザーの身元を確認する
export const authenticate = async () => {
  // サーバーのエンドポイントからチャレンジとその他のオプションを取得

  // ブラウザがクレデンシャル ID を保存しているかを調べ、
  //ある場合はそれをクエリパラメータとして設定
  const opts = {};

  let url = "/auth/signinRequest";
  const credId = localStorage.getItem(`credId`);
  if (credId) {
    url += `?credId=${encodeURIComponent(credId)}`;
  }

  // サーバーにチャレンジとその他のパラメーターをリクエストします。opts を引数として
  // _fetch() を呼び出し、POST リクエストをサーバーに送る
  const options = await _fetch(url, opts);

  // allowCredentials が空の配列の場合は null でリゾルブして WebAuthn をスキップ
  if (options.allowCredentials.length === 0) {
    console.info("No registered credentials found.");
    return Promise.resolve(null);
  }

  // challenge および allowCredentials という配列に含まれる id を、バイナリーに変換する
  options.challenge = base64url.decode(options.challenge);

  for (let cred of options.allowCredentials) {
    cred.id = base64url.decode(cred.id);
  }

  // navigator.credentials.get() を呼び出して、
  // 指紋センサーまたは画面ロックを使用してユーザーのアイデンティティを検証

  const cred = await navigator.credentials.get({
    publicKey: options
  });

  // クレデンシャルを検証する
  const credential = {};
  credential.id = cred.id;
  credential.type = cred.type;
  credential.rawId = base64url.encode(cred.rawId);

  if (cred.response) {
    const clientDataJSON = base64url.encode(cred.response.clientDataJSON);
    const authenticatorData = base64url.encode(cred.response.authenticatorData);
    const signature = base64url.encode(cred.response.signature);
    const userHandle = base64url.encode(cred.response.userHandle);
    credential.response = {
      clientDataJSON,
      authenticatorData,
      signature,
      userHandle
    };
  }
  
  return await _fetch(`/auth/signinResponse`, credential);
  
};

// TODO (1): Register a credential using a fingerprint
// 1. Create `registerCredential()` function
// 2. Obtain the challenge and other options from server endpoint: `/auth/registerRequest`
// 3. Create a credential
// 4. Register the credential to the server endpoint: `/auth/registerResponse`

// TODO (2): Build the UI to register, get and remove credentials
// 3. Remove the credential: `removeCredential()`

// TODO (3): Authenticate the user with a fingerprint
// 1. Create `authetnicate()` function
// 2. Obtain the challenge and other options from server
// 3. Locally verify the user and get a credential
// 4. Verify the credential: `/auth/signinResponse`
