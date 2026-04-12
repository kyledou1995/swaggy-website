'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Package, ChevronRight, Search, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';
import { Order, OrderMessage, User } from '@/types';
import { ORDER_STATUS_LABELS } from '@/lib/constants';

interface ConversationThread {
  order: Order;
  client: User | null;
  messages: OrderMessage[];
  lastMessage: OrderMessage | null;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ id: string } | null>(null);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth/login');
          return;
        }
        setAdminUser({ id: authUser.id });

        // Fetch all orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!ordersData || ordersData.length === 0) {
          setIsLoading(false);
          return;
        }

        // Fetch all client profiles
        const clientIds = [...new Set(ordersData.map((o: Order) => o.client_id))];
        const { data: clientsData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', clientIds);

        const clientsMap: Record<string, User> = {};
        (clientsData || []).forEach((c: User) => {
          clientsMap[c.id] = c;
        });

        // Fetch all messages
        const orderIds = ordersData.map((o: Order) => o.id);
        const { data: messagesData } = await supabase
          .from('order_messages')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: true });

        // Group messages by order
        const messagesByOrder: Record<string, OrderMessage[]> = {};
        (messagesData || []).forEach((msg: OrderMessage) => {
          if (!messagesByOrder[msg.order_id]) {
            messagesByOrder[msg.order_id] = [];
          }
          messagesByOrder[msg.order_id].push(msg);
        });

        // Build threads
        const conversationThreads: ConversationThread[] = ordersData.map((order: Order) => {
          const orderMessages = messagesByOrder[order.id] || [];
          return {
            order,
            client: clientsMap[order.client_id] || null,
            messages: orderMessages,
            lastMessage: orderMessages.length > 0 ? orderMessages[orderMessages.length - 1] : null,
          };
        });

        // Sort by most recent message first
        conversationThreads.sort((a, b) => {
          if (a.lastMessage && !b.lastMessage) return -1;
          if (!a.lastMessage && b.lastMessage) return 1;
          if (a.lastMessage && b.lastMessage) {
            return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
          }
          return new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime();
        });

        setThreads(conversationThreads);

        if (conversationThreads.length > 0) {
          const firstWithMessages = conversationThreads.find(t => t.messages.length > 0);
          setSelectedThread(firstWithMessages || conversationThreads[0]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !adminUser) return;

    setIsSending(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.from('order_messages').insert([{
        order_id: selectedThread.order.id,
        sender_id: adminUser.id,
        sender_role: 'admin',
        message: newMessage.trim(),
        attachments: [],
      }]);

      if (error) throw error;

      const newMsg: OrderMessage = {
        id: `msg_${Date.now()}`,
        order_id: selectedThread.order.id,
        sender_id: adminUser.id,
        sender_role: 'admin',
        message: newMessage.trim(),
        attachments: [],
        created_at: new Date().toISOString(),
      };

      const updatedThread = {
        ...selectedThread,
        messages: [...selectedThread.messages, newMsg],
        lastMessage: newMsg,
      };

      setSelectedThread(updatedThread);
      setThreads(prev => prev.map(t =>
        t.order.id === selectedThread.order.id ? updatedThread : t
      ));
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredThreads = threads.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.order.order_number || '').toLowerCase().includes(q) ||
      t.order.product_type.toLowerCase().includes(q) ||
      (t.client?.company_name || '').toLowerCase().includes(q) ||
      (t.client?.full_name || '').toLowerCase().includes(q)
    );
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Manage all client conversations across orders</p>
        </div>

        <div className="h-[calc(100vh-220px)]">
          <Card className="h-full flex overflow-hidden">
            {/* Thread List */}
            <div className="w-96 border-r border-gray-200 flex flex-col flex-shrink-0">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by order, client, or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-y-auto">
                {filteredThreads.length === 0 ? (
                  <div className="p-6 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No conversations found</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <button
                      key={thread.order.id}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedThread?.order.id === thread.order.id ? 'bg-green-50 border-l-2 border-l-green-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {thread.order.order_number || thread.order.id.slice(0, 8)}
                            </p>
                            <Badge
                              variant={
                                thread.order.status === 'delivered' ? 'success' :
                                thread.order.status === 'action_required' ? 'error' : 'info'
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {ORDER_STATUS_LABELS[thread.order.status as keyof typeof ORDER_STATUS_LABELS]}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 font-medium">
                            {thread.client?.company_name || thread.client?.full_name || 'Unknown Client'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{thread.order.product_type}</p>
                          {thread.lastMessage ? (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {thread.lastMessage.sender_role === 'admin' ? 'You: ' : 'Client: '}
                              {thread.lastMessage.message}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-300 mt-1 italic">No messages yet</p>
                          )}
                        </div>
                        {thread.lastMessage && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 mt-1">
                            {formatTime(thread.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedThread ? (
                <>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                          {selectedThread.client?.company_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {selectedThread.client?.company_name || 'Unknown Client'}
                            </h3>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm text-gray-500">
                              Order #{selectedThread.order.order_number || selectedThread.order.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {selectedThread.client?.full_name} · {selectedThread.order.product_type} · {selectedThread.order.quantity.toLocaleString()} units
                          </p>
                        </div>
                      </div>
                    </div>
                    <Link href={`/admin/orders/${selectedThread.order.id}`}>
                      <Button variant="secondary" size="sm">
                        View Order <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
                    {selectedThread.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-gray-400">No messages yet</p>
                          <p className="text-sm text-gray-300 mt-1">Send a message to start the conversation with this client</p>
                        </div>
                      </div>
                    ) : (
                      selectedThread.messages.map((msg) => {
                        const isAdmin = msg.sender_role === 'admin';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-md px-4 py-3 rounded-2xl ${
                                isAdmin
                                  ? 'bg-green-500 text-white rounded-br-md'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                              }`}
                            >
                              <p className={`text-xs font-medium mb-1 ${
                                isAdmin ? 'text-green-100' : 'text-blue-600'
                              }`}>
                                {isAdmin ? 'You' : selectedThread.client?.full_name || 'Client'}
                              </p>
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              <p className={`text-[10px] mt-2 ${
                                isAdmin ? 'text-green-200' : 'text-gray-400'
                              }`}>
                                {new Date(msg.created_at).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Reply to client..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <Button
                        variant="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        isLoading={isSending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Select a conversation</p>
                    <p className="text-sm text-gray-400 mt-1">Choose an order thread from the left to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
