"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Book } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Bookmark, CheckCircle, MoreVertical, Trash2, Edit, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPresignedUrl } from "@/lib/api";
import { useTokenCache } from "@/contexts/AuthTokenContext";

import { useOfflineBook } from "@/hooks/useOfflineBook";
import { CloudOff, CloudDownload, Loader2 } from "lucide-react";

interface BookCardProps {
  book: Book;
  viewMode: "grid" | "list";
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onPreload: (book: Book) => void;
  priority?: boolean;
  onEdit?: (book: Book) => void;
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
}

export default function BookCard({
  book,
  viewMode,
  isSelected,
  onToggleSelection,
  onPreload,
  priority = false,
  onEdit,
  onDelete,
  onUpdateStatus,
}: BookCardProps) {
  const { isOffline, isDownloading, saveOffline, removeOffline } = useOfflineBook(book.id, book);

  const normalizeCoverUrl = (coverUrl: string | null | undefined): string => {
    if (!coverUrl) return "/books-cover.jpg";
    if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://"))
      return coverUrl;
    if (coverUrl.startsWith("/")) return coverUrl;
    return `/${coverUrl}`;
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reading":
        return "text-blue-400";
      case "read":
        return "text-green-400";
      case "want-to-read":
        return "text-yellow-400";
      default:
        return "text-gray-300";
    }
  };

  const getAccessToken = useTokenCache();

  const handleDownload = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const url = await getPresignedUrl(book.id, token);

      const link = document.createElement("a");
      link.href = url;
      link.download = book.originalName || book.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download book:", error);
    }
  };

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 ${
          isSelected
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
        }`}
      >
        <div className="flex items-center justify-center pl-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(book.id)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        </div>

        <Link
          href={`/library/read/${book.id}`}
          className="flex-shrink-0 relative w-12 h-16 rounded-md overflow-hidden shadow-sm"
          onMouseEnter={() => onPreload(book)}
          onTouchStart={() => onPreload(book)}
        >
          <Image
            src={normalizeCoverUrl(book.coverUrl)}
            alt={book.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/library/read/${book.id}`}
            className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
              {book.title}
              {isOffline && <CloudOff className="w-3 h-3 text-green-500" />}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {book.author || "Unknown Author"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs font-medium ${getStatusColor(book.status)}`}
            >
              {getStatusLabel(book.status)}
            </span>
            {book.progress > 0 && (
              <span className="text-xs text-gray-400">
                • {Math.round(book.progress)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-45 sm:w-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-border border-gray-300 dark:border-gray-700">
              <DropdownMenuItem onClick={() => onUpdateStatus?.(book.id, "reading")}>
                <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Mark as Reading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus?.(book.id, "read")}>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus?.(book.id, "want-to-read")}>
                <Bookmark className="w-4 h-4 mr-2 text-yellow-500" /> Want to Read
              </DropdownMenuItem>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
              
              {isOffline ? (
                <DropdownMenuItem onClick={removeOffline} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CloudOff className="w-4 h-4 mr-2 text-red-500" />
                  )}
                  Remove from Device
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={saveOffline} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CloudDownload className="w-4 h-4 mr-2 text-blue-500" />
                  )}
                  Make Available Offline
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => onEdit?.(book)}>
                <Edit className="w-4 h-4 mr-2" /> Edit Metadata
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" /> Download File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(book.id)} className="text-red-600 dark:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-800 hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:-translate-y-1"
    >
      {/* Selection Checkbox */}
      <div
        className={`absolute top-3 left-3 z-20 transition-all duration-200 ${
          isSelected
            ? "opacity-100 scale-100"
            : "opacity-100 scale-100 sm:opacity-0 sm:scale-75 sm:group-hover:opacity-100 sm:group-hover:scale-100"
        }`}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(book.id)}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-300 dark:border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      </div>

      {/* Action Menu */}
      <div className="absolute top-3 right-3 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 shadow-sm"
            >
              <MoreVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-45 sm:w-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-border border-gray-300 dark:border-gray-700"
          >
            <DropdownMenuItem
              onClick={() => onUpdateStatus?.(book.id, "reading")}
            >
              <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Mark as
              Reading
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus?.(book.id, "read")}>
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Mark as
              Read
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdateStatus?.(book.id, "want-to-read")}
            >
              <Bookmark className="w-4 h-4 mr-2 text-yellow-500" /> Want to Read
            </DropdownMenuItem>
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
            
            {isOffline ? (
              <DropdownMenuItem onClick={removeOffline} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CloudOff className="w-4 h-4 mr-2 text-red-500" />
                )}
                Remove from Device
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={saveOffline} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CloudDownload className="w-4 h-4 mr-2 text-blue-500" />
                )}
                Make Available Offline
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => onEdit?.(book)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Metadata
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download File
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(book.id)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link
        href={`/library/read/${book.id}`}
        className="block relative aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-gray-800"
        prefetch={true}
        onMouseEnter={() => onPreload(book)}
        onTouchStart={() => onPreload(book)}
      >
        <Image
          src={normalizeCoverUrl(book.coverUrl)}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, 180px"
          priority={priority}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Status Badge */}
        <div className="absolute bottom-3 right-3 z-10">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full backdrop-blur-md bg-black/30 ${getStatusColor(
              book.status
            )}`}
          >
            {getStatusLabel(book.status)}
          </span>
        </div>

        {/* Offline Indicator */}
        {isOffline && (
          <div className="absolute top-3 left-3 z-10">
            <div className="p-1.5 rounded-full bg-green-500/90 backdrop-blur-sm text-white shadow-sm">
              <CloudOff className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700/50 backdrop-blur-sm">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${Math.min(book.progress, 100)}%` }}
            />
          </div>
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <Link
          href={`/library/read/${book.id}`}
          className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1"
        >
          <h3
            className="font-bold text-gray-900 dark:text-white line-clamp-1"
            title={book.title}
          >
            {book.title}
          </h3>
        </Link>
        <p
          className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3"
          title={book.author || undefined}
        >
          {book.author || "Unknown Author"}
        </p>

        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{book.fileType?.toUpperCase() || "BOOK"}</span>
          {book.totalPages && <span>{book.totalPages} pages</span>}
        </div>
      </div>
    </motion.div>
  );
}
