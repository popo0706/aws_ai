/**
 * main.js
 * サイドバー制御＋チャット履歴管理＋送受信ロジック＋テキストエリア自動リサイズ
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

  // 自動リサイズ: 入力内容に応じて高さを調整
  chatInput.addEventListener('input', function () {
    // 一度高さを自動に戻してから scrollHeight 分だけ伸ばす
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
  });

  // Ctrl+Enter で送信
  chatInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (typeof chatForm.requestSubmit === 'function') {
        chatForm.requestSubmit();
      } else {
        chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  });

  // 送信ボタン（submit）押下時
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // ユーザー発言を追加
    appendMessage('user', message);
    chatHistory.push({ role: 'user', content: message });

    // 送信後、入力欄リセット＆高さリセット
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';

    // 読み込み中マーク
    appendMessage('assistant', '…');

    try {
      // 履歴ごと送信
      const reply = await window.sendMessage(chatHistory);
      // 読み込み中を削除して応答追加
      removeLastLoading();
      appendMessage('assistant', reply);
      chatHistory.push({ role: 'assistant', content: reply });
    } catch (err) {
      removeLastLoading();
      appendMessage('assistant', `エラーが発生しました: ${err.message}`);
    }
  });

  // --- 新しい会話開始（クリア）ボタン ---
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.addEventListener('click', () => {
    // 履歴をリセット
    chatHistory.length = 0;
    // 画面のメッセージをクリア
    chatBox.innerHTML = '';
    // 添付ファイルリストをクリア
    const fileList = document.getElementById('file-list');
    if (fileList) fileList.innerHTML = '';
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
    // 入力欄をクリア＆高さリセット＆フォーカス
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
    chatInput.focus();
  });

  /**
   * メッセージをチャットボックスに追加
   * @param {'user'|'assistant'} role
   * @param {string} text
   */
  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${role}-message`;
    msg.textContent = text;
    chatBox.appendChild(msg);
    // メインエリアをスクロール
    window.scrollTo({
      top: document.getElementById('main-content').scrollHeight,
      behavior: 'smooth'
    });
  }

  /** 読み込み中マーク「…」を削除 */
  function removeLastLoading() {
    const msgs = chatBox.getElementsByClassName('assistant-message');
    if (msgs.length && msgs[msgs.length - 1].textContent === '…') {
      msgs[msgs.length - 1].remove();
    }
  }
});
