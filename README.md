# fido2-test

## 構築
- docker-compose up

## 画面起動
- open localhost

## エンドポイントについて
### 画面
- トップ画面
    - http://localhost/ 

- パスワード入力画面
    - http://localhost/reauth

- ログイン後ホーム画面
    - http://localhost/home

### JSでの操作部
- client.js 66行目付近
```
const cred = await navigator.credentials.create({
  publicKey: options
});
```

- client.js 134行目付近
```
  const cred = await navigator.credentials.get({
    publicKey: options
  });
```

### API
- ユーザー作成 API
    - 用途: アカウントの作成とセッションの作成
    - http://localhost/auth/username

- Key情報を返すAPI
    - 用途: 登録されている鍵情報を返す
    - 備考: 厳密にはユーザーのキャッシュ全体を返す (セッションから、username,id,credentialsの塊を返す)
    - http://localhost/auth/getKeys

#### 初回の生体認証 (FIDO2関連)
- 登録をリクエストするAPI
    - 用途: challengeなどの提供
    - 備考: セッションにチャレンジ情報の紐付け
    - http://localhost/auth/registerRequest

- 認証器に関する情報を登録するAPI
    - 用途: 取得したattestationの検証とユーザー情報の保存
    - http://localhost/auth/registerResponse

#### ２回目以降の生体認証 (FIDO2関連)
- 生体認証でログインを希望するAPI
    - 用途: challenge, 許可されたクレデンシャルに関する情報の返却
    - http://localhost/auth/signinRequest?credId=yDzrGNhH8uJ_PgaqJJzeM_ubQSKwcBCJfGekyqfZKqM

- サインインを要求するAPI
    - 用途: 取得したattestationの検証
    - 備考: リプレイ攻撃対策にカウンタの更新なども行っている。
    - http://localhost/auth/signinResponse


## 関連
- Google codelab
    - https://developers.google.com/codelabs/webauthn-reauth?hl=ja#0
