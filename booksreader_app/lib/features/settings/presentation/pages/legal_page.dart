import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LegalPage extends StatelessWidget {
  final String title;
  final String content;

  const LegalPage({super.key, required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          title,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Text(
          content,
          style: GoogleFonts.poppins(
            fontSize: 14,
            height: 1.6,
            color: Theme.of(context).textTheme.bodyMedium?.color,
          ),
        ),
      ),
    );
  }
}

class LegalContent {
  static const String termsOfService = '''
**Terms of Service**

Last updated: November 24, 2025

Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the BooksReader mobile application (the "Service") operated by BooksReader ("us", "we", or "our").

Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.

By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.

**Content**

Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.

**Changes**

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.

**Contact Us**

If you have any questions about these Terms, please contact us.
''';

  static const String privacyPolicy = '''
**Privacy Policy**

Last updated: November 24, 2025

BooksReader ("us", "we", or "our") operates the BooksReader mobile application (the "Service").

This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.

We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.

**Information Collection And Use**

We collect several different types of information for various purposes to provide and improve our Service to you.

**Types of Data Collected**

*   **Personal Data**: While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to: Email address, First name and last name, Cookies and Usage Data.

**Use of Data**

BooksReader uses the collected data for various purposes:
*   To provide and maintain the Service
*   To notify you about changes to our Service
*   To allow you to participate in interactive features of our Service when you choose to do so
*   To provide customer care and support
*   To provide analysis or valuable information so that we can improve the Service
*   To monitor the usage of the Service
*   To detect, prevent and address technical issues

**Contact Us**

If you have any questions about this Privacy Policy, please contact us.
''';
}
