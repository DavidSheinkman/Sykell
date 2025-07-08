// src/pages/DashboardPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { AddURLForm } from '../components/AddURLForm'
import { DashboardTable } from '../components/DashboardTable'
import styles from './DashboardPage.module.css'

// API base and polling interval (in ms)
const API_BASE = 'http://localhost:8080'
const POLL_INTERVAL = 5000

export default function DashboardPage() {
  const [urls, setUrls] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch the list of URLs from backend
  const fetchUrls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/urls`, {
        headers: { Authorization: 'Bearer supersecrettoken' },
      })
      const data = await res.json()

      // Avoid unnecessary re-render if data hasn't changed
      setUrls((prev) => {
        const newDataStr = JSON.stringify(data.urls)
        const prevDataStr = JSON.stringify(prev)
        return newDataStr !== prevDataStr ? data.urls : prev
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + polling
  useEffect(() => {
    fetchUrls()
    const id = setInterval(fetchUrls, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchUrls])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Website Crawler Dashboard</h1>

      <AddURLForm onSuccess={fetchUrls} />

      {loading && <p>Loading…</p>}

      <DashboardTable
        data={urls}
        onStart={async (id) => {
          await fetch(`http://localhost:8080/api/urls/${id}/start`, {
            method: 'POST',
            headers: { Authorization: 'Bearer supersecrettoken' },
          })
          fetchUrls()
        }}
        onDelete={async (id) => {
          await fetch(`http://localhost:8080/api/urls/${id}/delete`, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer supersecrettoken' },
          })
          fetchUrls()
        }}
      />
    </div>
  )
}