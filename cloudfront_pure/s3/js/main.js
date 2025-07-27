/**
 * main.js
 * サイドバー制御＋チャット履歴管理＋送受信ロジック
 */
window.addEventListener('DOMContentLoaded', function () {
  // --- サイドバー折りたたみ制御 ---
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // --- チャット送信／受信ロジック ---
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatBox = document.getElementById('chat-box');

  // 会話履歴を保持する配列
  const chatHistory = [];

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // ① ユーザー発言を画面と履歴に追加
    appendMessage('user', message);
    chatHistory.push({ role: 'user', content: message });
    chatInput.value = '';

    // ② 読み込み中表示
    appendMessage('assistant', '…');

    try {
      // ③ 履歴ごとサーバに送信
      const reply = await window.sendMessage(chatHistory);

      // ④ 読み込み中を消して、AI応答を画面・履歴に追加
      removeLastLoading();
      appendMessage('assistant', reply);
      chatHistory.push({ role: 'assistant', content: reply });
    } catch (err) {
      removeLastLoading();
      appendMessage('assistant', `エラーが発生しました: ${err.message}`);
    }
  });

  /**
   * チャットボックスにメッセージを追加する
   * @param {'user'|'assistant'} role
   * @param {string} text
   */
  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${role}-message`;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /** 「…」の読み込み中メッセージを消す */
  function removeLastLoading() {
    const msgs = chatBox.getElementsByClassName('assistant-message');
    if (msgs.length && msgs[msgs.length - 1].textContent === '…') {
      msgs[msgs.length - 1].remove();
    }
  }
});
