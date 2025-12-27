import { useState, useRef, useEffect } from 'react';
import type { ChatSession } from '../../lib/types/chat';

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this chat?')) {
      onDelete();
    }
    setShowMenu(false);
  };

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
      }`}
      onClick={() => !isEditing && onSelect()}
    >
      <svg
        className="w-4 h-4 flex-shrink-0 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-gray-600 text-white text-sm rounded px-2 py-1 outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{session.title}</span>
      )}

      {!isEditing && (
        <div className="absolute right-2 hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditTitle(session.title);
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-gray-600"
            title="Rename"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 rounded hover:bg-gray-600 text-red-400"
            title="Delete"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
