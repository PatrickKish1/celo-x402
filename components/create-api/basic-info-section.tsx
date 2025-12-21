// Basic Info Section Component
'use client';

interface BasicInfoSectionProps {
  apiName: string;
  apiDescription: string;
  baseUrl: string;
  apiType: 'existing' | 'native';
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onBaseUrlChange: (url: string) => void;
}

export function BasicInfoSection({
  apiName,
  apiDescription,
  baseUrl,
  apiType,
  onNameChange,
  onDescriptionChange,
  onBaseUrlChange,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Name *</label>
          <input
            type="text"
            value={apiName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="My Awesome API"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={apiDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your API..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        {apiType === 'existing' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base URL *</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => onBaseUrlChange(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

