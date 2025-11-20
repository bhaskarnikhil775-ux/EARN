

export const APP_CONSTANTS = {
  DAILY_EARN_LIMIT: 300,
  DAILY_SCRATCH_LIMIT: 10,
  DAILY_SPIN_LIMIT: 10,
  REWARD_PER_TASK: 10,
  SIGNUP_BONUS: 50,
  REFERRAL_BONUS: 200,
  AD_DURATION_MS: 3000, // 3 seconds before close
  COOLDOWN_MS: 10000, // 10 seconds between tasks
  TELEGRAM_LINK: 'http://t.me/MASTEREARNNIK',
  EMAIL_SUPPORT: 'support@scratchearn.in',
  REFERRAL_BASE_LINK: 'http://scratchearn.in/refer?id=',
};

export const WITHDRAWAL_TYPES = {
  UPI: 'UPI',
  GIFT_CARD: 'GIFT_CARD'
};

export const LOGO_URLS = {
  UPI: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/512px-UPI-Logo-vector.svg.png',
  PLAY: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Google_Play_2022_icon.svg/512px-Google_Play_2022_icon.svg.png'
};

export const WITHDRAWAL_OPTIONS = [
  // UPI Options
  { 
    id: 'upi_15',
    type: WITHDRAWAL_TYPES.UPI,
    coins: 900, 
    amount: 15,
    label: '₹15 UPI Cash',
    icon: LOGO_URLS.UPI
  },
  { 
    id: 'upi_50',
    type: WITHDRAWAL_TYPES.UPI,
    coins: 4500, 
    amount: 50,
    label: '₹50 UPI Cash',
    icon: LOGO_URLS.UPI
  },
  { 
    id: 'upi_100',
    type: WITHDRAWAL_TYPES.UPI,
    coins: 9000, 
    amount: 100,
    label: '₹100 UPI Cash',
    icon: LOGO_URLS.UPI
  },
  // Gift Card Options
  { 
    id: 'play_15',
    type: WITHDRAWAL_TYPES.GIFT_CARD,
    coins: 1500, 
    amount: 15,
    label: '₹15 Google Play Code',
    icon: LOGO_URLS.PLAY
  },
  { 
    id: 'play_50',
    type: WITHDRAWAL_TYPES.GIFT_CARD,
    coins: 7500, 
    amount: 50,
    label: '₹50 Google Play Code',
    icon: LOGO_URLS.PLAY
  },
];

export const LEGAL_CONTENT = {
  TERMS: `
1. **Acceptance of Terms**
By downloading, installing, or using the "Scratch Earn Pro" application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.

2. **Eligibility**
You must be at least 18 years of age to use this application. By using the app, you warrant that you have the right, authority, and capacity to enter into this agreement.

3. **Earning Mechanism**
- Coins are earned by completing tasks such as Scratch Cards, Spin Wheels, and Referrals.
- We reserve the right to change the coin conversion rate at any time without prior notice.
- Coins have no real-world value until they are successfully withdrawn via the methods provided.
- The daily limit for earning is fixed and cannot be bypassed.

4. **User Conduct & Anti-Fraud**
- Creating multiple accounts on a single device is strictly prohibited.
- Using VPNs, bots, emulators, or script automation to earn coins is forbidden.
- Any suspicious activity will result in an immediate and permanent ban of the account and forfeiture of all earnings.
- We track Device IDs to prevent abuse.

5. **Withdrawals & Payments**
- Withdrawals are processed manually to ensure security.
- You must provide a valid "Payment Address" (UPI ID or Email). We are not responsible for errors in the address you provide.
- Payouts typically take 24-48 hours but can take up to 7 business days during holidays or high traffic.
- Minimum withdrawal limits apply as shown in the app wallet.

6. **Account Termination**
We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.

7. **Intellectual Property**
The Service and its original content, features, and functionality are and will remain the exclusive property of Scratch Earn Pro and its licensors.

8. **Limitation of Liability**
In no event shall Scratch Earn Pro, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.

9. **Changes to Terms**
We reserve the right, at our sole discretion, to modify or replace these Terms at any time. It is your responsibility to check these Terms periodically for changes.

10. **Contact Us**
If you have any questions about these Terms, please contact us via the Support section in the app.
  `,
  
  PRIVACY: `
1. **Information Collection**
We collect the following information to provide our service:
- **Device Information:** Device ID, Model, IP Address, and OS version for fraud prevention.
- **Contact Information:** Email address for account management and support.
- **Payment Details:** UPI IDs or Email addresses solely for processing withdrawals.

2. **Use of Information**
- To provide, maintain, and improve our application.
- To detect, prevent, and address technical issues and fraud.
- To process your withdrawal requests accurately.
- To notify you about changes to our service.

3. **Data Retention**
We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations.

4. **Data Security**
We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. However, remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable.

5. **Third-Party Services**
The app may contain links to third-party sites (e.g., Telegram, Ad Networks). If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. We strongly advise you to review the Privacy Policy of these websites.

6. **Cookies and Tracking**
We use cookies and similar tracking technologies to track the activity on our Service and hold certain information to improve your experience.

7. **Children's Privacy**
Our Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we discover a child under 13 has provided us with personal data, we immediately delete this.

8. **Changes to This Privacy Policy**
We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes. These changes are effective immediately after they are posted on this page.

9. **Contact Us**
If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at ${APP_CONSTANTS.EMAIL_SUPPORT}.
  `,
  
  FAQ: `
**Q1: How do I earn coins?**
A: You can earn coins by scratching the daily scratch cards, spinning the lucky wheel, referring friends (200 coins per friend), and claiming daily check-in bonuses.

**Q2: My coins were not added after a task?**
A: Ensure you have a stable internet connection. If the ad was not watched completely or was closed too early, coins might not be credited. Wait a few seconds and check your balance again.

**Q3: How long does withdrawal take?**
A: Withdrawals are usually processed within 24-48 hours. In some cases, it might take up to 7 days due to bank holidays or high server load. Please check your "History" tab for status updates.

**Q4: Why was my account banned?**
A: Accounts are banned if our system detects multiple accounts on the same device, use of VPN/Proxy, or tampering with the app data. These bans are permanent.

**Q5: What is the minimum withdrawal limit?**
A: 
- UPI: ₹15 (900 Coins)
- Google Play: ₹15 (1500 Coins)

**Q6: Can I change my registered email?**
A: No, for security reasons, the email linked to your device cannot be changed once registered. This prevents account theft.

**Q7: Is this app free to use?**
A: Yes, Scratch Earn Pro is 100% free to use. We never ask for money to join or withdraw.

**Q8: What happens if I enter the wrong Payment Address?**
A: We are not responsible for funds sent to the wrong address. Please check your details carefully before confirming the withdrawal.

**Q9: How to contact support?**
A: You can contact us via Telegram using the link in the app or email us at ${APP_CONSTANTS.EMAIL_SUPPORT}.

**Q10: Why are there ads in the app?**
A: Ads help us generate revenue so we can pay our users. Without ads, we cannot provide rewards.
  `
};
