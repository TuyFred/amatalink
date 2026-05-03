import { motion } from 'motion/react';
import { Milk, Users, Shield, ArrowRight, ArrowLeft } from 'lucide-react';

type UserRole = 'farmer' | 'collector' | 'admin';

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  onBack: () => void;
}

const roleInfo = {
  farmer: {
    title: 'Farmer',
    description: 'Track your milk deliveries and earnings',
    features: ['View daily milk production', 'Monitor earnings in real-time', 'Receive delivery notifications'],
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
  },
  collector: {
    title: 'Village Collector',
    description: 'Record and manage milk collections',
    features: ['Record farmer deliveries', 'Track daily collections', 'Submit to sector center'],
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
  },
  admin: {
    title: 'Sector Admin',
    description: 'Oversee and manage all operations',
    features: ['Monitor all collectors', 'Generate reports', 'View analytics dashboard'],
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
  },
};

const roleIcons = {
  farmer: Milk,
  collector: Users,
  admin: Shield,
};

export function RoleSelection({ onRoleSelect, onBack }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl text-gray-900 mb-4">
            Choose Your Role
          </h1>
          <p className="text-xl text-gray-600">
            Select how you'll be using AmataLink
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(roleInfo) as Array<keyof typeof roleInfo>).map((role, index) => {
            const info = roleInfo[role];
            const Icon = roleIcons[role];

            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Hover Gradient Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${info.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Content */}
                <div className="relative z-10 p-8">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${info.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl text-gray-900 group-hover:text-white mb-2 transition-colors">
                    {info.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-white/90 mb-6 transition-colors">
                    {info.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-8">
                    {info.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-600 group-hover:text-white/80 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 bg-gray-400 group-hover:bg-white rounded-full mt-1.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button
                    onClick={() => onRoleSelect(role)}
                    className="w-full py-3 bg-gray-100 group-hover:bg-white text-gray-900 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                  >
                    <span>Select Role</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Decorative Circle */}
                <motion.div
                  className={`absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br ${info.gradient} rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-white rounded-xl shadow-md p-6 max-w-3xl mx-auto">
            <p className="text-sm text-gray-600">
              Demo credentials are pre-loaded for each role. In production, you would sign in with your actual credentials.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
