import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cookie Policy - TRICKEST',
    description: 'Learn about cookies and how we use them on TRICKEST.',
  };
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-darkBg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg p-8">
          <h1 className="text-4xl font-black uppercase text-white mb-6 tracking-wider">
            Cookie Policy
          </h1>

          <div className="text-neutral-300 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-accent-cyan-500 mb-3 uppercase">
                Last Updated: March 12, 2026
              </h2>
              <p>
                This Cookie Policy explains how TRICKEST uses cookies and similar technologies
                to provide, secure, and improve our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                What Are Cookies?
              </h2>
              <p>
                Cookies are small text files stored on your device when you visit websites.
                They help websites remember your preferences and improve your browsing experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                How We Use Cookies
              </h2>
              <p className="mb-3">We use cookies for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication:</strong> Keep you logged in</li>
                <li><strong>Preferences:</strong> Remember your settings</li>
                <li><strong>Analytics:</strong> Understand how you use our platform</li>
                <li><strong>Security:</strong> Protect against fraud and abuse</li>
                <li><strong>Performance:</strong> Optimize platform speed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                Types of Cookies We Use
              </h2>

              <div className="space-y-4">
                <div className="bg-neutral-800 p-4 rounded-lg border-l-4 border-red-500">
                  <h3 className="text-lg font-bold text-white mb-2">
                    🔒 Necessary Cookies (Required)
                  </h3>
                  <p className="mb-2 text-neutral-400">These cookies are essential for the platform to function.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Session JWT:</strong> Maintains your login state</li>
                    <li><strong>Cookie Consent:</strong> Remembers your cookie preferences</li>
                    <li><strong>CSRF Token:</strong> Prevents cross-site request forgery attacks</li>
                  </ul>
                  <p className="mt-2 text-red-400 text-xs font-bold">
                    CANNOT BE DISABLED - Required for platform functionality
                  </p>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="text-lg font-bold text-white mb-2">
                    📊 Analytics Cookies (Optional)
                  </h3>
                  <p className="mb-2 text-neutral-400">These cookies help us understand user behavior.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Google Analytics 4:</strong>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-neutral-400">
                        <li>Tracks page views, sessions, and user flow</li>
                        <li>Measures engagement and bounce rates</li>
                        <li>Provides device and location data</li>
                        <li>Retention: 14 months</li>
                      </ul>
                    </li>
                    <li><strong>Microsoft Clarity:</strong>
                      <ul className="list-disc pl-6 mt-1 space-y-1 text-neutral-400">
                        <li>Records user sessions for UX analysis</li>
                        <li>Creates heatmaps showing click patterns</li>
                        <li>Tracks scroll depth and rage clicks</li>
                        <li>Retention: 30 days (recordings), 90 days (heatmaps)</li>
                      </ul>
                    </li>
                  </ul>
                  <p className="mt-2 text-yellow-400 text-xs font-bold">
                    CAN BE DISABLED - Use cookie banner to opt-out
                  </p>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border-l-4 border-green-500">
                  <h3 className="text-lg font-bold text-white mb-2">
                    📣 Marketing Cookies (Future - Not Implemented)
                  </h3>
                  <p className="mb-2 text-neutral-400">These cookies will be used for marketing purposes.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Social Media Pixels:</strong> Track ad conversions</li>
                    <li><strong>Email Tracking:</strong> Measure email campaign effectiveness</li>
                    <li><strong>Retargeting:</strong> Show relevant ads</li>
                  </ul>
                  <p className="mt-2 text-green-400 text-xs font-bold">
                    NOT YET IMPLEMENTED - Coming soon
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                Third-Party Cookies
              </h2>
              <p className="mb-3">Our platform uses third-party services that may set cookies:</p>

              <div className="bg-neutral-800 p-4 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-2 text-accent-cyan-500">Service</th>
                      <th className="text-left py-2 text-accent-cyan-500">Purpose</th>
                      <th className="text-left py-2 text-accent-cyan-500">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-400">
                    <tr className="border-b border-neutral-700/50">
                      <td className="py-2">Google Analytics</td>
                      <td className="py-2">User analytics</td>
                      <td className="py-2">
                        <a href="https://policies.google.com/privacy"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-accent-cyan-500 hover:underline">
                          View Policy
                        </a>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700/50">
                      <td className="py-2">Microsoft Clarity</td>
                      <td className="py-2">Heatmaps & recordings</td>
                      <td className="py-2">
                        <a href="https://privacy.microsoft.com/"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-accent-cyan-500 hover:underline">
                          View Policy
                        </a>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700/50">
                      <td className="py-2">Google OAuth</td>
                      <td className="py-2">Authentication</td>
                      <td className="py-2">
                        <a href="https://policies.google.com/privacy"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-accent-cyan-500 hover:underline">
                          View Policy
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">YouTube</td>
                      <td className="py-2">Video hosting</td>
                      <td className="py-2">
                        <a href="https://policies.google.com/privacy"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-accent-cyan-500 hover:underline">
                          View Policy
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                Managing Cookies
              </h2>

              <h3 className="text-lg font-bold text-white mb-2">Our Cookie Banner</h3>
              <p className="mb-3">
                When you first visit TRICKEST, you'll see a cookie banner that lets you:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Accept All:</strong> Enable necessary, analytics, and marketing cookies</li>
                <li><strong>Necessary Only:</strong> Enable only required cookies</li>
                <li><strong>Customize:</strong> Choose which cookie categories to accept</li>
              </ul>

              <h3 className="text-lg font-bold text-white mb-2">Browser Settings</h3>
              <p className="mb-3">
                You can also manage cookies through your browser settings:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>
              <p className="mt-3 text-yellow-400 text-xs">
                ⚠️ Blocking necessary cookies may prevent the platform from functioning properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                Cookie Lifespan
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain until expiration or deletion</li>
                <li><strong>Authentication Cookies:</strong> 30 days (configurable)</li>
                <li><strong>Analytics Cookies:</strong> 14 months - 2 years</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                Updates to This Policy
              </h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify users of
                significant changes via email or platform notification. Continued use after
                changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                Contact Us
              </h2>
              <p className="mb-2">For questions about our use of cookies, contact us at:</p>
              <p className="text-accent-cyan-500 font-bold">
                📧 privacy@trickest.com
              </p>
            </section>

            <section className="border-t border-neutral-700 pt-6 mt-8">
              <p className="text-neutral-400 text-xs">
                By using TRICKEST, you consent to our use of cookies as described in this policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
