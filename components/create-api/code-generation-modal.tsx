// Code Generation Modal Component
'use client';

import { CopyIcon, DownloadIcon, XIcon } from 'lucide-react';

interface CodeGenerationModalProps {
  generatedCode: {
    files: Array<{
      name: string;
      content: string;
    }>;
  } | null;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
}

export function CodeGenerationModal({
  generatedCode,
  onClose,
  onCopySuccess,
}: CodeGenerationModalProps) {
  if (!generatedCode) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold">Generated Code</h3>
          <button onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {generatedCode.files.map((file, index) => (
            <div key={index} className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">{file.name}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(file.content);
                      onCopySuccess('Copied!');
                    }}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <CopyIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([file.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = file.name;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <DownloadIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{file.content}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

