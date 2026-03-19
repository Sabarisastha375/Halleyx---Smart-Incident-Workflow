import React from 'react';
import { FullPageSpinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

/**
 * Table — full-featured data table component.
 *
 * @param {string[]} columns - column header labels
 * @param {function(row, index): React.ReactNode} renderRow - render a <tr> per row
 * @param {any[]} data - array of row data
 * @param {boolean} loading
 * @param {string} emptyTitle
 * @param {string} emptyDescription
 * @param {React.ReactNode} emptyAction
 * @param {{ total, page, limit, totalPages }} pagination
 * @param {function(number): void} onPageChange
 */
export function Table({
  columns = [],
  renderRow,
  data = [],
  loading = false,
  emptyTitle = 'No results found',
  emptyDescription,
  emptyAction,
  pagination,
  onPageChange,
}) {
  return (
    <div className="card p-0">
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={typeof col === 'object' ? col.className : ''}>
                  {typeof col === 'object' ? col.label : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>
                  <FullPageSpinner message="Loading data..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => renderRow(row, idx))
            )}
          </tbody>
        </table>
      </div>

      {pagination && onPageChange && (
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}
