'use client'

import { useState, useRef, useEffect } from 'react';
import { Card, CardBody, CardHeader, Input, Button, Avatar, Chip, Divider } from '@nextui-org/react';
import { Send, Sparkles, User, Bot, Lightbulb, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    type: string;
    id: string;
    title: string;
    similarity: number;
  }>;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  '有哪些关于社会网络分析的数据集？',
  '如何研究选举投票行为？',
  '推荐一些教育相关的案例集',
  '有什么数据适合做收入不平等研究？',
  '介绍一下平台的功能',
  '如何上传数据集？'
];

const WELCOME_MESSAGE = `你好！我是 UCASS DataShare 的 AI 助手 👋

我可以帮助你：
- 🔍 查找相关的数据集和案例集
- 💡 推荐合适的研究资源
- 📚 解答平台使用问题
- 🎓 提供研究方法建议

请随时向我提问！`;

export default function AIChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 构建对话历史（只传递文本内容）
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('http://localhost:30002/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history
        })
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);

      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // 使用建议问题
  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  // 清空对话
  const handleClearChat = () => {
    if (confirm('确定要清空对话记录吗？')) {
      setMessages([
        {
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: new Date()
        }
      ]);
    }
  };

  const getTypeLabel = (type: string) => type === 'dataset' ? '数据集' : '案例集';
  const getTypeColor = (type: string) => type === 'dataset' ? 'danger' : 'success';
  const getDetailLink = (source: any) =>
    source.type === 'dataset' ? `/datasets/${source.id}` : `/casestudies/${source.id}`;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900"
                    style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}>
                  AI 智能助手
                </h1>
                <p className="text-sm text-gray-500">基于 Qwen AI 技术</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              startContent={<Trash2 className="w-4 h-4" />}
              onClick={handleClearChat}
            >
              清空对话
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <Avatar
                  icon={message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  className={message.role === 'user' ? 'bg-blue-500' : 'bg-gradient-to-br from-red-500 to-orange-500'}
                  size="sm"
                />

                {/* Message Content */}
                <div className="flex-1">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 flex items-center">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        相关资源推荐：
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {message.sources.slice(0, 3).map((source, idx) => (
                          <Link key={idx} href={getDetailLink(source)}>
                            <Card
                              isPressable
                              className="border border-gray-200 hover:border-red-300 hover:shadow-md transition-all"
                            >
                              <CardBody className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Chip size="sm" color={getTypeColor(source.type)} variant="flat">
                                        {getTypeLabel(source.type)}
                                      </Chip>
                                      <span className="text-xs text-gray-500">
                                        {(source.similarity * 100).toFixed(0)}% 匹配
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {source.title}
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-3xl">
                <Avatar
                  icon={<Bot className="w-5 h-5" />}
                  className="bg-gradient-to-br from-red-500 to-orange-500"
                  size="sm"
                />
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions (shown when no user messages) */}
      {messages.filter(m => m.role === 'user').length === 0 && !loading && (
        <div className="max-w-5xl mx-auto px-6 pb-4">
          <Card className="border-2 border-gray-200">
            <CardBody className="p-4">
              <p className="text-sm text-gray-600 mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                试试这些问题：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="flat"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    <span className="text-xs line-clamp-1">{question}</span>
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              placeholder="输入您的问题..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              size="lg"
              classNames={{
                input: "text-base",
                inputWrapper: "border-2 border-gray-200 hover:border-red-300 bg-gray-50"
              }}
              disabled={loading}
            />
            <Button
              color="danger"
              size="lg"
              isIconOnly
              onClick={handleSendMessage}
              isLoading={loading}
              disabled={!input.trim() || loading}
              className="min-w-[48px]"
            >
              {!loading && <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            AI 回答仅供参考，具体信息请以数据集和案例集详情为准
          </p>
        </div>
      </div>
    </div>
  );
}
