'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Key,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Cpu,
  Eye,
  EyeOff,
  Layers,
  Wrench,
} from 'lucide-react';

interface McpConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
  serverUrl?: string;
}

export default function McpConnectionModal({
  isOpen,
  onClose,
  apiKey = 'mcp_db_platform_live_key_2026',
  serverUrl,
}: McpConnectionModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursor' | 'claude' | 'antigravity'>('cursor');

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8082';
  const effectiveUrl = serverUrl || `${currentHost}/api/mcp`;

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        db_analytics_platform: {
          url: effectiveUrl,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        db_analytics_platform: {
          command: 'npx',
          args: ['-y', 'tsx', 'scripts/mcp-server.ts'],
          env: {
            MCP_API_KEY: apiKey,
            DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/app_db',
          },
        },
      },
    },
    null,
    2
  );

  const antigravityConfig = JSON.stringify(
    {
      name: 'db-analytics-learning-platform',
      transport: 'http',
      endpoint: effectiveUrl,
      headers: {
        'x-api-key': apiKey,
      },
    },
    null,
    2
  );

  const tools = [
    { name: 'list_courses', desc: 'List all master courses, module count, and class sections' },
    { name: 'get_course_curriculum', desc: 'Fetch full 16-week syllabus, slides, quizzes, and project labs' },
    { name: 'create_course_with_16_weeks', desc: 'Create course and auto-generate 16 structured weekly modules' },
    { name: 'update_week_content', desc: 'Update title, description, lecture slides HTML, or quiz data' },
    { name: 'auto_generate_16_weeks', desc: 'Auto-populate complete 16 weeks on any course' },
    { name: 'delete_course', desc: 'Permanently delete master course and cascaded records' },
    { name: 'list_classes', desc: 'List active and completed class sections/cohorts' },
    { name: 'create_class', desc: 'Create a new class section for a semester term' },
    { name: 'delete_class', desc: 'Permanently delete a class section and student grades' },
    { name: 'execute_sandbox_sql', desc: 'Run SQL safely inside isolated PostgreSQL sandbox' },
    { name: 'get_gradebook', desc: 'Fetch weighted score matrix and final letter grades' },
  ];

  return (
    <div
      data-testid="mcp-connection-modal"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
    >
      <div className="bg-surface border border-border rounded-lg shadow-xl max-w-2xl w-full p-5 space-y-4 font-sans flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-ink">AI Model Context Protocol (MCP)</h3>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-green-50 text-status-success border border-green-200">
                  Active & Enabled
                </span>
              </div>
              <p className="text-xs text-ink-secondary">
                Connect external AI agents (Claude, Cursor, Antigravity) to manage courses, 16 weeks of content, and classes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-ink-secondary hover:text-ink p-1 rounded hover:bg-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Credentials Box */}
        <div className="space-y-3 bg-subtle/50 p-3.5 rounded border border-border text-xs">
          {/* MCP Endpoint URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-ink-secondary uppercase tracking-wider">
              MCP Server Endpoint URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={effectiveUrl}
                className="flex-1 bg-white border border-border rounded px-2.5 py-1.5 font-mono text-xs text-ink select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(effectiveUrl, setCopiedUrl)}
                className="px-2.5 py-1.5 border border-border bg-white hover:bg-subtle text-ink rounded font-medium flex items-center space-x-1 shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* MCP Secret API Key */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-ink-secondary uppercase tracking-wider">
              MCP API Secret Key
            </label>
            <div className="flex items-center space-x-2">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={apiKey}
                className="flex-1 bg-white border border-border rounded px-2.5 py-1.5 font-mono text-xs text-ink select-all focus:outline-none"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
                className="p-1.5 border border-border bg-white hover:bg-subtle text-ink rounded"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => copyToClipboard(apiKey, setCopiedKey)}
                className="px-2.5 py-1.5 border border-border bg-white hover:bg-subtle text-ink rounded font-medium flex items-center space-x-1 shrink-0"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Code Snippets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Client Configuration</span>
            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={() => setActiveTab('cursor')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  activeTab === 'cursor' ? 'bg-zinc-900 text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Cursor
              </button>
              <button
                onClick={() => setActiveTab('claude')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  activeTab === 'claude' ? 'bg-zinc-900 text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Claude Desktop
              </button>
              <button
                onClick={() => setActiveTab('antigravity')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  activeTab === 'antigravity' ? 'bg-zinc-900 text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Antigravity / Agent
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-zinc-950 text-zinc-100 p-3 rounded text-[11px] font-mono overflow-x-auto leading-relaxed max-h-44">
              {activeTab === 'cursor' && cursorConfig}
              {activeTab === 'claude' && claudeDesktopConfig}
              {activeTab === 'antigravity' && antigravityConfig}
            </pre>
            <button
              onClick={() => {
                const text =
                  activeTab === 'cursor'
                    ? cursorConfig
                    : activeTab === 'claude'
                    ? claudeDesktopConfig
                    : antigravityConfig;
                copyToClipboard(text, setCopiedConfig);
              }}
              className="absolute top-2 right-2 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-mono flex items-center space-x-1"
            >
              {copiedConfig ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
              <span>{copiedConfig ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Available MCP Tools */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-ink">
            <Wrench className="w-3.5 h-3.5 text-ink-secondary" />
            <span>Available AI Tools ({tools.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {tools.map((t) => (
              <div key={t.name} className="p-1.5 bg-subtle/40 border border-border rounded text-[11px]">
                <div className="font-mono font-medium text-ink">{t.name}</div>
                <div className="text-[10px] text-ink-secondary truncate">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-ink text-white rounded hover:bg-ink-secondary transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
