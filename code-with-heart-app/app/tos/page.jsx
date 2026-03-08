import Link from "next/link";

export const metadata = {
  title: "Terms of Service – Code with Heart",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 2026 · Code with Heart – HTWG Community Platform
        </p>

        <div className="space-y-10 text-sm leading-7 text-foreground">
          {/* §1 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§1 General Provisions</h2>
            <p>
              By accessing or using Code with Heart (hereinafter "the Platform"),
              you agree to these Terms of Service. The Platform is operated by
              HTWG Konstanz and is intended for use by students, faculty, and
              staff of the university community.
            </p>
            <p className="mt-2">
              Where individual agreements exist between a user's organisation and
              HTWG Konstanz, the terms of those agreements take precedence over
              these general terms in the event of a conflict. Cardinal obligations
              always take priority.
            </p>
          </section>

          {/* §2 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§2 Registration and Access</h2>
            <p>
              Access to the Platform requires authentication via the HTWG
              identity provider. Use of your institutional account is subject to
              the terms and policies of HTWG Konstanz and the applicable
              Academic Cloud terms.
            </p>
            <p className="mt-2">
              You are responsible for keeping your credentials confidential and
              for all activity that occurs under your account. If you suspect
              unauthorised access, you must notify the platform administrators
              immediately.
            </p>
          </section>

          {/* §3 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§3 Authorised Use</h2>
            <p>
              Users are required to use the Platform exclusively for authorised
              and lawful purposes in compliance with all applicable laws,
              regulations, and the rights of others — including national, federal,
              state, local, and international laws.
            </p>
            <p className="mt-2">
              The Platform is designed to facilitate peer feedback within the
              HTWG community. Any use outside this purpose requires prior written
              approval from the platform operators.
            </p>
          </section>

          {/* §4 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§4 Development</h2>
            <p>
              You acknowledge that the Platform is under active development and
              that features may change. HTWG Konstanz reserves the right to
              modify, suspend, or discontinue any feature of the Platform at any
              time, with reasonable advance notice where possible.
            </p>
          </section>

          {/* §5 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§5 Updates and Maintenance</h2>
            <p>
              The Platform will be kept up to date through regular updates, which
              may occur within or outside dedicated maintenance windows within
              reasonable timeframes. Planned maintenance that results in
              downtime will be announced in advance where possible.
            </p>
          </section>

          {/* §6 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§6 Prohibited Conduct</h2>
            <p className="mb-2 font-medium">(1) Users are prohibited from using the Platform to transmit, generate, or distribute content that:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Depicts or promotes child sexual exploitation or abuse;</li>
              <li>
                Is sexually explicit and used for non-educational or
                non-scientific purposes;
              </li>
              <li>
                Is discriminatory or promotes violence, hate speech, or illegal
                activities;
              </li>
              <li>
                Violates data protection laws, including the collection or
                distribution of personal data without consent;
              </li>
              <li>Is fraudulent, misleading, harmful, or deceptive;</li>
              <li>Promotes self-harm, harassment, bullying, violence, or terrorism;</li>
              <li>
                Infringes intellectual property rights or attempts to circumvent
                security measures;
              </li>
              <li>
                Could unjustifiably or adversely affect individuals, particularly
                with regard to sensitive or protected characteristics.
              </li>
            </ul>

            <p className="mt-4 mb-2 font-medium">(2) Users are further prohibited from:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Reverse-engineering, decompiling, or disassembling any part of the Platform;</li>
              <li>
                Conducting unauthorised activities such as spamming, distributing
                malware, or any disruptive behaviour that impairs service quality;
              </li>
              <li>Modifying, copying, renting, selling, or distributing the Platform;</li>
              <li>
                Tracking or monitoring individuals without their explicit consent.
              </li>
            </ul>

            <p className="mt-4 mb-2 font-medium">(3) Processing sensitive or confidential data:</p>
            <p>
              Unless the necessary legal framework is in place, users must not process
              sensitive personal data (e.g. data listed in Article 9(1) GDPR) or
              confidential information via the Platform. Where such a legal
              framework exists, individual contractual arrangements take
              precedence.
            </p>

            <p className="mt-4">
              (4) If you use the Platform on behalf of an organisation rather than
              as a private individual, a data processing agreement (Art. 28 GDPR)
              should be concluded between your organisation and HTWG Konstanz. If
              you have concerns about security or data protection, please contact{" "}
              <a
                href="mailto:<support-email>"
                className="underline hover:text-primary"
              >
                &lt;support-email&gt;
              </a>{" "}
              with the subject line "Data Protection – Code with Heart".
            </p>
          </section>

          {/* §7 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§7 Termination and Suspension</h2>
            <p>
              (1) You may stop using the Platform at any time, which constitutes
              termination of your use. If you are a consumer in the EU, you have
              the right to withdraw from these terms within 14 days of acceptance
              by contacting platform support.
            </p>
            <p className="mt-2">
              (2) We reserve the right to suspend or terminate your access to the
              Platform, or to deactivate your account, if you violate these terms,
              if required by law, or if your use of the Platform poses a risk or
              harm to us, other users, or third parties.
            </p>
            <p className="mt-2">
              (3) We will endeavour to notify you before deactivating your
              account, unless this is not possible or is prohibited by law. If
              you believe your account was incorrectly suspended or deactivated,
              you may contact platform support to contest the decision.
            </p>
            <p className="mt-2">
              (4) We reserve the right to take legal action to protect our
              intellectual property rights and the safety of our users. Violations
              of these terms or engagement in illegal activities through the
              Platform may result in civil, administrative, or criminal
              consequences.
            </p>
          </section>

          {/* §8 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§8 User-Generated Content and User Responsibility</h2>

            <h3 className="font-medium mt-4 mb-2">Ownership and Licence</h3>
            <p>
              You retain ownership of any feedback or content you submit through
              the Platform. By submitting content, you grant HTWG Konstanz a
              limited, non-exclusive licence to store, display, and facilitate
              the delivery of that content to its intended recipient(s) within
              the Platform.
            </p>

            <h3 className="font-medium mt-6 mb-2">User Responsibility and Liability</h3>
            <p>
              You are <strong>solely and fully responsible</strong> for any
              content you submit — including its accuracy, appropriateness, and
              compliance with all applicable laws. This includes, but is not
              limited to, laws governing defamation, harassment, data
              protection, copyright, and professional confidentiality. HTWG
              Konstanz accepts no liability for damages caused by content
              submitted by users; full liability for any such damages rests with
              the submitting user.
            </p>
            <p className="mt-2">
              The existence of automated content moderation (see our{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                Data Privacy Notice
              </Link>
              ) does not transfer or reduce your personal responsibility.
              Automated moderation may not detect all policy violations; passing
              moderation does not constitute approval of the content by HTWG
              Konstanz.
            </p>

            <h3 className="font-medium mt-6 mb-2">No Sensitive Personal Data</h3>
            <p>
              You must <strong>not</strong> include sensitive personal data in
              feedback or any other content submitted through the Platform.
              Sensitive personal data within the meaning of Article 9(1) GDPR
              includes, in particular:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Racial or ethnic origin</li>
              <li>Political opinions, religious or philosophical beliefs</li>
              <li>Trade union membership</li>
              <li>Genetic or biometric data</li>
              <li>Health data</li>
              <li>Data concerning a person's sex life or sexual orientation</li>
            </ul>
            <p className="mt-3">
              You must also <strong>not</strong> include any of the following in
              your submissions:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>
                Confidential or proprietary information belonging to third
                parties (e.g. trade secrets, internal company data)
              </li>
              <li>
                Personal identification details of third parties (e.g. home
                addresses, phone numbers, ID numbers)
              </li>
              <li>Passwords, access credentials, or authentication data</li>
              <li>
                Any information whose disclosure would violate a duty of
                confidentiality, professional secrecy, or data protection law
              </li>
            </ul>
            <p className="mt-3">
              If you inadvertently include such data, please contact us
              immediately at{" "}
              <a
                href="mailto:<support-email>"
                className="underline hover:text-primary"
              >
                &lt;support-email&gt;
              </a>{" "}
              so that the content can be removed without delay.
            </p>

            <h3 className="font-medium mt-6 mb-2">Moderation and Removal</h3>
            <p>
              The Platform reserves the right to moderate, withhold, or remove
              content that violates these Terms or applicable law. Users whose
              content is repeatedly found to be in violation may have their
              access suspended or terminated in accordance with §7.
            </p>
          </section>

          {/* §9 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§9 Limitation of Liability</h2>
            <p>
              (1) General: HTWG Konstanz accepts no liability for damages arising
              from improper use of the Platform by users. This limitation does
              not apply to claims based on violation of life, body, or health,
              gross negligence, or intentional or grossly negligent breach of
              duty, nor to breaches of cardinal obligations.
            </p>
            <p className="mt-2">
              (2) User Content: HTWG Konstanz accepts no liability for
              user-generated content submitted through the Platform and assumes
              no responsibility for the accuracy or completeness of peer
              feedback.
            </p>
            <p className="mt-2">
              (3) Confidential Information: We cannot assume liability for the
              loss or disclosure of data that users include in their submissions,
              except in cases of gross negligence or breach of cardinal
              obligations.
            </p>
            <p className="mt-2">
              (4) Service Availability: The Platform is provided on a
              best-effort basis. We do not guarantee uninterrupted availability
              and accept no liability for damages caused by downtime or service
              interruptions beyond our reasonable control.
            </p>
          </section>

          {/* §10 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§10 Third-Party Services</h2>
            <p>
              The Platform may integrate third-party software, products, or
              services (e.g. LinkedIn sharing). These third-party services
              operate independently and are governed by their own terms and
              conditions, which are separate from ours. We are not responsible
              for third-party services and accept no liability for losses or
              damages arising from their use. Users interact with third-party
              services at their own discretion and assume full responsibility
              for any consequences.
            </p>
          </section>

          {/* §11 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§11 Feedback about the Platform</h2>
            <p>
              We value your feedback about Code with Heart and encourage you to
              share your thoughts to help us improve. By submitting feedback
              about the Platform itself, you acknowledge that we may use it to
              improve our offerings without owing you any compensation. We
              reserve the right to use such feedback for any purpose without
              restriction by confidentiality obligations, regardless of whether
              it is marked as confidential.
            </p>
          </section>

          {/* §12 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§12 Data Privacy</h2>
            <p>
              The privacy of our users is of fundamental importance to us. For
              detailed information on how we collect, process, and protect your
              personal data, please refer to our{" "}
              <Link
                href="/privacy"
                className="underline hover:text-primary"
              >
                Data Privacy Notice
              </Link>
              .
            </p>
          </section>

          {/* §13 */}
          <section>
            <h2 className="text-lg font-semibold mb-3">§13 Final Provisions</h2>
            <p>
              Should individual provisions of these Terms of Service be or become
              legally invalid, the remaining provisions shall continue to be
              binding and effective. Statutory provisions shall replace any
              invalid clauses where available. If this would constitute an
              unreasonable hardship for one of the parties, the contract shall
              become invalid in its entirety.
            </p>
            <p className="mt-2">
              These Terms are governed by the laws of the Federal Republic of
              Germany. The place of jurisdiction for all disputes is Konstanz,
              Germany, to the extent permitted by law.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t text-xs text-muted-foreground flex flex-col gap-1">
          <p>Code with Heart · HTWG Konstanz Community Platform</p>
          <div className="flex gap-4">
            <Link href="/tos" className="underline hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy" className="underline hover:text-foreground">
              Data Privacy Notice
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
