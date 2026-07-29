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
  MessageSquare, Search, Send, UserPlus, X, ArrowLeft, RefreshCw,
  MoreHorizontal, CheckCheck, Check,
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

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatConversationTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hoy = new Date();
  const diff = hoy - d;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  if (d.toDateString() === hoy.toDateString()) return formatTime(ts);

  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';

  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function groupByDate(messages) {
  const groups = [];
  let currentLabel = null;
  let group = [];
  messages.forEach((msg) => {
    const label = formatDateLabel(msg.created_at);
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
  return 'customer';
}

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'unread', label: 'No leídos' },
  { key: 'transfers', label: 'Transferencias' },
];

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const filterParams = activeFilter !== 'all' ? { filter: activeFilter } : undefined;
  const { data: conversationsRes, isLoading: convosLoading } = useMessages(filterParams);
  const { data: conversationRes, isLoading: chatLoading } = useConversation(selectedPhone);
  const { data: transfersRes } = useTransfers();
  const sendMessage = useSendMessage();
  const resolveTransfer = useResolveTransfer();

  const conversations = conversationsRes?.data || conversationsRes || [];
  const messages = conversationRes?.data?.messages || conversationRes?.messages || (conversationRes?.data || conversationRes || []);
  const transfers = transfersRes?.data || transfersRes || [];

  const selectedConv = Array.isArray(conversations)
    ? conversations.find((c) => c.phone_number === selectedPhone)
    : null;

  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter((conv) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = (conv.customer_name || '').toLowerCase();
        const phone = (conv.phone_number || '').toLowerCase();
        return name.includes(q) || phone.includes(q);
      })
    : [];

  const convoPhone = (c) => c.phone_number || '';
  const convoName = (c) => c.customer_name || convoPhone(c) || 'Desconocido';
  const convoLastMsg = (c) => c.last_message || '';
  const convoTime = (c) => c.last_message_time;
  const convoUnread = (c) => c.unread_count || 0;

  const msgId = (m) => m.id || Math.random();
  const msgBody = (m) => m.message || '';
  const msgTime = (m) => m.created_at;
  const msgType = (m) => getMsgType(m);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedPhone) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      inputRef.current?.focus();
    }
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
        toast.success('Transferencia creada');
        setTransferModalOpen(false);
        setTransferReason('');
      })
      .catch((err) => toast.error(err.response?.data?.error || 'Error al crear transferencia'));
  };

  const handleResolveTransfer = (id) => {
    resolveTransfer.mutate(id);
  };

  const groupedMessages = groupByDate(Array.isArray(messages) ? messages : []);
  const messagesCount = groupedMessages.reduce((sum, g) => sum + g.messages.length, 0);

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 bg-white">
      {/* Left panel - conversations */}
      <div className={`${selectedPhone ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 border-r border-gray-200 bg-white flex-col flex-shrink-0`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Conversaciones</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-50 bg-white">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setSelectedPhone(null); }}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeFilter === f.key
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
              {f.key === 'transfers' && Array.isArray(transfers) && transfers.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {transfers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeFilter === 'transfers' ? (
            Array.isArray(transfers) && transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Sin transferencias</p>
                <p className="text-xs text-gray-400 mt-1">No hay conversaciones pendientes de atención humana</p>
              </div>
            ) : (
              Array.isArray(transfers) && transfers.map((transfer) => (
                <div key={transfer.id} className="p-3 border-b border-gray-50 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ${getAvatarColor(transfer.customer_name || transfer.phone_number || '')}`}>
                        {getInitials(transfer.customer_name || '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transfer.customer_name || transfer.phone_number || 'Desconocido'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          <span className="text-amber-600 font-medium">Transferencia: </span>
                          {transfer.reason || 'Sin motivo'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveTransfer(transfer.id)}
                      disabled={resolveTransfer.isPending}
                      className="btn-ghost p-1.5 flex-shrink-0"
                      title="Resolver"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleResolveTransfer(transfer.id)}
                    disabled={resolveTransfer.isPending}
                    className="btn-primary text-xs w-full mt-2"
                  >
                    Resolver Transferencia
                  </button>
                </div>
              ))
            )
          ) : convosLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">Sin conversaciones</p>
              <p className="text-xs text-gray-400 mt-1">Los mensajes de WhatsApp aparecerán aquí</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={convoPhone(conv)}
                onClick={() => setSelectedPhone(convoPhone(conv))}
                className={`w-full text-left p-3 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                  selectedPhone === convoPhone(conv) ? 'bg-emerald-50 border-l-[3px] border-l-emerald-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ${getAvatarColor(convoName(conv))}`}>
                    {getInitials(convoName(conv))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{convoName(conv)}</p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                        {formatConversationTime(convoTime(conv))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate flex-1">{convoLastMsg(conv) || 'Sin mensajes'}</p>
                      {convoUnread(conv) > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                          {convoUnread(conv)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{convoPhone(conv)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel - chat */}
      <div className={`${selectedPhone ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-[#efeae2]`}>
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-400">Mobile Parts Store</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-sm">
                Selecciona una conversación para ver los mensajes. Las respuestas automáticas de IA aparecerán aquí.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#f0f2f5] border-b border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSelectedPhone(null)} className="btn-ghost p-2 lg:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ${getAvatarColor(selectedConv ? convoName(selectedConv) : selectedPhone)}`}>
                  {getInitials(selectedConv ? convoName(selectedConv) : '')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedConv ? convoName(selectedConv) : selectedPhone}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{selectedPhone}</p>
                </div>
              </div>
              <button
                onClick={() => { setTransferReason(''); setTransferModalOpen(true); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                Transferir
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Cargando mensajes...</p>
                  </div>
                </div>
              ) : messagesCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-white rounded-xl shadow-sm p-6 max-w-sm text-center">
                    <MessageSquare className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Sin mensajes aún</p>
                    <p className="text-xs text-gray-400 mt-1">Envía un mensaje para iniciar la conversación</p>
                  </div>
                </div>
              ) : (
                groupedMessages.map((group, gi) => (
                  <div key={gi} className="mb-2">
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-[11px] text-gray-500 bg-white px-4 py-1.5 rounded-full shadow-sm">
                        {group.label}
                      </span>
                    </div>
                    {group.messages.map((msg) => {
                      const type = msgType(msg);
                      const isCustomer = type === 'customer';
                      const isAI = type === 'ai';
                      const isEmployee = type === 'employee';

                      return (
                        <div key={msgId(msg)} className={`flex mb-1 ${isEmployee ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] min-w-[80px] px-3 py-2 rounded-lg shadow-sm ${
                            isCustomer
                              ? 'bg-white rounded-tl-none'
                              : isAI
                                ? 'bg-[#d9fdd3] rounded-tl-none border border-emerald-100'
                                : 'bg-[#d9fdd3] rounded-tr-none border border-emerald-100'
                          }`}>
                            {isAI && (
                              <p className="text-[10px] font-bold text-emerald-600 mb-0.5">🤖 AI Alex</p>
                            )}
                            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                              {msgBody(msg)}
                            </p>
                            <div className={`flex items-center gap-1 mt-1 ${isEmployee ? 'justify-end' : 'justify-end'}`}>
                              <span className="text-[10px] text-gray-400">
                                {formatTime(msgTime(msg))}
                              </span>
                              {isEmployee && (
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 bg-[#f0f2f5] border-t border-gray-200">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 bg-white max-h-32"
                  style={{ minHeight: '42px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transfer modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTransferModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Transferir a Humano</h2>
              <button onClick={() => setTransferModalOpen(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Transfiere esta conversación a un agente humano. La IA dejará de responder automáticamente.
            </p>
            <div className="mb-4">
              <label className="label">Motivo de la transferencia</label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Describe por qué necesita atención humana..."
                rows={3}
                className="input resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setTransferModalOpen(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleTransfer} disabled={!transferReason.trim()} className="btn-primary">
                <UserPlus className="w-4 h-4" />
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
