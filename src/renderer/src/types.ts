export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  body: string;
  bodyType: 'none' | 'json' | 'form' | 'text';
}

export interface ResponseData {
  status: number;
  statusText: string;
  time: number;
  size: string;
  headers: Record<string, string>;
  body: string;
}
