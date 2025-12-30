import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { ArrowLeft, Copy, Check, Code } from 'lucide-react';
import { useState } from 'react';

type Platform = 'html' | 'wordpress' | 'webflow' | 'shopify' | 'squarespace';

export default function EmbedInstructions() {
  const { id } = useParams();
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('html');

  const agent = {
    id: id || 'agent_1',
    name: 'Support Assistant',
    primaryColor: '#4f46e5',
    position: 'bottom-right',
  };

  const embedCode = {
    html: `<!-- Avivro Chat Widget -->
<script src="https://cdn.avivro.com/widget.js"></script>
<script>
  Avivro.init({
    agentId: '${agent.id}',
    primaryColor: '${agent.primaryColor}',
    position: '${agent.position}'
  });
</script>`,
    wordpress: `1. Go to Appearance > Theme Editor
2. Open your theme's footer.php file
3. Paste this code before the closing </body> tag:

<!-- Avivro Chat Widget -->
<script src="https://cdn.avivro.com/widget.js"></script>
<script>
  Avivro.init({
    agentId: '${agent.id}',
    primaryColor: '${agent.primaryColor}',
    position: '${agent.position}'
  });
</script>

4. Click "Update File" to save changes`,
    webflow: `1. Open your Webflow project
2. Go to Project Settings > Custom Code
3. Paste this code in the Footer Code section:

<script src="https://cdn.avivro.com/widget.js"></script>
<script>
  Avivro.init({
    agentId: '${agent.id}',
    primaryColor: '${agent.primaryColor}',
    position: '${agent.position}'
  });
</script>

4. Publish your site for changes to take effect`,
    shopify: `1. From your Shopify admin, go to Online Store > Themes
2. Click Actions > Edit code
3. Find and open theme.liquid
4. Paste this code before the closing </body> tag:

<script src="https://cdn.avivro.com/widget.js"></script>
<script>
  Avivro.init({
    agentId: '${agent.id}',
    primaryColor: '${agent.primaryColor}',
    position: '${agent.position}'
  });
</script>

5. Click Save`,
    squarespace: `1. Go to Settings > Advanced > Code Injection
2. Paste this code in the Footer section:

<script src="https://cdn.avivro.com/widget.js"></script>
<script>
  Avivro.init({
    agentId: '${agent.id}',
    primaryColor: '${agent.primaryColor}',
    position: '${agent.position}'
  });
</script>

3. Click Save`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode[selectedPlatform]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const platforms = [
    { id: 'html', name: 'Plain HTML', description: 'For custom websites' },
    { id: 'wordpress', name: 'WordPress', description: 'WP sites' },
    { id: 'webflow', name: 'Webflow', description: 'Webflow projects' },
    { id: 'shopify', name: 'Shopify', description: 'E-commerce stores' },
    { id: 'squarespace', name: 'Squarespace', description: 'Squarespace sites' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/dashboard/agents/${id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agent
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Embed Instructions</h1>
          <p className="text-gray-600">
            Follow the steps below to add your {agent.name} to your website.
          </p>
        </div>

        {/* Platform Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Select Your Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id as Platform)}
                className={`p-4 rounded-lg border-2 text-center transition ${
                  selectedPlatform === platform.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{platform.name}</div>
                <div className="text-xs text-gray-600">{platform.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Installation Code</h2>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap">{embedCode[selectedPlatform]}</pre>
          </div>
        </div>

        {/* Step-by-step */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Step-by-Step Guide</h2>
          
          {selectedPlatform === 'html' && (
            <ol className="space-y-4">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Copy the embed code</div>
                  <div className="text-sm text-gray-600">
                    Click the "Copy Code" button above to copy the widget code to your clipboard.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Open your HTML file</div>
                  <div className="text-sm text-gray-600">
                    Locate the HTML file where you want the chat widget to appear (usually your main layout or template file).
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Paste before &lt;/body&gt;</div>
                  <div className="text-sm text-gray-600">
                    Find the closing &lt;/body&gt; tag and paste the code just before it. This ensures the widget loads properly.
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Save and deploy</div>
                  <div className="text-sm text-gray-600">
                    Save your changes and deploy to your live site. The chat widget should appear immediately!
                  </div>
                </div>
              </li>
            </ol>
          )}

          {selectedPlatform !== 'html' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {embedCode[selectedPlatform]}
              </p>
            </div>
          )}
        </div>

        {/* Verification */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-3">Verify Installation</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• Visit your website and look for the chat bubble in the {agent.position.replace('-', ' ')}</li>
            <li>• Click the bubble to open the chat widget</li>
            <li>• Send a test message to ensure it's working correctly</li>
            <li>• Check that the widget matches your brand colors</li>
          </ul>
          <div className="mt-4">
            <Link
              to={`/dashboard/agents/${id}/test`}
              className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium"
            >
              Test your agent first →
            </Link>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Troubleshooting</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Widget not appearing?</strong> Make sure the code is placed before the closing &lt;/body&gt; tag</li>
            <li>• <strong>Script errors?</strong> Check your browser console for any JavaScript errors</li>
            <li>• <strong>Style issues?</strong> Ensure there are no CSS conflicts with your existing styles</li>
            <li>• <strong>Still need help?</strong> Contact our support team at support@avivro.com</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
