// apps/web/components/deploy/DeployButton.tsx
'use client'

import { useState } from 'react'

export default function DeployButton() {
  const [deploying, setDeploying] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function triggerDeploy() {
    setDeploying(true)
    setStatus('idle')

    try {
      // Trigger GitHub Actions workflow
      const response = await fetch('https://api.github.com/repos/YOUR_ORG/YOUR_REPO/actions/workflows/deploy.yml/dispatches', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            environment: 'production'
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger deployment')
      }

      setStatus('success')
    } catch (error) {
      console.error('Deployment error:', error)
      setStatus('error')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <button
      onClick={triggerDeploy}
      disabled={deploying}
      className={`px-6 py-3 rounded-lg font-semibold text-white transition ${
        deploying
          ? 'bg-gray-400 cursor-not-allowed'
          : status === 'success'
          ? 'bg-green-600 hover:bg-green-700'
          : status === 'error'
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {deploying ? 'Deploying...' : status === 'success' ? '✓ Deployed' : status === 'error' ? '✗ Failed' : '🚀 Deploy'}
    </button>
  )
}