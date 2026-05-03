import { useState } from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { faFacebook as faFacebookBrand, faTwitter as faTwitterBrand, faInstagram as faInstagramBrand, faLinkedin as faLinkedinBrand } from '@fortawesome/free-brands-svg-icons';
import { Navigation } from './Navigation';
import { toast } from 'sonner';

interface ContactUsProps {
  onNavigate: (page: string) => void;
}

export function ContactUs({ onNavigate }: ContactUsProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to a backend
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: faMapMarkerAlt,
      title: 'Address',
      details: ['KG 11 Ave, Kigali', 'Rwanda, East Africa'],
      color: 'from-red-500 to-pink-600',
    },
    {
      icon: faPhone,
      title: 'Phone',
      details: ['+250 792 951 577', '+250 786 449 511'],
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: faEnvelope,
      title: 'Email',
      details: ['info@amatalink.com', 'support@amatalink.com'],
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const socialMedia = [
    { icon: faFacebookBrand, name: 'Facebook', color: '#1877F2' },
    { icon: faTwitterBrand, name: 'Twitter', color: '#1DA1F2' },
    { icon: faInstagramBrand, name: 'Instagram', color: '#E4405F' },
    { icon: faLinkedinBrand, name: 'LinkedIn', color: '#0A66C2' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="contact" onNavigate={onNavigate} />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 to-emerald-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <FontAwesomeIcon icon={faEnvelope} className="w-16 h-16 text-white mb-6" />
            <h1 className="text-5xl text-white mb-6">Contact Us</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-32 relative z-10">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mx-auto mb-6`}>
                  <FontAwesomeIcon icon={info.icon} className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl text-gray-900 mb-4">{info.title}</h3>
                {info.details.map((detail, idx) => (
                  <p key={idx} className="text-gray-600">
                    {detail}
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form & Map */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-3xl text-gray-900 mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+250 788 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Info & Social Media */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Office Hours */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl text-gray-900 mb-6">Office Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="text-gray-900">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Saturday</span>
                    <span className="text-gray-900">9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Sunday</span>
                    <span className="text-gray-900">Closed</span>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl text-white mb-6">Connect With Us</h3>
                <p className="text-green-100 mb-6">
                  Follow us on social media for updates, tips, and community stories
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {socialMedia.map((social, index) => (
                    <button
                      key={index}
                      className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm border border-white/20"
                    >
                      <FontAwesomeIcon
                        icon={social.icon}
                        className="w-6 h-6 text-white"
                      />
                      <span className="text-white">{social.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-6">
                <h4 className="text-lg text-orange-900 mb-2">Need Urgent Help?</h4>
                <p className="text-orange-700 mb-3">
                  For urgent technical issues, please call our 24/7 support line:
                </p>
                <a
                  href="tel:+250788000000"
                  className="text-2xl text-orange-600 hover:text-orange-700 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPhone} />
                  +250 786 449 511
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-gray-200 h-96">
        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-700 text-lg">Map Location</p>
            <p className="text-gray-600">KG 11 Ave, Kigali, Rwanda</p>
          </div>
        </div>
      </div>
    </div>
  );
}
