'use client';

import { useState, useRef } from 'react';
import { XIcon, CodeIcon, UploadIcon, PlayIcon, DownloadIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { VM, RunScriptRequest, RunScriptResponse } from '@/types';
import { toast } from 'react-hot-toast';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  vm: VM | null;
  onRunScript: (vmId: string, script: string, options: any) => Promise<RunScriptResponse>;
}

const exampleScripts = [
  {
    name: 'Basic Navigation',
    script: `// Navigate to a website and get the title
await page.goto('https://example.com');
const title = await page.title();
return { title, url: page.url() };`
  },
  {
    name: 'Form Interaction',
    script: `// Fill out a form and submit
await page.goto('https://example.com/form');
await page.type('#username', 'testuser');
await page.type('#password', 'testpass');
await page.click('#submit-btn');
await page.waitForNavigation();
return { success: true, url: page.url() };`
  },
  {
    name: 'Data Extraction',
    script: `// Extract data from a page
await page.goto('https://example.com/products');
const products = await page.$$eval('.product', elements => 
  elements.map(el => ({
    name: el.querySelector('.name')?.textContent,
    price: el.querySelector('.price')?.textContent
  }))
);
return { products };`
  }
];

export default function ScriptModal({ isOpen, onClose, vm, onRunScript }: ScriptModalProps) {
  const [script, setScript] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunScriptResponse | null>(null);
  const [options, setOptions] = useState({
    screenshot: false,
    selector: '',
    wait_time: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/javascript': ['.js'],
      'text/plain': ['.txt'],
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setScript(e.target?.result as string || '');
        };
        reader.readAsText(file);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vm || !script.trim()) return;

    setIsRunning(true);
    setResult(null);

    try {
      const response = await onRunScript(vm.id, script, options);
      setResult(response);
      toast.success('Script executed successfully');
    } catch (error) {
      toast.error('Failed to execute script');
      console.error('Script execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    if (!isRunning) {
      setScript('');
      setResult(null);
      setOptions({ screenshot: false, selector: '', wait_time: 0 });
      onClose();
    }
  };

  const loadExampleScript = (exampleScript: string) => {
    setScript(exampleScript);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const downloadResult = () => {
    if (!result) return;
    
    const data = {
      vm_id: vm?.id,
      script,
      result,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-result-${vm?.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !vm) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CodeIcon className="h-6 w-6 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Run Script on {vm.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isRunning}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Example Scripts */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Example Scripts
                </label>
                <div className="flex flex-wrap gap-2">
                  {exampleScripts.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => loadExampleScript(example.script)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      {example.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Script Input */}
              <div className="mb-4">
                <label htmlFor="script" className="block text-sm font-medium text-gray-700 mb-2">
                  JavaScript Code
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the file here...'
                      : 'Drag & drop a .js file here, or click to select'}
                  </p>
                </div>
                <textarea
                  ref={textareaRef}
                  id="script"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="mt-2 textarea h-64 font-mono text-sm"
                  placeholder="Enter your JavaScript code here..."
                  disabled={isRunning}
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.screenshot}
                      onChange={(e) => setOptions(prev => ({ ...prev, screenshot: e.target.checked }))}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      disabled={isRunning}
                    />
                    <span className="ml-2 text-sm text-gray-700">Take Screenshot</span>
                  </label>
                </div>
                <div>
                  <label htmlFor="selector" className="block text-sm font-medium text-gray-700 mb-1">
                    CSS Selector
                  </label>
                  <input
                    type="text"
                    id="selector"
                    value={options.selector}
                    onChange={(e) => setOptions(prev => ({ ...prev, selector: e.target.value }))}
                    className="input text-sm"
                    placeholder="#main-content"
                    disabled={isRunning}
                  />
                </div>
                <div>
                  <label htmlFor="wait_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Wait Time (ms)
                  </label>
                  <input
                    type="number"
                    id="wait_time"
                    value={options.wait_time}
                    onChange={(e) => setOptions(prev => ({ ...prev, wait_time: parseInt(e.target.value) || 0 }))}
                    className="input text-sm"
                    min="0"
                    max="30000"
                    disabled={isRunning}
                  />
                </div>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-gray-50 px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">Execution Result</h4>
                  <button
                    type="button"
                    onClick={downloadResult}
                    className="btn btn-secondary text-xs"
                  >
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    Download
                  </button>
                </div>
                <div className="bg-white rounded border p-3 max-h-64 overflow-auto">
                  <SyntaxHighlighter
                    language="json"
                    style={tomorrow}
                    customStyle={{ margin: 0, fontSize: '12px' }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={!script.trim() || isRunning}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Run Script
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isRunning}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
