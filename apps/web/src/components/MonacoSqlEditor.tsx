'use client';

import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface MonacoSqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
  height?: string;
}

export default function MonacoSqlEditor({
  value,
  onChange,
  onRun,
  readOnly = false,
  height = '100%',
}: MonacoSqlEditorProps) {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    if (onRun) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun();
      });
    }
  };

  return (
    <div className="w-full h-full border-t border-border overflow-hidden bg-white">
      <Editor
        height={height}
        language="sql"
        theme="vs-light"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
