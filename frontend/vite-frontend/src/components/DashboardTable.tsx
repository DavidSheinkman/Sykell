import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'

import styles from './DashboardTable.module.css'

type URLData = {
  id: number
  url: string
  status: string
  created_at: string
  last_run_at: string | null
  title?: string
}

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
      accessorKey: 'url',
      header: 'URL',
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: info => {
        const title = info.getValue() as string
        return title?.length > 60 ? title.slice(0, 60) + '…' : title
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
    },
    {
      accessorKey: 'last_run_at',
      header: 'Last Run',
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
              <button onClick={() => onStart(id)}>Start</button>
            )}
            <button onClick={() => onDelete(id)}>Delete</button>
          </div>
        )
      },
    },
  ], [onStart, onDelete])

  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [titleQuery, setTitleQuery] = useState('')

const filteredData = useMemo(() => {
  if (!data) return []  // guard if data is null or undefined

  const query = titleQuery.toLowerCase()

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
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ⬅ Prev
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next ➡
        </button>
      </div>
    </div>
  )
}