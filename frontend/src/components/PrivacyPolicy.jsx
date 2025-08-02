import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, AlertTriangle, Users, Lock } from 'lucide-react'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600">Last updated: January 2024</p>
            </div>
          </div>
        </div>

        <div className="card space-y-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Important Safety Notice</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Chatter's Paradise is not responsible for the individuals you meet or the information you share. 
                  Users are responsible for their own safety and should exercise caution when sharing personal information.
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Anonymous Usage</h3>
                <p>For free anonymous chat, we only collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Username (temporary, lost when you close the site)</li>
                  <li>Chat messages (not stored permanently)</li>
                  <li>Connection logs for service maintenance</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Registered Users</h3>
                <p>When you create an account, we collect:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Email address (for verification)</li>
                  <li>Username (permanent)</li>
                  <li>Password (encrypted)</li>
                  <li>Optional phone number</li>
                  <li>Account preferences and settings</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4 text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                <li>Provide chat services and match you with other users</li>
                <li>Process payments for premium features</li>
                <li>Send important service notifications</li>
                <li>Improve our services and user experience</li>
                <li>Prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <div className="space-y-4 text-gray-700">
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in these circumstances:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who help us operate the platform</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p>We implement industry-standard security measures to protect your information:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>End-to-end encryption for chat messages</li>
                    <li>Secure HTTPS connections</li>
                    <li>Encrypted data storage</li>
                    <li>Regular security audits</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <div className="space-y-4 text-gray-700">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data</li>
                <li>Lodge a complaint with authorities</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
            <div className="space-y-4 text-gray-700">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Remember your preferences</li>
                <li>Maintain your session</li>
                <li>Analyze site usage</li>
                <li>Improve our services</li>
              </ul>
              <p>You can control cookie settings through your browser preferences.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Services</h2>
            <div className="space-y-4 text-gray-700">
              <p>We may use third-party services for:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Payment processing (Stripe, PayPal)</li>
                <li>Email services (SendGrid, Mailgun)</li>
                <li>Analytics (Google Analytics)</li>
                <li>Authentication (Google OAuth)</li>
              </ul>
              <p>These services have their own privacy policies.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <div className="space-y-4 text-gray-700">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Anonymous users:</strong> Data is deleted when you close the browser</li>
                <li><strong>Registered users:</strong> Data is retained until you delete your account</li>
                <li><strong>Chat messages:</strong> Not stored permanently</li>
                <li><strong>Payment data:</strong> Retained as required by law</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <div className="space-y-4 text-gray-700">
              <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Users</h2>
            <div className="space-y-4 text-gray-700">
              <p>If you are accessing our service from outside your country, please note that your information may be transferred to and processed in countries with different data protection laws.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <div className="space-y-4 text-gray-700">
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <div className="space-y-4 text-gray-700">
              <p>If you have any questions about this privacy policy, please contact us:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Email: privacy@chattersparadise.com</li>
                <li>Address: [Your Business Address]</li>
                <li>Phone: [Your Contact Number]</li>
              </ul>
            </div>
          </section>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Community Guidelines</h3>
                <p className="text-gray-700 text-sm">
                  Please respect other users and follow our community guidelines. 
                  Harassment, hate speech, and inappropriate behavior are not tolerated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy 