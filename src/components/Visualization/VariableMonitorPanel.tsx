import React from 'react';
import { FiEye } from 'react-icons/fi';

interface VariableMonitorPanelProps {
  variables: Record<string, string | number>;
  title?: string;
}

const VariableMonitorPanel: React.FC<VariableMonitorPanelProps> = ({ variables, title = '变量监控' }) => {
  const entries = Object.entries(variables);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-2">
          <FiEye className="text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        <p className="text-xs text-gray-400">暂无变量数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
        <FiEye className="text-blue-500 w-4 h-4" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded px-3 py-2 border border-gray-100">
              <div className="text-xs text-gray-500 truncate" title={key}>{key}</div>
              <div className="text-sm font-mono font-semibold text-indigo-700 truncate" title={String(value)}>
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VariableMonitorPanel;
