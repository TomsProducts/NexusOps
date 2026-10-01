"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { sendAiChat, fetchServers } from "@/lib/api";
import { Server } from "@/lib/types";
import { Bot, Send, User, Sparkles, Server as ServerIcon } from "lucide-react";

interface Message {
  sender: "ai" | "user";
  text: string;
}

export default function AiAssistantPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "NexusOps AI Assistant connected to 9Router (ag/gemini-3.8-flash). I am actively monitoring your live servers. How can I assist you with infrastructure health, metrics, or diagnostic triage?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServers().then((srvs) => {
      setServers(srvs);
      if (srvs.length > 0) {
        const names = srvs.map((s) => `${s.displayName} (${s.ipAddress})`).join(" and ");
        setMessages([
          {
            sender: "ai",
            text: `NexusOps AI Assistant connected to 9Router. Telemetry is streaming live from ${names}. All systems operational. How can I assist?`,
          },
        ]);
      }
    });
  }, []);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend || loading) return;

    if (!customText) setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setLoading(true);

    const reply = await sendAiChat(textToSend);
    setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="AI Assistant" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e8f1ff]">AI Operations Assistant</h1>
          <p className="text-xs text-[#71839e] mt-1">Direct natural language reasoning powered by 9Router over live infrastructure telemetry</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Window */}
          <div className="lg:col-span-8 card-glass p-5 flex flex-col h-[650px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      m.sender === "ai"
                        ? "bg-cyberCyan/15 text-cyberCyan border border-cyberCyan/30 shadow-[0_0_10px_rgba(25,217,255,0.2)]"
                        : "bg-cyberPurple/20 text-[#dce9fa] border border-cyberPurple/40"
                    }`}
                  >
                    {m.sender === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      m.sender === "ai"
                        ? "bg-[#091222] border-lineDark text-[#dbe6f5] whitespace-pre-line"
                        : "bg-[#0c182b] border-cyberCyan/30 text-[#eef4ff]"
                    }`}
                  >
                    <b className="block text-[10px] text-[#6d829e] mb-1 uppercase tracking-wider">
                      {m.sender === "ai" ? "NexusOps 9Router AI" : "Operator"}
                    </b>
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 text-xs text-[#71839e] items-center">
                  <Bot className="w-4 h-4 text-cyberCyan animate-spin" />
                  <span>Consulting 9Router AI engine (ag/gemini-3.8-flash)...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-4 border-t border-lineDark flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about live fleet health, resource bottlenecks, or recommended remediation..."
                className="flex-1 bg-[#060c18] border border-lineDark rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyberCyan transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading}
                className="bg-cyberCyan hover:bg-cyberCyan/90 text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(25,217,255,0.3)] flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>

          {/* Quick Prompts & Context Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card-glass p-5">
              <h3 className="text-xs font-bold text-[#e8f1ff] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyberCyan" /> Suggested Questions
              </h3>
              <p className="text-[10px] text-[#71839e] mb-4">
                Click any suggestion to run an instant analysis on the live servers:
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => handleSend("What is the current health status of DeployCasaServer and Desktop?")}
                  className="w-full text-left p-3 bg-[#060d19] hover:bg-[#0b1629] rounded-lg border border-lineDark hover:border-cyberCyan/40 transition-all text-xs text-[#dbe6f5]"
                >
                  <b className="text-cyberCyan block text-[11px] mb-0.5">Fleet Overview</b>
                  Summarize health of DeployCasaServer & Desktop
                </button>

                <button
                  onClick={() => handleSend("Analyze CPU and memory usage trends across the fleet.")}
                  className="w-full text-left p-3 bg-[#060d19] hover:bg-[#0b1629] rounded-lg border border-lineDark hover:border-cyberCyan/40 transition-all text-xs text-[#dbe6f5]"
                >
                  <b className="text-cyberPurple block text-[11px] mb-0.5">Resource Breakdown</b>
                  Analyze CPU and memory usage trends
                </button>

                <button
                  onClick={() => handleSend("Are there any policy violations or abnormal metric spikes?")}
                  className="w-full text-left p-3 bg-[#060d19] hover:bg-[#0b1629] rounded-lg border border-lineDark hover:border-cyberCyan/40 transition-all text-xs text-[#dbe6f5]"
                >
                  <b className="text-cyberGreen block text-[11px] mb-0.5">Anomaly Scan</b>
                  Scan for policy violations or abnormal spikes
                </button>
              </div>
            </div>

            <div className="card-glass p-5">
              <h3 className="text-xs font-bold text-[#e8f1ff] mb-2 flex items-center gap-2">
                <ServerIcon className="w-4 h-4 text-cyberCyan" /> Monitored Hosts Context
              </h3>
              <div className="space-y-2 text-xs">
                {servers.map((s) => (
                  <div key={s.id} className="p-2.5 bg-[#050b16] rounded-lg border border-lineDark flex justify-between items-center">
                    <div>
                      <b className="text-[#e8f1ff] block text-xs">{s.displayName}</b>
                      <span className="text-[10px] text-[#71839e]">{s.ipAddress}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-cyberGreen/20 text-cyberGreen font-bold">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
