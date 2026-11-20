import type { Metadata } from 'next';
import CommunityAdmin from '@/components/community/community-admin';
import styles from '@/components/community/community.module.css';
export const metadata: Metadata = {
  title: 'Community administration',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://proofwelllife.com/community-admin' },
};
export default function CommunityAdminPage() { return <><CommunityAdmin/><aside className={styles.admin} aria-label="Moderation operations guide"><details><summary>Moderation, privacy and export checklist</summary>
  <p>This is an operational guide, not access to private records. Signing in still requires CAPTCHA and administrator authorization.</p>
  <ul><li>Approve relevant, civil first-person discussion. Do not publish contact details, medical records, spam, individualized medical advice or unsupported claims presented as facts.</li>
    <li>Approval is not scientific verification. Use hide while reviewing a concern; approved comments have no automatic age-based deletion. Pending and explicitly classified spam comments expire within 90 days of submission. Hiding an approved comment does not classify it as spam or authorize automatic deletion; delete confirmed spam rather than retaining it indefinitely.</li>
    <li>For removal requests, verify ownership proportionately. A public comment reference alone is not proof. Never request passwords or session tokens. Delete the correct record after verification and check restricted exports as well.</li>
    <li>Export only necessary data to approved, access-controlled storage. Do not email CSV files or upload them to Google Analytics. Do not keep exports beyond the source data’s retention limit.</li>
    <li>Raw votes, helpfulness responses and suggestions expire within 90 days; poll totals may include repeat responses after expiry. Confirm the maintenance job, alerts and provider log limits before launch.</li>
  </ul><p><a href="/privacy-policy">Privacy Policy draft</a> · <a href="/terms">Terms draft</a> · <a href="mailto:proofwelllife@gmail.com">ProofWell Editorial Team</a></p>
  <p>Moderator roster, service coverage, request deadlines, backup handling and policy approval remain owner acceptance items. Do not enable production through this guide.</p>
</details></aside></>; }
