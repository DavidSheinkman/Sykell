import { useState, useEffect, useCallback } from 'react'
import { AddURLForm } from './components/AddURLForm'
import styles from './App.module.css'
import { DashboardTable } from './components/DashboardTable'

const API_BASE = 'http://localhost:8080'
const POLL_INTERVAL = 5000 // milliseconds

function App() {
  const [urls, setUrls] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 1. fetchUrls wrapped in useCallback so interval always uses the same reference
  const fetchUrls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/urls`, {
        headers: { Authorization: 'Bearer supersecrettoken' },
      })
      const data = await res.json()
      setUrls(data.urls)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. Initial load + polling setup
  useEffect(() => {
    fetchUrls()
    const id = setInterval(fetchUrls, POLL_INTERVAL)
    return () => clearInterval(id) // cleanup on unmount
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

export default App