import  { useMemo, useState } from 'react'
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

  const table = useReactTable({
    data,
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