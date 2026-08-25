// pages/FAQ.jsx
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Package, 
  Truck, 
  Shield, 
  Clock, 
  CreditCard,
  User,
  HelpCircle,
  Mail,
  Phone
} from 'lucide-react';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});

  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'general', label: 'General', icon: Package },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'account', label: 'Account', icon: User }
  ];

  const faqData = [
    {
      id: 1,
      category: 'general',
      question: 'What is Deliveroo?',
      answer: 'SendIT is a modern courier and parcel delivery platform that connects senders with reliable couriers across Kenya. We provide real-time tracking, secure delivery, and transparent pricing for all your parcel delivery needs.'
    },
    {
      id: 2,
      category: 'general',
      question: 'How does Deliveroo work?',
      answer: 'Simply create an account, enter your parcel details (pickup location, destination, weight), get an instant quote, and confirm your order. A courier will be assigned to pick up your parcel and deliver it to the destination. You can track your parcel in real-time throughout the journey.'
    },
    {
      id: 3,
      category: 'general',
      question: 'Is Deliveroo available nationwide?',
      answer: 'Yes! Deliveroo operates across all major cities and towns in Kenya, including Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, and many more. We are continuously expanding our coverage to reach more areas.'
    },
    {
      id: 4,
      category: 'delivery',
      question: 'How long does delivery take?',
      answer: 'Delivery times vary depending on the distance. Same-day delivery is available for local deliveries (within the same city). Inter-city deliveries typically take 1-3 business days. You can see estimated delivery times when creating your order.'
    },
    {
      id: 5,
      category: 'delivery',
      question: 'Can I change the delivery address?',
      answer: 'Yes, you can change the delivery address as long as the parcel has not been marked as "In Transit" or "Delivered". Simply go to your order details and click "Edit Destination" to update the address. Additional charges may apply if the new destination is farther.'
    },
    {
      id: 6,
      category: 'delivery',
      question: 'What happens if my parcel is delayed?',
      answer: 'If your parcel is delayed, we will notify you immediately via email and SMS. You can also track the real-time status of your parcel on the app. If the delay exceeds the estimated delivery time by more than 24 hours, you may be eligible for a partial refund.'
    },
    {
      id: 7,
      category: 'delivery',
      question: 'Can I cancel my order?',
      answer: 'Yes, you can cancel your order as long as the parcel has not been marked as "Delivered". To cancel, go to your order details and click "Cancel Order". Cancellations made before pickup are fully refunded. Cancellations after pickup may incur a small processing fee.'
    },
    {
      id: 8,
      category: 'payment',
      question: 'What payment methods are accepted?',
      answer: 'We accept M-Pesa, bank transfers, and credit/debit cards (Visa, Mastercard). All payments are securely processed through our payment partners. Cash payments are also accepted for some locations upon request.'
    },
    {
      id: 9,
      category: 'payment',
      question: 'How is the delivery cost calculated?',
      answer: 'The delivery cost is calculated based on the distance between pickup and destination, the weight of the parcel, and the delivery speed chosen. Our pricing is transparent - you\'ll see a detailed breakdown of all charges before confirming your order.'
    },
    {
      id: 10,
      category: 'payment',
      question: 'Is my payment information secure?',
      answer: 'Absolutely! We use industry-standard encryption and security protocols to protect your payment information. All transactions are processed through secure payment gateways. We never store your full card details on our servers.'
    },
    {
      id: 11,
      category: 'account',
      question: 'How do I create an account?',
      answer: 'To create an account, click on the "Sign Up" button in the top right corner. Fill in your details (name, email, phone, password) and agree to our terms of service. You\'ll receive a confirmation email to verify your account.'
    },
    {
      id: 12,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'If you\'ve forgotten your password, click on the "Forgot Password" link on the login page. Enter your email address, and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.'
    },
    {
      id: 13,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Log in to your account, go to the "Profile" section, and click "Edit Profile". You can update your name, email, phone number, and other details. Don\'t forget to save your changes after updating.'
    },
    {
      id: 14,
      category: 'delivery',
      question: 'What items are prohibited from being sent?',
      answer: 'For safety and legal reasons, we do not transport illegal items, hazardous materials, flammable substances, weapons, perishable goods, or live animals. Please refer to our full terms of service for the complete list of prohibited items.'
    },
    {
      id: 15,
      category: 'general',
      question: 'What is the maximum weight for a parcel?',
      answer: 'The maximum weight for a single parcel is 50kg. For heavier items, please contact our customer support team for special arrangements. Standard weight categories are: 0-1kg, 1-5kg, 5-10kg, and 10kg+.'
    }
  ];

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            Find answers to common questions about our services, delivery, payment, and more
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeCategory === category.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${activeCategory === category.id ? 'text-white' : 'text-slate-400'}`} />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No results found. Try a different search term.</p>
            </div>
          ) : (
            filteredFAQs.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-slate-900">{item.question}</span>
                  {expandedItems[item.id] ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </button>
                {expandedItems[item.id] && (
                  <div className="px-6 pb-4">
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {categories.find(c => c.id === item.category)?.label || item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Still Have Questions?
          </h3>
          <p className="text-slate-600 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:support@deliveroo.com"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email Support
            </a>
            <a
              href="tel:+254712345678"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
            >
              <Phone className="h-4 w-4" />
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;