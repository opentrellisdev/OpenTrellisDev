'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { UserAvatar } from './UserAvatar'
import { Trash2, Check, X as XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './ui/Dialog';

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  chatUser: any;
  messages: any[];
}

function OnlineStatusDot({ online }: { online: boolean }) {
  return (
    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
  );
}

function ChatModal({ open, onClose, chatUser, messages, myId, setData }: ChatModalProps & { myId: string, setData: React.Dispatch<React.SetStateAction<any[]>> }) {
  const [input, setInput] = useState('');
  const [chatMsgs, setChatMsgs] = useState(messages);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatMsgs(messages);
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  // Simulate online status (random for demo, replace with real logic if available)
  const online = true; // TODO: Replace with real presence logic

  async function sendMessage() {
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await axios.post('/api/messages', { receiverId: chatUser.id, content: input });
      const newMsg = {
        id: res.data.id,
        content: input,
        senderId: myId,
        receiverId: chatUser.id,
        createdAt: new Date().toISOString(),
      };
      setChatMsgs((prev: any[]) => [...prev, newMsg]);
      setInput('');
      // Optimistically update latestMessage in sidebar or add new thread if missing
      setData((prev: any[]) => {
        const threadExists = prev.some((thread: any) => thread.userA?.id === chatUser.id || thread.userB?.id === chatUser.id);
        if (threadExists) {
          return prev.map((thread: any) => {
            if (thread.userA?.id === chatUser.id || thread.userB?.id === chatUser.id) {
              return { ...thread, latestMessage: newMsg };
            }
            return thread;
          });
        } else {
          // Add new pending thread
          return [
            ...prev,
            {
              id: res.data.threadId || `pending-${chatUser.id}`,
              user: chatUser,
              status: 'pending',
              initiatorId: myId,
              latestMessage: newMsg,
              all: [newMsg],
            },
          ];
        }
      });
      // Optionally, re-fetch threads to ensure consistency
      const threadsRes = await axios.get('/api/messages');
      setData(threadsRes.data);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30'>
      <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative flex flex-col' style={{ minHeight: 500, maxHeight: 600 }}>
        <button
          className='absolute top-2 right-2 text-zinc-400 hover:text-zinc-700 text-xl font-bold rounded focus:outline-none'
          onClick={onClose}
          aria-label='Close'
        >
          ×
        </button>
        <div className='flex items-center gap-3 mb-4 relative'>
          <div className='relative'>
            <UserAvatar user={{ name: chatUser.username, image: chatUser.image }} className='h-10 w-10' />
            <OnlineStatusDot online={online} />
          </div>
          <span className={`text-lg font-bold ${chatUser.userType === 'MENTOR' ? 'text-blue-600' : chatUser.userType === 'PAID' ? 'text-yellow-500' : 'text-zinc-900'}`}>u/{chatUser.username}</span>
        </div>
        <div className='flex-1 overflow-y-auto flex flex-col gap-2 pb-2' style={{ minHeight: 300 }}>
          {chatMsgs.map((msg: any, idx: number) => {
            const isMe = msg.senderId === myId;
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                style={{ marginBottom: 4 }}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm ${isMe ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-zinc-900'}`}
                  style={{ borderBottomRightRadius: isMe ? 0 : 16, borderBottomLeftRadius: isMe ? 16 : 0 }}>
                  <div className='font-medium'>{msg.content}</div>
                  <div className='text-xs text-zinc-200 mt-1 text-right'>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <form className='flex gap-2 mt-2' onSubmit={e => { e.preventDefault(); sendMessage(); }}>
          <input
            className='flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200'
            placeholder='Type a message...'
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
            autoFocus
          />
          <button
            type='submit'
            className='bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50'
            disabled={sending || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PrivateMessagesSidebar() {
  const [messages, setMessages] = useState<any[]>([])
  const [users, setUsers] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [openChat, setOpenChat] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatUser, setChatUser] = useState<any>(null)
  const [myId, setMyId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, userId: string | null }>({ open: false, userId: null });
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch messages/threads from API
  const [data, setData] = useState<any[]>([]); // setData is a setter
  useEffect(() => {
    async function fetchThreads() {
      setLoading(true);
      try {
        const res = await axios.get('/api/messages');
        setData(res.data);
        setMyId(res.data[0]?.myId);
      } catch (e) {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchThreads();
  }, []);

  // Group messages by user (other than me)
  const grouped: { [key: string]: any[] } = {}
  const myIdFromState = myId; // Use the state variable
  messages.forEach((msg: any) => {
    const otherId = msg.senderId === myIdFromState ? msg.receiverId : msg.senderId
    if (!grouped[otherId]) grouped[otherId] = []
    grouped[otherId].push({ ...msg, isMe: msg.senderId === myIdFromState })
  })

  // For each user, get the latest message and thread info
  const chatList = (Array.isArray(data) ? data : [])
    .map((thread: any) => {
      const otherUser = thread.userA?.id === myId ? thread.userB : thread.userA;
      if (!otherUser || !otherUser.id) return null; // skip if user is undefined
      return {
        id: thread.id,
        user: otherUser,
        status: thread.status,
        initiatorId: thread.initiatorId,
        latestMessage: thread.latestMessage,
        all: thread.messages || [],
      };
    })
    .filter(Boolean);

  // Filter out self-DMs
  const filteredChatList = chatList.filter((chat: any) => chat.user.id !== myId);

  if (!myId) return null; // or a loading spinner

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-4'>
      <h2 className='font-semibold text-lg mb-2'>Private Messages</h2>
      {loading ? (
        <div className='text-sm text-zinc-500'>Loading...</div>
      ) : filteredChatList.length === 0 ? (
        <div className='text-sm text-zinc-500'>No private messages yet.</div>
      ) : (
        <ul className='space-y-2 max-h-64 overflow-y-auto'>
          {filteredChatList.map((chat: any, i: number) => {
            const isInitiator = chat.initiatorId === myId;
            const isPending = chat.status === 'pending';
            const isAccepted = chat.status === 'accepted';
            const isIncomingRequest = isPending && !isInitiator;
            const isOutgoingRequest = isPending && isInitiator;
            return (
              <li
                key={i}
                className={`flex items-center gap-3 p-2 rounded-lg border transition relative ${isPending ? 'bg-zinc-100 opacity-70' : 'hover:bg-zinc-50 cursor-pointer'}`}
              >
                <UserAvatar user={{ name: chat.user.username, image: chat.user.image }} className='h-8 w-8' />
                <div
                  className='flex-1'
                  onClick={() => {
                    if (isAccepted || (isPending && isInitiator)) {
                      setChatUser(chat.user)
                      // Fetch full conversation for this thread
                      axios.get(`/api/messages/thread/${chat.id}`).then(res => {
                        setChatMessages(res.data)
                        setOpenChat(true)
                      })
                    }
                  }}
                >
                  <div className={`font-semibold ${chat.user.userType === 'MENTOR' ? 'text-blue-600' : chat.user.userType === 'PAID' ? 'text-yellow-500' : 'text-zinc-900'}`}>u/{chat.user.username}</div>
                  <div className='text-xs text-zinc-500 truncate'>
                    {isOutgoingRequest && <span className='italic text-zinc-400'>Pending</span>}
                    {isIncomingRequest && <span className='italic text-zinc-400'>DM request</span>}
                    {isAccepted && chat.latestMessage && (
                      chat.latestMessage.senderId === myId
                        ? <span><span className='font-semibold'>You:</span> {chat.latestMessage.content}</span>
                        : <span><span className='font-semibold'>u/{chat.user.username}:</span> {chat.latestMessage.content}</span>
                    )}
                  </div>
                </div>
                {isIncomingRequest && (
                  <>
                    <button
                      className='ml-2 text-green-600 hover:text-green-800 p-1 rounded transition bg-white shadow'
                      title='Accept DM'
                      disabled={actionLoading === chat.user.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActionLoading(chat.user.id);
                        await axios.patch(`/api/messages/${chat.user.id}`, { action: 'accept' });
                        setActionLoading(null);
                        // Re-fetch threads
                        const res = await axios.get('/api/messages');
                        setData(res.data);
                      }}
                    >
                      <Check className='w-5 h-5' />
                    </button>
                    <button
                      className='ml-2 text-red-600 hover:text-red-800 p-1 rounded transition bg-white shadow'
                      title='Reject DM'
                      disabled={actionLoading === chat.user.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActionLoading(chat.user.id);
                        await axios.patch(`/api/messages/${chat.user.id}`, { action: 'reject' });
                        setActionLoading(null);
                        window.location.reload();
                      }}
                    >
                      <XIcon className='w-5 h-5' />
                    </button>
                  </>
                )}
                <button
                  className='ml-2 text-red-600 hover:text-red-800 p-1 rounded transition absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow'
                  title='Delete conversation'
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteDialog({ open: true, userId: chat.user.id });
                  }}
                >
                  <Trash2 className='w-5 h-5' />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <ChatModal open={!!openChat} onClose={() => setOpenChat(false)} chatUser={chatUser} messages={chatMessages} myId={myId} setData={setData} />
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className='px-4 py-2 rounded bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
              onClick={() => setDeleteDialog({ open: false, userId: null })}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className='px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white'
              onClick={async () => {
                if (!deleteDialog.userId) return;
                setDeleting(true);
                await axios.delete(`/api/messages/${deleteDialog.userId}`);
                setData((prev: any[]) => prev.filter((thread: any) => {
                  const otherUser = thread.userA?.id === myId ? thread.userB : thread.userA;
                  return otherUser && otherUser.id !== deleteDialog.userId;
                }));
                setDeleteDialog({ open: false, userId: null });
                setDeleting(false);
              }}
              disabled={deleting}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 