import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  pageSize?: number;
  isLoading?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  pageSize = 10,
  isLoading = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-[rgba(26,107,26,0.3)] bg-[#0F0F0F]">
        <table className="w-full border-collapse text-left text-sm text-white">
          <thead>
            <tr className="border-b border-[rgba(26,107,26,0.3)] bg-[#070707] text-white/70 font-semibold uppercase tracking-wider text-xs">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(26,107,26,0.1)]">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-[rgba(26,107,26,0.1)]">
                  {columns.map((col, cIdx) => (
                    <td key={col.key} className="px-6 py-4">
                      {cIdx === 0 ? (
                        <div className="flex items-center gap-2">
                          <Skeleton rounded h={32} w={32} />
                          <Skeleton w="60%" h={12} />
                        </div>
                      ) : (
                        <Skeleton w={cIdx % 2 === 0 ? "50%" : "30%"} h={12} />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-white/50">
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? "bg-[#0F0F0F]" : "bg-[#111111]";
                return (
                  <tr
                    key={item.id ?? idx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`${rowBg} ${
                      onRowClick ? "cursor-pointer" : ""
                    } transition-colors duration-150 hover:bg-[#CC0000]/10`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-white/90">
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-white/50">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, data.length)} of {data.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white/80">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-[rgba(26,107,26,0.3)] text-[#1A6B1A] hover:bg-[#1A6B1A]/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
