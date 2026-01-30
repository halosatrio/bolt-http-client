import React from 'react';
import type { SavedRequest } from '../types';

interface SidebarProps {
  onNewRequest: () => void;
  onSelectRequest: (request: SavedRequest) => void;
  onDeleteRequest: (id: string) => void;
  onClearHistory: () => void;
  requestHistory: SavedRequest[];
}

const methodColors: Record<string, string> = {
  GET: 'bg-blue-500 text-gray-900',
  POST: 'bg-green-500 text-gray-900',
  PUT: 'bg-yellow-500 text-gray-900',
  PATCH: 'bg-teal-400 text-gray-900',
  DELETE: 'bg-red-500 text-white'
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  }
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  return date.toLocaleDateString();
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  onNewRequest, 
  onSelectRequest, 
  onDeleteRequest,
  onClearHistory,
  requestHistory 
}) => {
  return (
    <aside className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-sm font-semibold text-gray-400 mb-3">HTTP Client</h1>
        <button
          onClick={onNewRequest}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
        >
          + New Request
        </button>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            History ({requestHistory.length})
          </h2>
          {requestHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {requestHistory.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No requests yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Send a request to see it here
              </p>
            </div>
          ) : (
            requestHistory.map((req) => (
              <div
                key={req.id}
                className="group flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div 
                  className="flex-1 min-w-0"
                  onClick={() => onSelectRequest(req)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 ${methodColors[req.method]}`}>
                      {req.method}
                    </span>
                    <span className="text-sm text-blue-400 truncate">
                      {req.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(req.timestamp)}
                    </span>
                    <span className="text-xs text-gray-600 truncate">
                      {req.url}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(req.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 px-2 py-1 text-gray-500 hover:text-red-400 transition-all"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
