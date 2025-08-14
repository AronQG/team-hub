'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface User {
  id: string
  name: string
  email: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  order: number
  creator: User
  assignee?: User
}

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const res = await fetch('/api/kanban')
      if (!res.ok) throw new Error('Failed to fetch tasks')
      const data = await res.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return

    const { source, destination } = result
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return

    const taskId = result.draggableId
    const newStatus = destination.droppableId as Task['status']

    // Optimistic update
    setTasks(prev => {
      const updated = [...prev]
      const taskIndex = updated.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        updated[taskIndex] = { ...updated[taskIndex], status: newStatus }
      }
      return updated
    })

    try {
      await fetch(`/api/kanban?id=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (error) {
      console.error('Error updating task:', error)
      fetchTasks() // Refetch on error
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading tasks...</div>
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto">
        {COLUMNS.map(column => {
          const columnTasks = tasks
            .filter(task => task.status === column.id)
            .sort((a, b) => a.order - b.order)

          return (
            <div key={column.id} className="min-w-[300px] bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold mb-4">{column.title}</h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 rounded shadow cursor-move"
                          >
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                              {task.assignee ? (
                                <span>Assigned to: {task.assignee.name}</span>
                              ) : (
                                <span>Unassigned</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}