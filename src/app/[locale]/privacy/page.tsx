import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy - TRICKEST',
    description: 'Learn how TRICKEST collects, uses, and protects your data.',
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations('metadata');

  return (
    <div className="min-h-screen bg-darkBg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg p-8">
          <h1 className="text-4xl font-black uppercase text-white mb-6 tracking-wider">
            Privacy Policy
          </h1>

          <div className="text-neutral-300 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-accent-cyan-500 mb-3 uppercase">
                Last Updated: March 12, 2026
              </h2>
              <p>
                TRICKEST ("we," "our," or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                when you use our skateboarding challenge platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                1. Information We Collect
              </h2>

              <h3 className="text-lg font-bold text-white mb-2">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email & Password:</strong> For account creation and authentication</li>
                <li><strong>Profile Data:</strong> Name, username, photo, gender, birthdate</li>
                <li><strong>Skate Profile:</strong> Skate setup, location, social media links</li>
              </ul>

              <h3 className="text-lg font-bold text-white mb-2 mt-4">Activity Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Submissions:</strong> Video URLs, scores, feedback</li>
                <li><strong>Engagement:</strong> Votes, comments, team memberships</li>
                <li><strong>Performance:</strong> Challenge completion, points earned</li>
              </ul>

              <h3 className="text-lg font-bold text-white mb-2 mt-4">Analytics Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Analytics 4:</strong> Page views, sessions, device info, geolocation</li>
                <li><strong>Microsoft Clarity:</strong> Session recordings, heatmaps, click behavior</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain the platform functionality</li>
                <li>Process challenge submissions and evaluations</li>
                <li>Improve user experience through analytics</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Communicate about platform updates and features</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                3. Legal Bases for Processing (GDPR)
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contract Performance:</strong> Account management, submissions, scoring</li>
                <li><strong>Legitimate Interest:</strong> Analytics, security, platform improvement</li>
                <li><strong>Consent:</strong> Profile completion, social features, marketing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                4. Your Rights (GDPR & CCPA)
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your account and data</li>
                <li><strong>Right to Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to data processing based on legitimate interest</li>
                <li><strong>Right to Withdraw Consent:</strong> Revoke consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                5. Data Security
              </h2>
              <p className="mb-3">We implement industry-standard security measures:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> TLS 1.3 for data in transit, AES-256 for data at rest</li>
                <li><strong>Password Hashing:</strong> bcrypt with 10 rounds</li>
                <li><strong>Access Control:</strong> Role-based access (skater, judge, admin)</li>
                <li><strong>SQL Injection Protection:</strong> Prisma ORM parameterized queries</li>
                <li><strong>XSS Protection:</strong> React automatic escaping</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                6. Data Retention
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> Until account deletion</li>
                <li><strong>Analytics (GA4):</strong> 14 months</li>
                <li><strong>Session Recordings:</strong> 30 days</li>
                <li><strong>Server Logs:</strong> 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                7. Third-Party Services
              </h2>
              <p className="mb-3">We use the following services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Analytics 4:</strong> User behavior analytics</li>
                <li><strong>Microsoft Clarity:</strong> Heatmaps and session recordings</li>
                <li><strong>Google OAuth:</strong> Authentication service</li>
                <li><strong>YouTube:</strong> Video hosting for submissions</li>
                <li><strong>Supabase:</strong> Database hosting</li>
                <li><strong>Vercel:</strong> Application hosting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                8. International Data Transfers
              </h2>
              <p>
                Your data may be transferred to and processed in countries other than your own,
                including the United States. We ensure adequate protection through:
                Standard Contractual Clauses (SCC) and GDPR Adequacy Decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                9. Children's Privacy
              </h2>
              <p>
                Our platform is not intended for children under 13. We do not knowingly collect
                personal information from children under 13. If you are a parent or guardian
                and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                10. Contact Us
              </h2>
              <p className="mb-2">For privacy inquiries, contact us at:</p>
              <p className="text-accent-cyan-500 font-bold">
                📧 privacy@trickest.com
              </p>
            </section>

            <section className="border-t border-neutral-700 pt-6 mt-8">
              <p className="text-neutral-400 text-xs">
                This policy is reviewed annually and updated as required by law.
                Last reviewed: March 12, 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
