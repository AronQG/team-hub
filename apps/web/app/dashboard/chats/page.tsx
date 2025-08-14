'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Chat {
  id: string
  title: string
  isPrivate: boolean
  _count: { messages: number }
  updatedAt: string
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [newChatPrivate, setNewChatPrivate] = useState(false)

  useEffect(() => {
    fetchChats()
  }, [search])

  async function fetchChats() {
    try {
      const url = search ? `/api/chats?search=${encodeURIComponent(search)}` : '/api/chats'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch chats')
      const data = await res.json()
      setChats(data.chats)
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  async function createChat() {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChatTitle,
          isPrivate: newChatPrivate,
        }),
      })

      if (!res.ok) throw new Error('Failed to create chat')
      
      setShowCreateModal(false)
      setNewChatTitle('')
      setNewChatPrivate(false)
      fetchChats()
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Chats</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Chat
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chats.map(chat => (
          <Link
            key={chat.id}
            href={`/dashboard/chats/${chat.id}`}
            className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition"
          >
            <h3 className="font-semibold mb-2">{chat.title}</h3>
            <p className="text-sm text-gray-500">{chat._count.messages} messages</p>
            {chat.isPrivate && (
              <span className="inline-block mt-2 text-xs bg-gray-200 px-2 py-1 rounded">
                🔒 Private
              </span>
            )}
          </Link>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Chat</h3>
            <input
              type="text"
              placeholder="Chat title"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={newChatPrivate}
                onChange={(e) => setNewChatPrivate(e.target.checked)}
                className="mr-2"
              />
              <span>Make this chat private</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createChat}
                disabled={!newChatTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}