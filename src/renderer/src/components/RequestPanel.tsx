import React, { useState } from 'react';
import { RequestConfig } from '../types';

interface RequestPanelProps {
  request: RequestConfig;
  onRequestChange: (request: RequestConfig) => void;
  onSend: () => void;
  isLoading: boolean;
}

type TabType = 'params' | 'headers' | 'body';

const methodColors: Record<string, string> = {
  GET: 'text-blue-400',
  POST: 'text-green-400',
  PUT: 'text-yellow-400',
  PATCH: 'text-teal-400',
  DELETE: 'text-red-400'
};

export const RequestPanel: React.FC<RequestPanelProps> = ({ 
  request, 
  onRequestChange, 
  onSend,
  isLoading 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('params');

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onRequestChange({ ...request, method: e.target.value as RequestConfig['method'] });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onRequestChange({ ...request, url: e.target.value });
  };

  const addKeyValue = (type: 'params' | 'headers'): void => {
    const key = type === 'params' ? 'params' : 'headers';
    onRequestChange({
      ...request,
      [key]: [...request[key], { key: '', value: '', enabled: true }]
    });
  };

  const updateKeyValue = (
    type: 'params' | 'headers',
    index: number,
    field: 'key' | 'value',
    value: string
  ): void => {
    const key = type === 'params' ? 'params' : 'headers';
    const updated = [...request[key]];
    updated[index] = { ...updated[index], [field]: value };
    onRequestChange({ ...request, [key]: updated });
  };

  const removeKeyValue = (type: 'params' | 'headers', index: number): void => {
    const key = type === 'params' ? 'params' : 'headers';
    const updated = request[key].filter((_, i) => i !== index);
    onRequestChange({ ...request, [key]: updated });
  };

  const renderKeyValueList = (type: 'params' | 'headers'): React.ReactNode => {
    const items = type === 'params' ? request.params : request.headers;
    
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Key"
              value={item.key}
              onChange={(e) => updateKeyValue(type, index, 'key', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Value"
              value={item.value}
              onChange={(e) => updateKeyValue(type, index, 'value', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => removeKeyValue(type, index)}
              className="px-2 py-2 text-gray-400 hover:text-red-400 transition-colors text-lg"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => addKeyValue(type)}
          className="w-full px-3 py-2 border border-dashed border-blue-500 text-blue-400 text-sm rounded hover:bg-blue-500/10 transition-colors text-left"
        >
          + Add {type === 'params' ? 'Parameter' : 'Header'}
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col border-b border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-400">Request</h2>
      </div>
      
      {/* URL Bar */}
      <div className="px-4 py-3 flex gap-2 bg-gray-900">
        <select
          value={request.method}
          onChange={handleMethodChange}
          className={`px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm font-semibold focus:outline-none focus:border-blue-500 ${methodColors[request.method]}`}
        >
          <option value="GET" className="text-gray-300">GET</option>
          <option value="POST" className="text-gray-300">POST</option>
          <option value="PUT" className="text-gray-300">PUT</option>
          <option value="PATCH" className="text-gray-300">PATCH</option>
          <option value="DELETE" className="text-gray-300">DELETE</option>
        </select>
        <input
          type="text"
          placeholder="https://api.example.com/endpoint"
          value={request.url}
          onChange={handleUrlChange}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={onSend}
          disabled={isLoading}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm font-semibold rounded transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1 bg-gray-900 border-b border-gray-700">
        {(['params', 'headers', 'body'] as TabType[]).map((tab) => (
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
        {activeTab === 'params' && renderKeyValueList('params')}
        {activeTab === 'headers' && renderKeyValueList('headers')}
        {activeTab === 'body' && (
          <div className="space-y-3">
            <div className="flex gap-4 p-2 bg-gray-800 rounded">
              {(['none', 'json', 'form', 'text'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="radio"
                    name="bodyType"
                    value={type}
                    checked={request.bodyType === type}
                    onChange={(e) => onRequestChange({ ...request, bodyType: e.target.value as RequestConfig['bodyType'] })}
                    className="cursor-pointer"
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              ))}
            </div>
            {request.bodyType !== 'none' && (
              <textarea
                value={request.body}
                onChange={(e) => onRequestChange({ ...request, body: e.target.value })}
                placeholder="Request body content..."
                className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm font-mono focus:outline-none focus:border-blue-500 resize-y"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
