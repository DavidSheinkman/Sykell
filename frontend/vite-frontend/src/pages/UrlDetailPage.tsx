import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Legend } from 'recharts'
import styles from './UrlDetailPage.module.css'

// API base can be configured via Vite env var
const API_BASE = 'http://localhost:8080'

const COLORS = ['#0088FE', '#FF8042']

export default function UrlDetailPage() {

  // Type for broken link detail object
  type BrokenLink = {
    url: string
    status_code: number
  }

  
  const { id } = useParams()

  // State for result data
  const [data, setData] = useState<{
    status: string
    results: {
      html_version: string
      title: string
      h1_count: number
      h2_count: number
      internal_links: number
      external_links: number
      broken_links: number
      has_login_form: boolean
      broken_details: BrokenLink[] | null
    }
  } | null>(null)

  const [loading, setLoading] = useState(true)

  // Fetch detailed URL info on mount
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API_BASE}/api/urls/${id}/status`, {
        headers: { Authorization: 'Bearer supersecrettoken' },
      })
      const json = await res.json()
      setData(json)
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) return <div>Loading...</div>

  // If data not ready yet
  if (!data || data.status === 'queued' || data.status === 'running') {
    return <div>Still processing...</div>
  }

  const { results } = data

  const chartData = [
    { name: 'Internal Links', value: results.internal_links || 0 },
    { name: 'External Links', value: results.external_links || 0 },
  ]

  return (
    <div className={styles.detailPage}>
      <h1>Title: {results.title}</h1>


      <p><strong>HTML Version:</strong> {results.html_version || 'N/A'}</p>
      <p><strong>h1 count:</strong> {results.h1_count || '0'}</p>
      <p><strong>h2 count:</strong> {results.h2_count || '0'}</p>
      <p><strong>Has Login Form:</strong> {results.has_login_form ? 'Yes' : 'No'}</p>

      <h2>Link Chart</h2>
      <PieChart width={300} height={300}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
      <h3>Broken Links</h3>
      {(data?.results?.broken_details || []).map((link: BrokenLink, i) => (
        <li key={i}>
          <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a> — {link.status_code}
        </li>
      ))}


    </div>
  )
}