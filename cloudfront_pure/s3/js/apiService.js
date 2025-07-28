/**
 * apiService.js
 * 会話履歴（messages）をサーバに送信し、AIの返信を受け取るモジュール
 */
(() => {
  // ───────────────
  // ★CloudFront のドメイン名をここに入れてください★
  // 例: 'https://d1234abcd.cloudfront.net'
  // ───────────────
  const CF_DOMAIN = 'https://<YOUR_CLOUDFRONT_DOMAIN>';
  // CloudFront 配下の /chat にフォワード設定をしている想定
  const API_ENDPOINT = 'https://e2ynqgidlnt53krhmlt6em4jrm0rnyai.lambda-url.ap-northeast-1.on.aws/';

  /**
   * メッセージ履歴を送信し、AI の返信テキストを返す
   * @param {{role: string, content: string}[]} chatHistory 会話履歴
   * @returns {Promise<string>} AI の返信テキスト
   */
  async function sendMessage(chatHistory) {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // body は "messages" 配列そのまま送る
      body: JSON.stringify({ messages: chatHistory }),
    });
    if (!res.ok) {
      // ネットワークやステータスコード異常をそのまま投げる
      throw new Error(`HTTPエラー ${res.status}`);
    }
    const data = await res.json();
    return data.reply; // { reply: "..." } の reply を返す
  }

  // 他スクリプトから呼べるように global に登録
  window.sendMessage = sendMessage;
})();
