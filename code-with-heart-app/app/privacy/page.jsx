import Link from "next/link";

export const metadata = {
  title: "Data Privacy Notice – Code with Heart",
};

export default function DataPrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Data Privacy Notice</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 2026 · Code with Heart – HTWG Community Platform
        </p>

        <div className="space-y-10 text-sm leading-7 text-foreground">
          {/* Responsible party */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Responsible Party</h2>
            <p>
              The entity responsible for data processing within the meaning of
              Art. 4 No. 7 GDPR and other applicable national data protection
              laws is:
            </p>
            <div className="mt-3 rounded-lg border bg-muted/40 px-5 py-4 font-mono text-xs leading-6">
              HTWG Konstanz – University of Applied Sciences
              <br />
              Alfred-Wachtel-Straße 8
              <br />
              78462 Konstanz, Germany
              <br />
              E-Mail:{" "}
              <a
                href="mailto:<support-email>"
                className="underline hover:text-primary"
              >
                &lt;support-email&gt;
              </a>
              <br />
              Website:{" "}
              <a
                href="https://www.htwg-konstanz.de"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                www.htwg-konstanz.de
              </a>
            </div>
            <p className="mt-3">
              The responsible party is the natural or legal person who, alone or
              jointly with others, determines the purposes and means of
              processing personal data.
            </p>
          </section>

          {/* Data Protection Officer */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Data Protection Officer</h2>
            <p>
              Questions and requests regarding the protection of your personal
              data can be directed to our Data Protection Officer:
            </p>
            <div className="mt-3 rounded-lg border bg-muted/40 px-5 py-4 font-mono text-xs leading-6">
              Data Protection Officer
              <br />
              HTWG Konstanz
              <br />
              Alfred-Wachtel-Straße 8
              <br />
              78462 Konstanz, Germany
              <br />
              E-Mail:{" "}
              <a
                href="mailto:<datenschutz-email>"
                className="underline hover:text-primary"
              >
                &lt;datenschutz-email&gt;
              </a>
            </div>
          </section>

          {/* Scope of applicability */}
          <section>
            <h2 className="text-lg font-semibold mb-3">General Data Processing</h2>

            <h3 className="font-medium mt-4 mb-2">Scope in the Case of Individual Agreements</h3>
            <p>
              If you access this Platform through your organisation, the data
              protection policies and notices of your organisation apply. In the
              event of a conflict between these privacy provisions and the terms
              of an agreement concluded with HTWG Konstanz (e.g. a data
              processing agreement pursuant to Art. 28 GDPR), the terms of that
              agreement shall always prevail. Cardinal obligations always take
              priority over these general provisions.
            </p>
            <p className="mt-2">
              If in doubt, please check with your institution to determine which
              data protection policies apply to you.
            </p>

            <h3 className="font-medium mt-6 mb-2">Overview of the Service</h3>
            <p>
              Code with Heart is a community platform for HTWG Konstanz that
              enables students and faculty to exchange peer feedback. The
              Platform consists of a web frontend through which users can
              compose, send, and receive feedback. Optionally, users may connect
              a LinkedIn account to share feedback endorsements publicly.
            </p>

            <h3 className="font-medium mt-6 mb-2">Scope of Personal Data Processing</h3>
            <p>
              We process personal data of our users only to the extent necessary
              to provide a functional Platform and our associated services. The
              processing of personal data generally takes place only after the
              user's consent (Art. 6(1)(a) GDPR). An exception applies where
              obtaining prior consent is not possible for factual reasons and
              processing is permitted by law.
            </p>

            <h3 className="font-medium mt-6 mb-2">Legal Basis for Processing</h3>
            <p>
              Where we obtain consent from users for processing operations, Art.
              6(1)(a) GDPR serves as the legal basis. Where processing is
              necessary for the performance of a contract to which the user is a
              party, Art. 6(1)(b) GDPR serves as the legal basis. Where
              processing is necessary for compliance with a legal obligation, Art.
              6(1)(c) GDPR applies. Where processing is necessary to protect the
              vital interests of the data subject or another person, Art. 6(1)(d)
              GDPR applies. Where processing is necessary to safeguard a
              legitimate interest of HTWG Konstanz or a third party and the
              interests, fundamental rights, and freedoms of the data subject do
              not override the former, Art. 6(1)(f) GDPR serves as the legal
              basis.
            </p>
          </section>

          {/* Using the Platform */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Using the Platform (Frontend)</h2>

            <h3 className="font-medium mt-4 mb-2">Description and Scope of Processing</h3>
            <p>
              Each time you access Code with Heart, the system automatically
              records data and information from the accessing device. The
              following data are collected:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Timestamp of access</li>
              <li>Operating system and browser information (User-Agent)</li>
              <li>IP address of the accessing device</li>
            </ul>
            <p className="mt-3">
              This data is also stored in our system's log files. No storage of
              this data together with other personal data of the user takes place.
            </p>

            <h3 className="font-medium mt-6 mb-2">Duration of Storage</h3>
            <p>
              Log data is retained for a maximum of 30 days and then
              automatically deleted, unless a security incident requires longer
              retention for investigative purposes.
            </p>
          </section>

          {/* Account data */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Account and Profile Data</h2>

            <h3 className="font-medium mt-4 mb-2">Description and Scope of Processing</h3>
            <p>
              Upon sign-in via the HTWG identity provider, the following data
              from your institutional account are processed and stored in our
              database:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Faculty / organisational unit (if provided)</li>
              <li>Profile picture URL (if connected via LinkedIn)</li>
            </ul>

            <h3 className="font-medium mt-6 mb-2">Purpose</h3>
            <p>
              This data is used to identify you within the Platform, to display
              your profile to other users, and to enable the sending and receiving
              of peer feedback.
            </p>

            <h3 className="font-medium mt-6 mb-2">Duration of Storage</h3>
            <p>
              Account data is retained for as long as you have an active account
              on the Platform. Upon request, your account and all associated
              personal data will be deleted within a reasonable timeframe, except
              where retention is required by law.
            </p>
          </section>

          {/* Feedback */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Feedback Data</h2>

            <h3 className="font-medium mt-4 mb-2">Description and Scope of Processing</h3>
            <p>
              Feedback submitted through the Platform is stored in our database
              and associated with the sender and recipient. The following data
              are processed:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Feedback content (text)</li>
              <li>Sender identifier</li>
              <li>Recipient identifier</li>
              <li>Submission timestamp</li>
              <li>Status (e.g. pending, delivered, published)</li>
            </ul>
            <h3 className="font-medium mt-6 mb-2">User Responsibility Regarding Feedback Content</h3>
            <p>
              Users are solely responsible for the content they submit.{" "}
              <strong>
                You must not include sensitive personal data or confidential
                information of third parties in your feedback.
              </strong>{" "}
              Sensitive personal data includes, among other things, health
              information, data revealing racial or ethnic origin, religious
              beliefs, political opinions, or data concerning a person's sex life
              or sexual orientation (Art. 9(1) GDPR). Inclusion of such data
              without a valid legal basis constitutes a breach of the{" "}
              <Link href="/tos" className="underline hover:text-primary">
                Terms of Service
              </Link>{" "}
              and may result in legal liability under applicable data protection
              law.
            </p>

            <h3 className="font-medium mt-6 mb-2">AI-Based Content Moderation</h3>
            <p>
              Before a submitted feedback is stored, its <strong>text content</strong> is
              automatically transmitted to an AI-powered content moderation
              service to detect prohibited content as defined in §6 of the{" "}
              <Link href="/tos" className="underline hover:text-primary">
                Terms of Service
              </Link>
              .
            </p>
            <p className="mt-2">
              <strong>
                Only the plain text of the feedback is sent to the moderation
                service.
              </strong>{" "}
              The sender's identity, the recipient's identity, and all other
              metadata (names, email addresses, user IDs, timestamps) are{" "}
              <strong>not</strong> included in this transmission. The moderation
              service receives and processes an anonymous text string only.
            </p>
            <p className="mt-2">
              The moderation result (approved / rejected) is stored alongside the
              feedback entry in our database. The feedback text itself is not
              retained by the moderation service beyond the duration of a single
              moderation request.
            </p>

            <h3 className="font-medium mt-6 mb-2">Optional LinkedIn Sharing</h3>
            <p>
              If you connect a LinkedIn account and choose to publish feedback to
              LinkedIn, the feedback content and your LinkedIn access token are
              transmitted to the LinkedIn API. This transmission is governed by
              LinkedIn's own privacy terms. No LinkedIn credentials are stored
              permanently by the Platform; only the access token required for
              publishing is retained in encrypted form.
            </p>

            <h3 className="font-medium mt-6 mb-2">Duration of Storage</h3>
            <p>
              Feedback data is retained for as long as both sender and recipient
              accounts remain active. Upon account deletion, feedback associated
              exclusively with the deleted account will be removed or anonymised.
            </p>
          </section>

          {/* Rights */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Rights of Data Subjects</h2>
            <p className="mb-4">
              You have various rights with respect to the processing of your
              personal data. These are set out below with references to the
              applicable GDPR articles.
            </p>

            <h3 className="font-medium mt-4 mb-2">Right of Access (Art. 15 GDPR)</h3>
            <p>
              You may request confirmation of whether we process personal data
              about you, and if so, obtain access to that data and supplementary
              information about the processing.
            </p>

            <h3 className="font-medium mt-6 mb-2">Right to Rectification (Art. 16 GDPR)</h3>
            <p>
              You have the right to request the correction and/or completion of
              your personal data if it is inaccurate or incomplete. The
              responsible party must carry out the rectification without undue
              delay.
            </p>

            <h3 className="font-medium mt-6 mb-2">
              Right to Erasure / "Right to be Forgotten" / Right to Restriction
              of Processing (Art. 17, 18 GDPR)
            </h3>
            <p>
              You have the right to request the immediate erasure of your
              personal data. Alternatively, you may request restriction of
              processing. The conditions for deletion and restriction are set
              out in the GDPR articles referenced above.
            </p>

            <h3 className="font-medium mt-6 mb-2">Right to Notification (Art. 19 GDPR)</h3>
            <p>
              If you have asserted your right to rectification, erasure, or
              restriction of processing, the responsible party is obliged to
              notify all recipients to whom the data have been disclosed, unless
              this proves impossible or involves disproportionate effort. You
              have the right to be informed of those recipients.
            </p>

            <h3 className="font-medium mt-6 mb-2">Right to Data Portability (Art. 20 GDPR)</h3>
            <p>
              You have the right to receive your personal data in a structured,
              commonly used, and machine-readable format. This right is limited to
              the technical readability of the data and does not require the
              responsible party to convert data from a proprietary format into a
              standardised one.
            </p>

            <h3 className="font-medium mt-6 mb-2">Right to Object (Art. 21 GDPR)</h3>
            <p>
              You have the right to object to processing that is based solely on a
              balancing of interests by the responsible party (see Art. 6(1)(f)
              GDPR).
            </p>

            <h3 className="font-medium mt-6 mb-2">
              Right to Withdraw Consent (Art. 7(3) GDPR)
            </h3>
            <p>
              You have the right to withdraw your data protection consent at any
              time. Withdrawal does not affect the lawfulness of processing
              carried out on the basis of consent prior to its withdrawal.
            </p>

            <h3 className="font-medium mt-6 mb-2">
              Right to Lodge a Complaint with a Supervisory Authority (Art. 77
              GDPR)
            </h3>
            <p>
              Without prejudice to any other administrative or judicial remedy,
              you have the right to lodge a complaint with a supervisory
              authority — in particular in the Member State of your habitual
              residence, place of work, or place of the alleged infringement —
              if you consider that the processing of your personal data violates
              the GDPR.
            </p>
            <p className="mt-2">
              The supervisory authority responsible for HTWG Konstanz is:
            </p>
            <div className="mt-3 rounded-lg border bg-muted/40 px-5 py-4 font-mono text-xs leading-6">
              Der Landesbeauftragte für den Datenschutz und die
              Informationsfreiheit Baden-Württemberg
              <br />
              Königstraße 10a
              <br />
              70173 Stuttgart, Germany
              <br />
              <a
                href="https://www.baden-wuerttemberg.datenschutz.de"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                www.baden-wuerttemberg.datenschutz.de
              </a>
            </div>
          </section>

          {/* Exercising rights */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Exercising Your Rights</h2>
            <p>
              To exercise any of the rights listed above, please contact us at{" "}
              <a
                href="mailto:<datenschutz-email>"
                className="underline hover:text-primary"
              >
                &lt;datenschutz-email&gt;
              </a>
              . We will respond to your request within one month of receipt (Art.
              12 GDPR).
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
