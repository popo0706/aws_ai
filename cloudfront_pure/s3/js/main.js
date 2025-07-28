/**
 * main.js（読み込み中プレースホルダー削除問題を修正した最新版 全量）
 * ・サイドバー制御
 * ・チャット履歴管理
 * ・送受信ロジック
 * ・テキストエリア自動リサイズ
 * ・メッセージコピー機能
 */
window.addEventListener('DOMContentLoaded', function () {
  // --- サイドバー折りたたみ制御 ---
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // --- チャット送信／受信ロジック ---
  const chatForm  = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatBox   = document.getElementById('chat-box');

  // 会話履歴を保持する配列
  const chatHistory = [];

  // 自動リサイズ: 入力内容に応じて高さを調整
  chatInput.addEventListener('input', function () {
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

  // 送信時の処理
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // ユーザー発言を追加
    appendMessage('user', message);
    chatHistory.push({ role: 'user', content: message });

    // 入力欄をクリア＆高さリセット
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';

    // 読み込み中マークを追加
    appendMessage('assistant', '…');

    try {
      // 全履歴を送信
      const reply = await window.sendMessage(chatHistory);

      // 読み込み中マークを確実に削除
      removeLastLoading();

      // AI応答を追加
      appendMessage('assistant', reply);
      chatHistory.push({ role: 'assistant', content: reply });
    } catch (err) {
      removeLastLoading();
      appendMessage('assistant', `エラーが発生しました: ${err.message}`);
    }
  });

  // --- 新しい会話開始（クリア）ボタン ---
  document.getElementById('clear-btn').addEventListener('click', () => {
    chatHistory.length = 0;
    chatBox.innerHTML   = '';
    const fileList = document.getElementById('file-list');
    if (fileList) fileList.innerHTML = '';
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value   = '';
    chatInput.value    = '';
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

    // テキスト用コンテナ
    const content = document.createElement('div');
    content.className = 'message-text';
    content.textContent = text;
    msg.appendChild(content);

    // コピー用ボタン
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('title', 'コピー');
    copyBtn.setAttribute('data-tooltip', 'コピー');
    copyBtn.setAttribute('aria-label', 'コピー');
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/>
      </svg>`;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(text)
        .then(() => {
          copyBtn.textContent = '✓';
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0-2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/>
              </svg>`;
          }, 1000);
        })
        .catch(err => console.error('コピーに失敗しました', err));
    });
    msg.appendChild(copyBtn);

    chatBox.appendChild(msg);
    window.scrollTo({
      top: document.getElementById('main-content').scrollHeight,
      behavior: 'smooth'
    });
  }

  /**
   * 読み込み中マーク「…」を削除（修正）
   * - 単純に最後の .assistant-message を見るのではなく、
   *   「message-text」の中身が「…」の要素を探して消す
   */
  function removeLastLoading() {
    // 「…」というテキストの .message-text 要素をリストで取得
    const loadingElems = chatBox.querySelectorAll('.assistant-message .message-text');
    // 後ろから探して、最初に「…」を見つけたらその親（チャットバブル）ごと消す
    for (let i = loadingElems.length - 1; i >= 0; i--) {
      if (loadingElems[i].textContent === '…') {
        loadingElems[i].parentElement.remove();
        break;
      }
    }
  }
});
