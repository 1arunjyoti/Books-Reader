import 'package:flutter/material.dart';
import 'package:clerk_flutter/clerk_flutter.dart';

class AuthPage extends StatelessWidget {
  const AuthPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [const ClerkAuthentication()],
            ),
          ),
        ),
      ),
    );
  }
}
