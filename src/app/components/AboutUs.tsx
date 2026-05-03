import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartLine, faBullseye, faHeart, faLightbulb, faHandshake, faInfoCircle, faEnvelope, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Navigation } from './Navigation';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Import team member images
import imgAssoumpta from '../../assets/assumpta.jpeg';
import imgPhiona from '../../assets/Phiona.jpeg';
import imgAdolphe from '../../assets/adolphe.jpeg';
import imgFlorence from '../../assets/Mutima.jpeg';


interface AboutUsProps {
  onNavigate: (page: string) => void;
}

export function AboutUs({ onNavigate }: AboutUsProps) {
  const values = [
    {
      icon: faHeart,
      title: 'Transparency',
      description: 'We believe in clear, honest communication with all stakeholders in the dairy supply chain.',
      color: 'from-red-500 to-pink-600',
    },
    {
      icon: faLightbulb,
      title: 'Innovation',
      description: 'Leveraging technology to solve real-world challenges faced by dairy farmers and collectors.',
      color: 'from-yellow-500 to-orange-600',
    },
    {
      icon: faHandshake,
      title: 'Collaboration',
      description: 'Building partnerships between farmers, collectors, and administrators for mutual success.',
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const team = [
    {
      name: 'Assoumpta UZARERWA',
      role: 'Designer UI/UX',
      image: imgAssoumpta,
    },
    {
      name: 'INGABIRE Phiona',
      role: 'System Architecture',
      image: imgPhiona,
    },
    {
      name: 'Adolphe NSANZINEZA',
      role: 'Backend & Frontend Developer',
      image: imgAdolphe,
    },
    {
      name: 'MUTIMUKEYE Florence',
      role: 'System Analysis & Design',
      image: imgFlorence,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="about" onNavigate={onNavigate} />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 to-emerald-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <FontAwesomeIcon icon={faInfoCircle} className="w-16 h-16 text-white mb-6" />
            <h1 className="text-5xl text-white mb-6">About AmataLink</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Empowering dairy farmers and collectors in Rwanda through innovative digital solutions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <FontAwesomeIcon icon={faBullseye} className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To digitize and streamline the milk supply chain in rural Rwanda, ensuring transparency,
                accuracy, and fair compensation for all participants. We aim to replace paper-based systems
                with accessible digital solutions that empower farmers and collectors.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <FontAwesomeIcon icon={faChartLine} className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To become the leading milk productivity management platform across East Africa, fostering
                sustainable growth in the dairy industry through technology. We envision a future where
                every dairy farmer has access to transparent, real-time tracking of their production and earnings.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                AmataLink was born from witnessing firsthand the challenges faced by dairy farmers in rural Rwanda.
                Traditional paper-based record-keeping led to disputes, lost records, and delayed payments.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                In 2025, our founder, Sarah Mukamana, a former village collector, decided to leverage technology
                to solve these problems. With a team of passionate technologists and agricultural experts, we
                developed AmataLink - a simple, accessible platform designed specifically for Rwanda's dairy
                community.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Today, we serve over 100 farmers across multiple villages, processing thousands of liters
                of milk daily and ensuring transparent, accurate tracking from farm to collection center.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden shadow-xl"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080"
                alt="Our story"
                className="w-full h-[500px] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-6`}>
                  <FontAwesomeIcon icon={value.icon} className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <FontAwesomeIcon icon={faUsers} className="w-16 h-16 text-green-500 mb-6" />
            <h2 className="text-4xl text-white mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-300">
              Passionate individuals dedicated to transforming dairy farming
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden shadow-xl ring-4 ring-white/10 bg-gray-700">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl text-white mb-2">{member.name}</h3>
                <p className="text-green-400 text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl text-white mb-6">Ready to Join Us?</h2>
            <p className="text-xl text-green-100 mb-8">
              Be part of the digital transformation in Rwanda's dairy industry
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => onNavigate('signup')}
                className="px-8 py-4 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-all shadow-lg text-lg flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Sign Up Now
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-8 py-4 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-all border-2 border-white/30 text-lg flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faEnvelope} />
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}