'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';

export default function PlatformPreview() {
  const orders = [
    {
      id: 'ORD-001',
      product: 'Custom Logo T-Shirts',
      quantity: '2,500 units',
      status: 'completed',
      stage: 'Delivered',
      progress: 100,
    },
    {
      id: 'ORD-002',
      product: 'Branded Hoodies',
      quantity: '1,200 units',
      status: 'in-progress',
      stage: 'Quality Check',
      progress: 75,
    },
    {
      id: 'ORD-003',
      product: 'Custom Caps',
      quantity: '500 units',
      status: 'pending',
      stage: 'Sample Approval',
      progress: 40,
    },
  ];

  const stages = ['Submitted', 'Sourcing', 'Sample Approval', 'Quality Check', 'Shipped', 'Delivered'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600';
      case 'in-progress':
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <section
      id="platform"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Your Command Center
          </h2>
          <p className="text-lg text-gray-600">
            Track orders in real time from submission to delivery.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-8 shadow-sm overflow-hidden">
          {/* Dashboard Header */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Order Dashboard
            </h3>
            <p className="text-sm text-gray-600">
              Real-time tracking for all your orders
            </p>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-emerald-200 transition-colors"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order ID</p>
                    <h4 className="text-lg font-bold text-gray-900">
                      {order.id}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {order.product}
                    </p>
                    <p className="text-sm text-gray-600">{order.quantity}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {order.stage}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {order.progress}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        order.status === 'completed'
                          ? 'bg-emerald-500'
                          : order.status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${order.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Timeline/Stages */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {stages.map((stage, stageIndex) => {
                    const isCompleted = stageIndex < Math.ceil((order.progress / 100) * stages.length);
                    const isCurrent = stageIndex === Math.ceil((order.progress / 100) * stages.length) - 1;

                    return (
                      <div key={stage} className="flex items-center gap-2 flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : isCurrent ? (
                          <Clock size={16} className="text-blue-500 animate-pulse" />
                        ) : (
                          <Circle size={16} className="text-gray-300" />
                        )}
                        <span
                          className={`text-xs whitespace-nowrap ${
                            isCompleted
                              ? 'text-emerald-700 font-medium'
                              : isCurrent
                              ? 'text-blue-700 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {stage}
                        </span>
                        {stageIndex < stages.length - 1 && (
                          <div className="w-4 h-px bg-gray-300 flex-shrink-0"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Message */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Get instant updates via email and SMS throughout the production process.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
