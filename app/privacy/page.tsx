"use client"

import { VideoIcon } from "lucide-react";
import Link from "next/link";

const PrivacyPolicy = () => {
  return (
    <>
      {/* Fixed Navbar */}
      <div className="fixed top-0 inset-x-0 z-50 border-b bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-left">
            <VideoIcon className="h-5 w-5" />
            <span className="text-lg font-semibold">Vimeo AI</span>
          </Link>
          {/* Back to Home */}
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="min-h-screen pt-20 pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Privacy Policy
            </h1>
            
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              <strong>Last updated:</strong> January 5, 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  1. Information We Collect
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We collect information you provide directly to us, such as when you create an account, 
                    generate videos, or contact us for support.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Information:</strong> Email address, name, and authentication credentials</li>
                    <li><strong>Video Content:</strong> Prompts, uploaded images, and generated videos</li>
                    <li><strong>Usage Data:</strong> How you interact with our service, including video generation requests</li>
                    <li><strong>Payment Information:</strong> Token purchases and billing details (processed securely by third-party providers)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  2. How We Use Your Information
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide, maintain, and improve our video generation services</li>
                    <li>Process your video generation requests and deliver results</li>
                    <li>Manage your account and process payments</li>
                    <li>Communicate with you about your account and our services</li>
                    <li>Ensure the security and integrity of our platform</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  3. Information Sharing
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We do not sell, trade, or otherwise transfer your personal information to third parties, 
                    except in the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Service Providers:</strong> We may share information with trusted third-party services that help us operate our platform (e.g., cloud storage, payment processing)</li>
                    <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                    <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, user information may be transferred as part of the business assets</li>
                    <li><strong>Consent:</strong> We may share information with your explicit consent</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  4. Data Security
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal 
                    information against unauthorized access, alteration, disclosure, or destruction. However, 
                    no method of transmission over the internet or electronic storage is 100% secure.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  5. Data Retention
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We retain your personal information for as long as necessary to provide our services 
                    and fulfill the purposes outlined in this privacy policy. Generated videos and associated 
                    data may be retained for a reasonable period to ensure service quality and support.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  6. Your Rights
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and update your personal information</li>
                    <li>Delete your account and associated data</li>
                    <li>Opt out of certain communications</li>
                    <li>Request a copy of your data</li>
                    <li>Object to certain processing activities</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  7. Cookies and Tracking
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                    and provide personalized content. You can control cookie settings through your browser preferences.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  8. Children's Privacy
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    Our service is not intended for children under 13 years of age. We do not knowingly 
                    collect personal information from children under 13. If we become aware that we have 
                    collected such information, we will take steps to delete it promptly.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  9. Changes to This Policy
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We may update this privacy policy from time to time. We will notify you of any material 
                    changes by posting the new policy on this page and updating the "Last updated" date.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  10. Contact Us
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    If you have any questions about this privacy policy or our data practices, please contact us at:
                  </p>
                  <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
                    <p><strong>Email:</strong> privacy@nextvideogen.com</p>
                    <p><strong>Address:</strong> Next Video Gen, Privacy Department</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
