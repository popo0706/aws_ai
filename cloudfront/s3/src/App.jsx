import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
    const [msg, setMsg] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const sendChat = async () => {
        const trimmed = msg.trim();
        if (!trimmed) { alert("メッセージを入力してください"); return; }
        setLoading(true);
        setMessages([{ sender: 'user', text: trimmed }]);
        setMsg("");
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const botText = data.reply || "(応答が空でした)";
            setMessages(prev => [...prev, { sender: 'bot', text: botText }]);
        } catch (err) {
            const errorText = "エラーが発生しました: " + err.message;
            setMessages(prev => [...prev, { sender: 'bot', text: errorText }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold mb-6">Bedrock チャットボット</h1>
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-2 mb-4 h-64">
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`max-w-xs px-4 py-2 rounded-lg ${m.sender === 'user'
                                ? 'self-end bg-blue-600 text-white rounded-bl-lg'
                                : 'self-start bg-gray-200 text-gray-800 rounded-br-lg'
                                }`}
                        >
                            {m.text}
                        </div>
                    ))}
                    {loading && (
                        <div className="self-start bg-gray-200 text-gray-800 max-w-xs px-4 py-2 rounded-lg rounded-br-lg">
                            …
                        </div>
                    )}
                </div>
                <textarea
                    className="w-full h-20 p-2 border rounded mb-2"
                    placeholder="こんにちは"
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                />
                <button
                    className={`w-full py-2 rounded ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    onClick={sendChat}
                    disabled={loading}
                >
                    {loading ? '送信中…' : '送信'}
                </button>
            </div>
        </div>
    );
}

export default App;
