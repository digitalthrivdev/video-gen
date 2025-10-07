"use client"

import { VideoIcon } from "lucide-react";
import Link from "next/link";

const TermsOfUse = () => {
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
              Terms of Use
            </h1>
            
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              <strong>Last updated:</strong> January 5, 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  1. Acceptance of Terms
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    By accessing and using Next Video Gen ("the Service"), you accept and agree to be bound 
                    by the terms and provision of this agreement. If you do not agree to abide by the above, 
                    please do not use this service.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  2. Description of Service
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    Next Video Gen is an AI-powered video generation platform that allows users to create 
                    videos from text prompts and images. The service includes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Text-to-video generation using AI technology</li>
                    <li>Image-to-video generation capabilities</li>
                    <li>Video storage and management</li>
                    <li>Token-based usage system</li>
                    <li>User account management</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  3. User Accounts
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    To use certain features of the Service, you must create an account. You agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your account information</li>
                    <li>Keep your password secure and confidential</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  4. Acceptable Use
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>You agree not to use the Service to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Generate content that is illegal, harmful, or violates any laws</li>
                    <li>Create content that is defamatory, obscene, or offensive</li>
                    <li>Generate content that infringes on intellectual property rights</li>
                    <li>Create content that promotes violence, discrimination, or hate speech</li>
                    <li>Attempt to reverse engineer or exploit the Service</li>
                    <li>Use the Service for commercial purposes without permission</li>
                    <li>Upload malicious files or attempt to compromise system security</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  5. Content and Intellectual Property
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    <strong>Your Content:</strong> You retain ownership of the content you upload and the prompts you provide. 
                    By using the Service, you grant us a license to process your content for the purpose of providing the Service.
                  </p>
                  <p>
                    <strong>Generated Videos:</strong> You own the videos generated using your prompts and content, subject to 
                    the terms of this agreement and applicable laws.
                  </p>
                  <p>
                    <strong>Our Technology:</strong> The Service, including its software, algorithms, and technology, 
                    is owned by us and protected by intellectual property laws.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  6. Payment and Billing
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    The Service operates on a token-based system. You agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Pay all fees associated with your use of the Service</li>
                    <li>Provide accurate billing information</li>
                    <li>Authorize us to charge your payment method</li>
                    <li>Understand that all sales are final and non-refundable</li>
                    <li>Accept that token prices may change with notice</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  7. Service Availability
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We strive to provide reliable service but cannot guarantee uninterrupted access. 
                    The Service may be temporarily unavailable due to maintenance, updates, or technical issues. 
                    We reserve the right to modify or discontinue the Service at any time.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  8. Privacy
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    Your privacy is important to us. Please review our Privacy Policy, which also governs 
                    your use of the Service, to understand our practices.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  9. Disclaimers and Limitations
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, 
                    EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p>
                    IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
                    DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING FROM YOUR USE OF THE SERVICE.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  10. Termination
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We may terminate or suspend your account and access to the Service immediately, without prior 
                    notice, for any reason, including breach of these Terms of Use.
                  </p>
                  <p>
                    You may terminate your account at any time by contacting us or using the account deletion 
                    feature in your account settings.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  11. Changes to Terms
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    We reserve the right to modify these Terms of Use at any time. We will notify users of 
                    material changes by posting the updated terms on this page. Your continued use of the 
                    Service after such changes constitutes acceptance of the new terms.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  12. Governing Law
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    These Terms of Use shall be governed by and construed in accordance with applicable laws, 
                    without regard to conflict of law principles.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  13. Contact Information
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-neutral-400">
                  <p>
                    If you have any questions about these Terms of Use, please contact us at:
                  </p>
                  <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
                    <p><strong>Email:</strong> legal@nextvideogen.com</p>
                    <p><strong>Address:</strong> Next Video Gen, Legal Department</p>
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

export default TermsOfUse;
