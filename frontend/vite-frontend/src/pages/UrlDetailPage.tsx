import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Legend } from 'recharts'
import styles from './UrlDetailPage.module.css'

const API_BASE = 'http://localhost:8080'

const COLORS = ['#0088FE', '#FF8042']

export default function UrlDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      <h1>URL Details (ID: {id})</h1>
      <p><strong>Status:</strong> {data.status}</p>
      <p><strong>Title:</strong> {results.title || 'N/A'}</p>
      <p><strong>HTML Version:</strong> {results.html_version || 'N/A'}</p>
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
    </div>
  )
}