import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { UIButton } from '../components/UIButton'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'

import { useNavigate } from 'react-router-dom'
import styles from './DashboardTable.module.css'

type URLData = {
  id: number
  url: string
  status: string
  created_at: string
  last_run_at: string | null
  title?: string
}

// Table with sorting, pagination, search, filters, and bulk actions
export const DashboardTable = ({
  data,
  onStart,
  onDelete,
}: {
  data: URLData[]
  onStart: (id: number) => void
  onDelete: (id: number) => void
}) => {
  const columns = useMemo<ColumnDef<URLData>[]>(() => [
    {
      id: 'select',
      header: '',
      cell: ({ row }) => {
        const id = row.original.id
        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(id)}
            onChange={(e) => {
              setSelectedIds(prev =>
                e.target.checked ? [...prev, id] : prev.filter(i => i !== id)
              )
            }}
          />
        )
      },
    },

    {
      accessorKey: 'url',
      header: 'URL',
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: info => {
        const row = info.row.original
        return (
          <span
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate(`/url/${row.id}`)}
          >
            {info.getValue() as string}
          </span>
        )
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const status = info.getValue() as string

        if (status === 'running') {
          return (
            <span>
              <span className={styles.loader}></span>
              Running
            </span>
          )
        }

        return (
          <span
            className={
              status === 'done' ? styles.statusDone :
                status === 'error' ? styles.statusError :
                  ''
            }
          >
            {status}
          </span>
        )
      }
    },

    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: info => formatDateTime(info.getValue() as string)
    },
    {
      accessorKey: 'last_run_at',
      header: 'Last Run',
      cell: info => formatDateTime(info.getValue() as string | null)
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const id = row.original.id
        const status = row.original.status
        return (
          <div className={styles.actions}>
            {status === 'queued' && (

              <UIButton onClick={() => onStart(id)}>
                Start
              </UIButton>
            )}

            <UIButton onClick={() => onDelete(id)}>
              Delete
            </UIButton>
          </div>
        )
      },
    },
  ], [onStart, onDelete])

  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<number[]>([])


  // Sorting, pagination, and filter states
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [titleQuery, setTitleQuery] = useState('')
  const [debouncedQuery] = useDebounce(titleQuery, 200)

  const filteredData = useMemo(() => {
    if (!data) return []  // guard if data is null or undefined

    const query = debouncedQuery.toLowerCase()

    return data.filter(row => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter

      const titleText = row.title ?? ''  // default empty string if null
      const urlText = row.url ?? ''

      const matchesText =
        titleText.toLowerCase().includes(query) ||
        urlText.toLowerCase().includes(query)

      return matchesStatus && matchesText
    })
  }, [data, statusFilter, titleQuery])

  function formatDateTime(iso: string | null) {
    if (!iso) return '—'

    const date = new Date(iso)
    const datePart = date.toISOString().slice(0, 10)
    const timePart = date.toISOString().slice(11, 19)

    return (
      <>
        <div>{datePart}</div>
        <div style={{ fontSize: '0.85em', color: '#666' }}>{timePart}</div>
      </>
    )
  }



  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className={styles.tableContainer}>


      <div className={styles.filterBar}>
        <label>
          Filter by Status:{' '}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="done">Done</option>
            <option value="error">Error</option>
          </select>
        </label>
      </div>

      <div className={styles.searchBar}>
        <label>
          Search Title:{' '}
          <input
            type="text"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Search by title or URL"
          />
        </label>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkActions}>

          <UIButton onClick={async () => {
            for (const id of selectedIds) await onStart(id)
            setSelectedIds([])
          }}>
            Re-Analyze Selected
          </UIButton>

          <UIButton onClick={async () => {
            for (const id of selectedIds) await onDelete(id)
            setSelectedIds([])
          }}>
            Delete Selected
          </UIButton>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : (
                    <button
                      className={styles.headerBtn}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>

        <UIButton onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}>
          ⬅ Prev
        </UIButton>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <UIButton onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}>
          Next ➡
        </UIButton>
      </div>
    </div>
  )
}