import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { RequestPanel } from "./components/RequestPanel";
import { ResponsePanel } from "./components/ResponsePanel";
import type { RequestConfig, ResponseData, SavedRequest } from "./types";

const mockResponse: ResponseData = {
  status: 200,
  statusText: "OK",
  time: 245,
  size: "1.2 KB",
  headers: {
    "content-type": "application/json; charset=utf-8",
    date: "Fri, 30 Jan 2026 12:00:00 GMT",
    server: "nginx/1.18.0",
    "x-powered-by": "Express",
  },
  body: JSON.stringify(
    {
      userId: 1,
      id: 1,
      title:
        "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
    },
    null,
    2,
  ),
};

const initialRequest: RequestConfig = {
  method: "GET",
  url: "https://jsonplaceholder.typicode.com/posts/1",
  params: [{ key: "page", value: "1", enabled: true }],
  headers: [
    { key: "Content-Type", value: "application/json", enabled: true },
    { key: "Authorization", value: "Bearer token_here", enabled: true },
  ],
  body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
  bodyType: "json",
};

export default function App(): React.JSX.Element {
  const [request, setRequest] = useState<RequestConfig>(initialRequest);
  const [response, setResponse] = useState<ResponseData>(mockResponse);
  const [isLoading, setIsLoading] = useState(false);
  const [requestHistory, setRequestHistory] = useState<SavedRequest[]>([]);

  const handleSendRequest = async (): Promise<void> => {
    if (!request.url) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await window.api.sendHttpRequest({
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
        bodyType: request.bodyType,
      });

      setResponse(response);
      
      // Save request to history
      const newSavedRequest: SavedRequest = {
        ...request,
        id: Date.now().toString(),
        timestamp: Date.now(),
        name: `${request.method} ${new URL(request.url).pathname || request.url}`,
      };
      
      setRequestHistory(prev => [newSavedRequest, ...prev]);
    } catch (error) {
      setResponse({
        status: 0,
        statusText: "Error",
        time: 0,
        size: "0 B",
        headers: {},
        body: error instanceof Error ? error.message : "Failed to send request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRequest = (): void => {
    setRequest({
      method: "GET",
      url: "",
      params: [],
      headers: [],
      body: "",
      bodyType: "none",
    });
  };

  const handleSelectRequest = (savedRequest: SavedRequest): void => {
    setRequest({
      method: savedRequest.method,
      url: savedRequest.url,
      params: savedRequest.params,
      headers: savedRequest.headers,
      body: savedRequest.body,
      bodyType: savedRequest.bodyType,
    });
  };

  const handleDeleteRequest = (id: string): void => {
    setRequestHistory(prev => prev.filter(req => req.id !== id));
  };

  const handleClearHistory = (): void => {
    setRequestHistory([]);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-300 flex overflow-hidden">
      <Sidebar
        onNewRequest={handleNewRequest}
        onSelectRequest={handleSelectRequest}
        onDeleteRequest={handleDeleteRequest}
        onClearHistory={handleClearHistory}
        requestHistory={requestHistory}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <RequestPanel
          request={request}
          onRequestChange={setRequest}
          onSend={handleSendRequest}
          isLoading={isLoading}
        />
        <ResponsePanel response={response} />
      </main>
    </div>
  );
}
