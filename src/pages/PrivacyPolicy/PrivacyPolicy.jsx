import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="page-content privacy-page">
      <div className="privacy-container">
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-date">Last updated: August 2026</p>

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to WikWik. We are committed to protecting your personal information and your right to privacy. 
            If you have any questions or concerns about this privacy notice, or our practices with regards to your 
            personal information, please contact us.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when you register on the App:</p>
          <ul>
            <li><strong>Personal Info:</strong> Name, phone number, email address, and country.</li>
            <li><strong>Location Data:</strong> We may request access or permission to track location-based information from your mobile device to provide location-based services (like finding nearby jobs).</li>
            <li><strong>Camera & Storage:</strong> We may request access to your camera and storage for profile pictures or job-related media.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect or receive:</p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To post and connect users for short-term work requirements.</li>
            <li>To enable user-to-user communications (chats).</li>
            <li>To enforce our terms, conditions, and policies.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Your public profile and job postings are visible to other registered users of the platform.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you may email us or contact us through the app's support section.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
