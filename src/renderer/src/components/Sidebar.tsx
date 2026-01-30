import React from 'react';

interface SidebarProps {
  onNewRequest: () => void;
  onSelectRequest: (method: string, url: string) => void;
}

const savedRequests = [
  { method: 'GET', url: 'api/users', path: 'https://jsonplaceholder.typicode.com/users' },
  { method: 'POST', url: 'api/users', path: 'https://jsonplaceholder.typicode.com/users' },
  { method: 'PUT', url: 'api/users/1', path: 'https://jsonplaceholder.typicode.com/users/1' },
  { method: 'PATCH', url: 'api/users/1', path: 'https://jsonplaceholder.typicode.com/users/1' },
  { method: 'DELETE', url: 'api/users/1', path: 'https://jsonplaceholder.typicode.com/users/1' }
];

const methodColors: Record<string, string> = {
  GET: 'bg-blue-500 text-gray-900',
  POST: 'bg-green-500 text-gray-900',
  PUT: 'bg-yellow-500 text-gray-900',
  PATCH: 'bg-teal-400 text-gray-900',
  DELETE: 'bg-red-500 text-white'
};

export const Sidebar: React.FC<SidebarProps> = ({ onNewRequest, onSelectRequest }) => {
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-sm font-semibold text-gray-400 mb-3">HTTP Client</h1>
        <button
          onClick={onNewRequest}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
        >
          + New Request
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {savedRequests.map((req, index) => (
          <div
            key={index}
            onClick={() => onSelectRequest(req.method, req.path)}
            className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${methodColors[req.method]}`}>
              {req.method}
            </span>
            <span className="text-sm text-blue-400 truncate">{req.url}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};
