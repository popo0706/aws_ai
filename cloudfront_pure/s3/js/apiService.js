/**
 * apiService.js
 * Clean Architecture の「インフラ層」に相当する、
 * API 呼び出しだけをまとめたロジックです。
 */
(() => {
  // CloudFront 経由で /chat に届く想定のエンドポイント
  const API_ENDPOINT =
    'https://4b426sq963.execute-api.ap-northeast-1.amazonaws.com/prod/chat';

  /**
   * メッセージを送信し、AI の返信を文字列で返す
   * @param {string} message ユーザー入力
   * @returns {Promise<string>} AI の返信テキスト
   */
  async function sendMessage(message) {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      throw new Error(`HTTPエラー ${res.status}`);
    }
    const data = await res.json();
    return data.reply;
  }

  // 他のスクリプトから sendMessage() を呼び出せるように window に登録
  window.sendMessage = sendMessage;
})();
