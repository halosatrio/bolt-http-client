import React, { useState } from 'react';
import { ResponseData } from '../types';

interface ResponsePanelProps {
  response: ResponseData;
}

type TabType = 'body' | 'headers';

const getStatusColor = (status: number): string => {
  if (status === 0) return 'text-red-500';
  if (status >= 200 && status < 300) return 'text-green-400';
  if (status >= 300 && status < 400) return 'text-yellow-400';
  if (status >= 400) return 'text-red-400';
  return 'text-gray-400';
};

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
  const [activeTab, setActiveTab] = useState<TabType>('body');

  const handleCopy = (): void => {
    navigator.clipboard.writeText(response.body);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-400">Response</h2>
        <div className="flex gap-4 text-sm">
          <span className={`font-semibold ${getStatusColor(response.status)}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-gray-500">{response.time} ms</span>
          <span className="text-gray-500">{response.size}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1 bg-gray-900 border-b border-gray-700">
        {(['body', 'headers'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-500 border-transparent hover:text-gray-400'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-auto bg-gray-900">
        {activeTab === 'body' && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3 p-2 bg-gray-800 rounded">
              <select className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-400 focus:outline-none focus:border-blue-500">
                <option value="json">JSON</option>
                <option value="html">HTML</option>
                <option value="text">Text</option>
              </select>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-400 text-sm rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="flex-1 p-4 bg-gray-800 border border-gray-700 rounded overflow-auto">
              <code className="text-sm font-mono text-gray-300">{response.body}</code>
            </pre>
          </div>
        )}
        {activeTab === 'headers' && (
          <div className="space-y-2">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex p-3 bg-gray-800 rounded">
                <span className="w-48 text-sm text-blue-400 font-medium">{key}</span>
                <span className="flex-1 text-sm text-orange-400 break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
