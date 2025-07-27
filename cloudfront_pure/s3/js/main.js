window.addEventListener('DOMContentLoaded', function () {
  // --- サイドバー折りたたみ制御 ---
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const arrow = document.getElementById('sidebar-arrow');
  const content = document.getElementById('sidebar-content');

  if (sidebar && toggleBtn && arrow && content) {
    toggleBtn.addEventListener('click', () => {
      if (!sidebar.classList.contains('collapsed')) {
        // 折りたたみ
        arrow.textContent = '>';
        content.style.opacity = '0';
        setTimeout(() => {
          sidebar.classList.add('collapsed');
          content.style.display = 'none';
        }, 220);
      } else {
        // 展開
        sidebar.classList.remove('collapsed');
        content.style.display = 'flex';
        setTimeout(() => { content.style.opacity = '1'; }, 12);
        arrow.textContent = '<';
      }
    });
  }

  // --- ファイルアップロード制御 ---
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');
  let selectedFiles = [];

  function formatSize(size) {
    if (size >= 1048576) return (size / 1048576).toFixed(2) + ' MB';
    if (size >= 1024) return (size / 1024).toFixed(2) + ' KB';
    return size + ' B';
  }

  function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
      const div = document.createElement('div');
      div.className = 'file-item';
      const text = document.createElement('span');
      text.textContent = `📎 ${file.name} (${formatSize(file.size)})`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'remove-file-btn';
      btn.textContent = '✕';
      btn.addEventListener('click', () => {
        selectedFiles.splice(idx, 1);
        updateFileList();
      });
      div.append(text, btn);
      fileList.appendChild(div);
    });
  }

  fileInput.addEventListener('change', () => {
    const newFiles = Array.from(fileInput.files);
    const maxFiles = 3;
    const maxSize = 8 * 1024 * 1024;
    const totalMax = 10 * 1024 * 1024;

    let combined = [...selectedFiles];
    newFiles.forEach(f => {
      if (!combined.find(sf => sf.name === f.name && sf.size === f.size)) {
        combined.push(f);
      }
    });

    if (combined.length > maxFiles) {
      const prevErr = fileList.querySelector('.error');
      if (prevErr) prevErr.remove();
      const err = document.createElement('div');
      err.className = 'error';
      err.textContent = `最大${maxFiles}ファイルまでです。`;
      fileList.appendChild(err);
      fileInput.value = '';
      return;
    }

    if (newFiles.some(f => f.size > maxSize)) {
      fileList.innerHTML = `<div class="error">1ファイルあたり最大8MBまでです。</div>`;
      fileInput.value = '';
      return;
    }
    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > totalMax) {
      fileList.innerHTML = `<div class="error">ファイル合計が10MBを超えています。</div>`;
      fileInput.value = '';
      return;
    }

    selectedFiles = combined;
    updateFileList();
    fileInput.value = '';
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    selectedFiles = [];
    fileList.innerHTML = '';
    document.getElementById('chat-input').value = '';
  });

  // --- チャット送信／受信ロジック（UI層）---
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatBox = document.getElementById('chat-box');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // 画面にメッセージを追加
    appendMessage('user', message);
    chatInput.value = '';

    // 読み込み中
    appendMessage('assistant', '...');

    try {
      // apiService.js で定義した sendMessage() を呼び出し
      const reply = await window.sendMessage(message);
      // 「…」を消して返信表示
      removeLastLoading();
      appendMessage('assistant', reply);
    } catch (err) {
      removeLastLoading();
      appendMessage('assistant', `エラーが発生しました: ${err.message}`);
    }
  });

  // メッセージをチャットボックスに追加
  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${role}-message`;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // 「…」を最後のメッセージから消す
  function removeLastLoading() {
    const msgs = chatBox.getElementsByClassName('assistant-message');
    if (msgs.length && msgs[msgs.length - 1].textContent === '...') {
      msgs[msgs.length - 1].remove();
    }
  }
});
