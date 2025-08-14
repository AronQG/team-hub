'use client'

export default function KanbanBoard() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">To Do</h3>
          <div className="space-y-2">
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm">Sample task 1</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">In Progress</h3>
          <div className="space-y-2">
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm">Sample task 2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Done</h3>
          <div className="space-y-2">
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm">Sample task 3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
