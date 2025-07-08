import React, { useState } from 'react'
import styles from './AddURLForm.module.css'
import { UIButton } from '../components/UIButton'

const API_BASE = 'http://localhost:8080'

// Reusable form component to add a new URL to be crawled
export const AddURLForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle form submit: POST new URL to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)


    const trimmedUrl = url.trim()  // Trim leading/trailing spaces from input

    try {
      const res = await fetch(`${API_BASE}/api/urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer supersecrettoken',
        },
        body: JSON.stringify({ url: trimmedUrl }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add URL')
      }

      setUrl('')
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
        required
        className={styles.input}
      />
      <UIButton type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add URL'}
      </UIButton>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  )
}