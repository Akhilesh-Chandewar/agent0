"use client";

import React, { useState } from "react";

export default function DemoWindow() {
    const [messages, setMessages] = useState([
        { id: 1, from: "agent", text: "Hello — I am your agent. How can I help?" },
    ]);
    const [input, setInput] = useState("");

    function send() {
        if (!input.trim()) return;
        const next = { id: Date.now(), from: "user", text: input };
        setMessages((m) => [...m, next]);
        setInput("");
        // simple echo demo to simulate flow
        setTimeout(() => {
            setMessages((m) => [...m, { id: Date.now() + 1, from: "agent", text: `Agent reply to: ${next.text}` }]);
        }, 600);
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-2 space-y-2 bg-slate-50">
                {messages.map((m) => (
                    <div key={m.id} className={m.from === "agent" ? "text-left" : "text-right"}>
                        <div className="inline-block px-3 py-1 rounded-md bg-white shadow-sm">{m.text}</div>
                    </div>
                ))}
            </div>
            <div className="p-2 border-t flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-2 border rounded" />
                <button onClick={send} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
            </div>
        </div>
    );
}
