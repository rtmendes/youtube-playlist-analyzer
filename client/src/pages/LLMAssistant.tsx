import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Bot } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function LLMAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm your POD Ideation Assistant powered by Grok 2. I'll help you develop print-on-demand product ideas based on YouTube comments and engagement data. What would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    // Simulate response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "This comment shows strong buyer intent with emotional engagement and has received significant engagement. Here are some POD ideas:\n\n**T-Shirt Concepts:**\n- Minimalist design with the quote in a gaming-inspired font\n- Quote with subtle gaming controller background elements\n\n**Expansion Ideas:**\n- Hoodie version with the same design\n- Gaming mug with the quote\n- Wall art for gaming rooms\n\n**Target Audience:**\nGamers who follow gaming content creators and engage with gaming humor.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">LLM Ideation Assistant</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LLM Selection</CardTitle>
              <CardDescription>Choose your preferred AI model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded border bg-muted/50">
                  <span>Grok 2</span>
                  <span className="text-xs text-muted-foreground">General purpose</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span>Claude 3.7</span>
                  <span className="text-xs text-muted-foreground">Visual design focus</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded border">
                  <span>GPT-4o</span>
                  <span className="text-xs text-muted-foreground">Balanced capabilities</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">Add Custom Model</Button>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">OpenRouter Integration</p>
                <p className="text-xs text-muted-foreground">Choose from 100+ models through OpenRouter API.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Context Providers</CardTitle>
              <CardDescription>Data sources for the assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">YouTube comments, saved opportunities, and marketplace data can be included as context.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 flex flex-col pt-6 min-h-0">
              <div className="flex-1 overflow-auto space-y-4 mb-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask about POD ideas, comment intent, or design concepts..."
                  className="min-h-[80px] resize-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <Button onClick={handleSend} size="icon" className="shrink-0 h-10 w-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
