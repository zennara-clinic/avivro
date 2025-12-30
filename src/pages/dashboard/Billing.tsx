import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { CreditCard, Check, TrendingUp, Download } from 'lucide-react';

export default function Billing() {
  const currentPlan = {
    name: 'Pro',
    price: 49,
    interval: 'month',
    nextBilling: '2025-01-24',
  };

  const usage = {
    conversations: {
      used: 456,
      limit: 2000,
      percentage: 23,
    },
    agents: {
      used: 3,
      limit: 5,
      percentage: 60,
    },
  };

  const invoices = [
    { id: '1', date: '2024-12-24', amount: 49, status: 'paid', pdf: '#' },
    { id: '2', date: '2024-11-24', amount: 49, status: 'paid', pdf: '#' },
    { id: '3', date: '2024-10-24', amount: 49, status: 'paid', pdf: '#' },
  ];

  const plans = [
    {
      name: 'Free',
      price: 0,
      interval: 'forever',
      features: ['50 conversations/month', '1 agent', 'GPT-3.5 Turbo', 'Basic analytics'],
      current: false,
    },
    {
      name: 'Pro',
      price: 49,
      interval: 'month',
      features: [
        '2,000 conversations/month',
        '5 agents',
        'All AI models',
        'Advanced analytics',
        'Priority support',
      ],
      current: true,
    },
    {
      name: 'Business',
      price: 199,
      interval: 'month',
      features: [
        'Unlimited conversations',
        'Unlimited agents',
        'All AI models',
        'Dedicated support',
        'Custom integrations',
      ],
      current: false,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Usage</h1>
          <p className="text-gray-600">Manage your subscription and view usage statistics.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="bg-primary-600 rounded-xl shadow-lg p-8 text-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-primary-100 mb-1">Current Plan</div>
                  <div className="text-3xl font-bold">{currentPlan.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">${currentPlan.price}</div>
                  <div className="text-primary-100">/{currentPlan.interval}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary-100 mb-6">
                <TrendingUp className="w-4 h-4" />
                Next billing date: {currentPlan.nextBilling}
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-white text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition">
                  Change Plan
                </button>
                <button className="px-6 py-2 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition">
                  Cancel Subscription
                </button>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Usage This Month</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Conversations</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {usage.conversations.used} / {usage.conversations.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${usage.conversations.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {usage.conversations.percentage}% of limit used
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Active Agents</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {usage.agents.used} / {usage.agents.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-accent-600 h-2 rounded-full transition-all"
                      style={{ width: `${usage.agents.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {usage.agents.percentage}% of limit used
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Upgrade for More Usage
                </div>
                <div className="text-sm text-blue-700">
                  Need more conversations or agents? Upgrade to Business for unlimited usage.
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">•••• 4242</span>
                    <span className="text-sm text-gray-500">Expires 12/25</span>
                  </div>
                  <div className="text-sm text-gray-600">Visa</div>
                </div>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Update Payment Method
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="/#pricing"
                  className="block px-4 py-2 text-sm text-center border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  View All Plans
                </a>
                <button className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                  Billing History
                </button>
                <button className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                  Update Billing Info
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* All Plans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border-2 ${
                  plan.current
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-4">
                  <div className="text-lg font-bold text-gray-900 mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <div className="w-full py-2 bg-primary-600 text-white text-center rounded-lg font-medium">
                    Current Plan
                  </div>
                ) : (
                  <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                    {plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Billing History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${invoice.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
