import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms of Service - TRICKEST',
    description: 'Terms and conditions for using the TRICKEST platform.',
  };
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-darkBg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-neutral-900 border-2 border-accent-cyan-500 rounded-lg p-8">
          <h1 className="text-4xl font-black uppercase text-white mb-6 tracking-wider">
            Terms of Service
          </h1>

          <div className="text-neutral-300 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-accent-cyan-500 mb-3 uppercase">
                Last Updated: March 12, 2026
              </h2>
              <p>
                Welcome to TRICKEST. By accessing or using our skateboarding challenge platform,
                you agree to be bound by these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account or using TRICKEST, you acknowledge that you have read,
                understood, and agree to be bound by these Terms. If you do not agree to these terms,
                please do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                2. Age Requirement
              </h2>
              <p>
                You must be at least 13 years old to use TRICKEST. By using our platform,
                you represent and warrant that you are at least 13 years old.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                3. Account Responsibilities
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You must provide accurate and complete information when creating your account</li>
                <li>You must not share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                4. User Conduct
              </h2>
              <p className="mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit fake, misleading, or fraudulent content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post inappropriate or offensive content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use automated tools to manipulate the platform</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the intellectual property rights of others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                5. Content & Submissions
              </h2>
              <h3 className="text-lg font-bold text-white mb-2">Video Submissions</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You retain ownership of content you submit</li>
                <li>You grant us a license to use, display, and process your submissions</li>
                <li>You are responsible for ensuring you have rights to any content you submit</li>
                <li>Submissions may be evaluated by judges and rated by the community</li>
                <li>We reserve the right to remove any content that violates these terms</li>
              </ul>

              <h3 className="text-lg font-bold text-white mb-2 mt-4">Evaluation & Scoring</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Judges' decisions are final and binding</li>
                <li>Scores are based on subjective evaluation criteria</li>
                <li>We cannot guarantee fair evaluation in all cases</li>
                <li>Disputes will be reviewed by administrators</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                6. Intellectual Property
              </h2>
              <h3 className="text-lg font-bold text-white mb-2">Our Rights</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>TRICKEST name, logo, and design are our trademarks</li>
                <li>Platform code, design, and features are our property</li>
                <li>You may not copy, modify, or distribute our platform without permission</li>
              </ul>

              <h3 className="text-lg font-bold text-white mb-2 mt-4">Your Rights</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You retain ownership of your original content</li>
                <li>You grant us a license to use your content for platform purposes</li>
                <li>You are responsible for any intellectual property violations in your submissions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                7. Privacy & Data
              </h2>
              <p>
                Your use of TRICKEST is also governed by our Privacy Policy,
                which explains how we collect, use, and protect your data.
                By using our platform, you consent to our data practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                8. Termination
              </h2>
              <h3 className="text-lg font-bold text-white mb-2">By You</h3>
              <p>You may terminate your account at any time by contacting us or using account deletion features.</p>

              <h3 className="text-lg font-bold text-white mb-2 mt-4">By Us</h3>
              <p>We may suspend or terminate your account if:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You violate these Terms of Service</li>
                <li>You engage in fraudulent or abusive behavior</li>
                <li>Your account is inactive for an extended period</li>
                <li>We discontinue the platform or features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                9. Disclaimers
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Platform is provided "AS IS" without warranties of any kind</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not responsible for user-submitted content</li>
                <li>Skateboarding carries inherent risks; participate at your own risk</li>
                <li>We make no guarantees about challenge fairness or scoring accuracy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                10. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, TRICKEST shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of data, profits, or opportunities</li>
                <li>User conduct or third-party content</li>
                <li>Technical errors or service interruptions</li>
              </ul>
              <p className="mt-3">
                Our total liability shall not exceed the amount you paid (if any) for the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                11. Dispute Resolution
              </h2>
              <p>
                Any disputes arising from these terms shall be resolved through binding arbitration
                in accordance with the rules of the American Arbitration Association.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                12. Changes to Terms
              </h2>
              <p>
                We may modify these Terms at any time. We will notify users of significant changes
                via email or platform notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-accent-purple-500 mb-3 uppercase">
                13. Contact Us
              </h2>
              <p className="mb-2">For questions about these Terms, contact us at:</p>
              <p className="text-accent-cyan-500 font-bold">
                📧 legal@trickest.com
              </p>
            </section>

            <section className="border-t border-neutral-700 pt-6 mt-8">
              <p className="text-neutral-400 text-xs">
                By using TRICKEST, you acknowledge that you have read, understood,
                and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
