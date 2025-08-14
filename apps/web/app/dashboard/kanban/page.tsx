import dynamic from 'next/dynamic'

const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard'), {
  ssr: false,
})

export default function KanbanPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Kanban Board</h2>
      <div className="bg-white rounded-lg shadow">
        <KanbanBoard />
      </div>
    </div>
  )
}