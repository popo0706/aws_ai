import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
    const [msg, setMsg] = useState("");
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);

    const sendChat = async () => {
        if (!msg.trim()) { alert("メッセージを入力してください"); return; }
        setLoading(true);
        setReply("…問い合わせ中…");
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setReply(data.reply || "(応答が空でした)");
        } catch (err) {
            setReply("エラーが発生しました: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold mb-6">Bedrock チャットボット</h1>
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <textarea
                    className="w-full h-24 p-2 border rounded"
                    placeholder="こんにちは"
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                />
                <button
                    className={`mt-4 w-full py-2 rounded ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                    onClick={sendChat}
                    disabled={loading}
                >
                    {loading ? "送信中…" : "送信"}
                </button>
                <div className="mt-4 bg-blue-50 p-4 rounded whitespace-pre-wrap">
                    {reply}
                </div>
            </div>
        </div>
    );
}

export default App;
