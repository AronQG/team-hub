'use client'

import { useParams } from 'next/navigation'

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Chat {chatId}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center text-gray-500 mt-8">
          <p>Chat interface will be implemented here.</p>
          <p className="text-sm mt-2">Chat ID: {chatId}</p>
        </div>
      </div>
      
      <div className="bg-white border-t p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
