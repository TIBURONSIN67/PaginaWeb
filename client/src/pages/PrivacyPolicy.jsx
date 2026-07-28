import { Link } from 'react-router-dom';
import { Shield, Smartphone, Database, Lock, Mail, FileText, Globe, MessageCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: Shield,
      title: '1. Information We Collect',
      content: (
        <div className="space-y-2">
          <p>When you interact with our WhatsApp Business account, we may collect the following information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Phone Number:</strong> Your WhatsApp phone number to identify and communicate with you.</li>
            <li><strong>Profile Name:</strong> The name associated with your WhatsApp account.</li>
            <li><strong>Message Content:</strong> The text, images, and other content you send through WhatsApp.</li>
            <li><strong>Order Information:</strong> Products you inquire about, quotations requested, and orders placed.</li>
            <li><strong>Shipping Address:</strong> If you provide it when placing an order.</li>
            <li><strong>Message Timestamps:</strong> When messages are sent and received.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Smartphone,
      title: '2. How We Use Your Information',
      content: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>To respond to your product inquiries and provide customer support.</li>
            <li>To process and fulfill your orders.</li>
            <li>To send order confirmations, updates, and delivery notifications.</li>
            <li>To generate quotations for products you request.</li>
            <li>To improve our products and services based on customer interactions.</li>
            <li>To maintain a record of our business transactions with you.</li>
            <li>To comply with legal obligations and resolve disputes.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Database,
      title: '3. Data Storage and Security',
      content: (
        <div className="space-y-2">
          <p>Your data is stored securely on our servers using industry-standard security measures:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All data is stored in encrypted databases with access controls.</li>
            <li>We use secure HTTPS connections for all API communications.</li>
            <li>Access to customer data is restricted to authorized employees only.</li>
            <li>Messages are processed through Meta's secure WhatsApp Cloud API.</li>
            <li>We retain conversation history to provide continuity in customer service.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Lock,
      title: '4. AI Processing (OpenAI)',
      content: (
        <div className="space-y-2">
          <p>We use OpenAI's API to power our AI sales assistant:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your WhatsApp messages are sent to OpenAI for natural language processing.</li>
            <li>OpenAI processes messages to understand your intent and generate responses.</li>
            <li>Message content is used solely for generating relevant product recommendations and answers.</li>
            <li>OpenAI does not retain or store your messages for training purposes.</li>
            <li>Messages are processed in transit and not permanently stored by OpenAI.</li>
            <li>You can request human assistance at any time instead of AI processing.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Globe,
      title: '5. Data Sharing and Third Parties',
      content: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Meta (WhatsApp):</strong> Messages are transmitted through Meta's WhatsApp Cloud API infrastructure.</li>
            <li><strong>OpenAI:</strong> Message content is processed by OpenAI's API for AI responses.</li>
            <li><strong>No Selling of Data:</strong> We do not sell, rent, or trade your personal information to third parties.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
            <li><strong>Service Providers:</strong> We may share data with trusted service providers who assist in operating our business, subject to confidentiality agreements.</li>
          </ul>
        </div>
      )
    },
    {
      icon: FileText,
      title: '6. Your Rights',
      content: (
        <div className="space-y-2">
          <p>You have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> Request a copy of your personal data we hold.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate information.</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data.</li>
            <li><strong>Opt-Out:</strong> Request to stop AI processing and use human-only support.</li>
            <li><strong>Data Portability:</strong> Request your data in a portable format.</li>
            <li><strong>Withdraw Consent:</strong> You can stop using our WhatsApp service at any time.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Shield,
      title: '7. Data Retention',
      content: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Conversation history is retained to provide consistent customer service.</li>
            <li>Order records are kept for legal and accounting purposes.</li>
            <li>You can request deletion of your conversation history at any time.</li>
            <li>Inactive customer data may be archived after 24 months of inactivity.</li>
            <li>We regularly review and purge unnecessary data.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Globe,
      title: '8. International Data Transfers',
      content: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Your data may be processed in countries where our service providers operate.</li>
            <li>We ensure appropriate safeguards are in place for international data transfers.</li>
            <li>We comply with applicable data protection laws in all jurisdictions we operate.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Shield,
      title: '9. Children\'s Privacy',
      content: (
        <div className="space-y-2">
          <ul className="list-disc pl-5 space-y-1">
            <li>Our services are not directed to individuals under the age of 13.</li>
            <li>We do not knowingly collect personal information from children under 13.</li>
            <li>If we become aware that a child under 13 has provided personal data, we will delete it promptly.</li>
          </ul>
        </div>
      )
    },
    {
      icon: Mail,
      title: '10. Contact Us',
      content: (
        <div className="space-y-2">
          <p>If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Email:</strong> info@mobilepartsstore.com</li>
            <li><strong>Phone:</strong> +1 (555) 123-4567</li>
            <li><strong>Address:</strong> 123 Tech Street, Suite 100, San Francisco, United States</li>
            <li><strong>WhatsApp:</strong> Send "Privacy Policy" via WhatsApp for more information</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Mobile Parts Store</span>
          </div>
          <Link to="/" className="btn-ghost text-sm">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Last updated: January 2026
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            We take your privacy seriously. This policy explains how we collect, use, and protect your information
            when you interact with our WhatsApp Business account and AI-powered sales assistant.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="card p-6 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <section.icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 card p-8 bg-primary-50 border-primary-100 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy
            Policy periodically for any changes.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link to="/" className="btn-primary">
              Back to Home
            </Link>
            <a
              href="https://wa.me/?text=I have a question about the privacy policy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <MessageCircle className="w-4 h-4" /> Contact via WhatsApp
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Mobile Parts Store. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <a href="mailto:info@mobilepartsstore.com" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
