import { useState, useRef, useEffect } from 'react';
import { messagesApi } from '../lib/api';
import {
  useMessages,
  useConversation,
  useSendMessage,
  useTransfers,
  useResolveTransfer,
} from '../hooks/useMessages';
import toast from 'react-hot-toast';
import {
  MessageSquare, Search, Send, User, Phone, Clock, AlertCircle,
  UserPlus, X, ArrowLeft, RefreshCw, Filter, MoreHorizontal,
} from 'lucide-react';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(messages) {
  const groups = [];
  let currentLabel = null;
  let group = [];
  messages.forEach((msg) => {
    const label = getDateLabel(msg.created_at || msg.timestamp);
    if (label !== currentLabel) {
      if (group.length) groups.push({ label: currentLabel, messages: group });
      currentLabel = label;
      group = [msg];
    } else {
      group.push(msg);
    }
  });
  if (group.length) groups.push({ label: currentLabel, messages: group });
  return groups;
}

function getMsgType(msg) {
  if (msg.sender === 'ai') return 'ai';
  if (msg.sender === 'employee') return 'employee';
  if (msg.sender === 'customer') return 'customer';
  return 'customer';
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'ai', label: 'AI Only' },
  { key: 'transfers', label: 'Transfers' },
];

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const messagesEndRef = useRef(null);

  const filterParams = activeFilter !== 'all' ? { filter: activeFilter } : undefined;
  const { data: conversationsRes, isLoading: convosLoading } = useMessages(filterParams);
  const { data: conversationRes, isLoading: chatLoading } = useConversation(selectedPhone);
  const { data: transfersRes } = useTransfers();
  const sendMessage = useSendMessage();
  const resolveTransfer = useResolveTransfer();

  const conversations = conversationsRes?.data || conversationsRes || [];
  const messages = conversationRes?.data || conversationRes || [];
  const transfers = transfersRes?.data || transfersRes || [];

  const selectedConversation = Array.isArray(conversations)
    ? conversations.find((c) => (c.phone_number || c.from || c.sender) === selectedPhone)
    : null;

  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter((conv) => {
        if (!searchQuery) return true;
        const name = (conv.customer_name || conv.name || '').toLowerCase();
        const phone = (conv.phone_number || conv.from || conv.sender || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || phone.includes(q);
      })
    : [];

  const convoPhone = (c) => c.phone_number || c.from || c.sender || '';
  const convoName = (c) =>
    c.customer_name || c.name || convoPhone(c) || 'Unknown';
  const convoLastMsg = (c) =>
    c.last_message || c.body || c.text || '';
  const convoTime = (c) =>
    c.last_message_time || c.created_at || c.timestamp;
  const convoUnread = (c) => c.unread_count || c.unread || 0;
  const convoStatus = (c) => c.status || 'offline';

  const msgId = (m) => m.id || `${Math.random()}`;
  const msgBody = (m) => m.message || m.body || m.text || '';
  const msgTime = (m) => m.created_at || m.timestamp;
  const msgType = (m) => getMsgType(m);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedPhone) messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [selectedPhone]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedPhone) return;
    sendMessage.mutate(
      { phone_number: selectedPhone, message: newMessage.trim() },
      { onSuccess: () => setNewMessage('') }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTransfer = () => {
    if (!transferReason.trim() || !selectedPhone) return;
    messagesApi
      .send({ phone_number: selectedPhone, message: transferReason.trim(), type: 'transfer' })
      .then(() => {
        toast.success('Transfer initiated');
        setTransferModalOpen(false);
        setTransferReason('');
      })
      .catch((err) =>
        toast.error(err.response?.data?.error || 'Failed to create transfer')
      );
  };

  const handleResolveTransfer = (id) => {
    resolveTransfer.mutate(id);
  };

  const groupedMessages = groupByDate(Array.isArray(messages) ? messages : []);

  const renderLeftPanel = () => (
    <div className="w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-900">WhatsApp Conversations</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-50">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setActiveFilter(f.key); setSelectedPhone(null); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFilter === f.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeFilter === 'transfers' ? (
          Array.isArray(transfers) && transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No pending transfers</p>
            </div>
          ) : (
            Array.isArray(transfers) && transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="p-3 border-b border-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ${getAvatarColor(transfer.customer_name || transfer.phone_number || '')}`}
                    >
                      {getInitials(transfer.customer_name || transfer.phone_number || '')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transfer.customer_name || transfer.phone_number || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {transfer.reason || 'Transfer requested'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatTime(transfer.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveTransfer(transfer.id)}
                    disabled={resolveTransfer.isPending}
                    className="btn-ghost p-1.5 flex-shrink-0"
                    title="Resolve"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleResolveTransfer(transfer.id)}
                    disabled={resolveTransfer.isPending}
                    className="btn-primary text-xs w-full"
                  >
                    Resolve Transfer
                  </button>
                </div>
              </div>
            ))
          )
        ) : convosLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No conversations yet</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={convoPhone(conv)}
              onClick={() => setSelectedPhone(convoPhone(conv))}
              className={`w-full text-left p-3 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                selectedPhone === convoPhone(conv)
                  ? 'bg-primary-50 border-l-2 border-l-primary-600'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ${getAvatarColor(convoName(conv))}`}
                >
                  {getInitials(convoName(conv))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {convoName(conv)}
                    </p>
                    {convoTime(conv) && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(convoTime(conv))}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {convoLastMsg(conv)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400 truncate">
                      {convoPhone(conv)}
                    </span>
                    {convoUnread(conv) > 0 && (
                      <span className="badge bg-primary-600 text-white text-[10px] ml-2 flex-shrink-0 min-w-[18px] text-center">
                        {convoUnread(conv)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderChatHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSelectedPhone(null)}
          className="btn-ghost p-2 lg:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ${getAvatarColor(selectedConversation ? convoName(selectedConversation) : selectedPhone)}`}
        >
          {getInitials(selectedConversation ? convoName(selectedConversation) : selectedPhone)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {selectedConversation ? convoName(selectedConversation) : selectedPhone}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-gray-500 truncate">{selectedPhone}</p>
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                convoStatus(selectedConversation || {}) === 'online'
                  ? 'bg-emerald-500'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-gray-400 flex-shrink-0">
              {convoStatus(selectedConversation || {}) === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => {
            setTransferReason('');
            setTransferModalOpen(true);
          }}
          className="btn-secondary text-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Transfer to Human
        </button>
        <button
          onClick={() => setSelectedPhone(null)}
          className="btn-ghost p-2 hidden lg:flex"
          title="Close conversation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderMessageBubble = (msg) => {
    const type = msgType(msg);
    const bubbleClasses = {
      customer: 'rounded-2xl p-3 max-w-[75%] bg-gray-100 text-gray-900',
      ai: 'rounded-2xl p-3 max-w-[75%] bg-blue-50 text-blue-900 border border-blue-100',
      employee: 'rounded-2xl p-3 max-w-[75%] bg-emerald-100 text-emerald-900 ml-auto',
    };

    return (
      <div
        key={msgId(msg)}
        className={`flex mb-2 ${type === 'employee' ? 'justify-end' : 'justify-start'}`}
      >
        <div className={bubbleClasses[type]}>
          {type === 'ai' && (
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1">AI</p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{msgBody(msg)}</p>
          {msgTime(msg) && (
            <p
              className={`text-[10px] mt-1 ${
                type === 'employee' ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {formatTime(msgTime(msg))}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6">
      {renderLeftPanel()}

      <div className="flex-1 flex flex-col bg-gray-50">
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-1">Select a conversation</h3>
              <p className="text-sm text-gray-400">
                Choose a conversation from the left panel to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {renderChatHeader()}

            <div
              className="flex-1 overflow-y-auto p-4"
            >
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No messages yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Start the conversation by sending a message
                  </p>
                </div>
              ) : (
                groupedMessages.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {group.label}
                      </span>
                    </div>
                    {group.messages.map(renderMessageBubble)}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={2}
                  className="input resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  className="btn-primary p-3 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setTransferModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Transfer to Human Agent
              </h2>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="btn-ghost p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Transfer this conversation to a human agent. The AI will stop responding and a team
              member will take over.
            </p>
            <div className="mb-4">
              <label className="label">Reason for transfer</label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Describe why this conversation needs a human agent..."
                rows={3}
                className="input resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setTransferModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!transferReason.trim()}
                className="btn-primary"
              >
                <UserPlus className="w-4 h-4" />
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
