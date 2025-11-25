import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Light Theme Colors
  static const Color _lightPrimary = Color(0xFF6366F1); // Indigo 500
  static const Color _lightSecondary = Color(0xFF8B5CF6); // Violet 500
  static const Color _lightBackground = Color(0xFFF8FAFC); // Slate 50
  static const Color _lightSurface = Color(0xFFFFFFFF); // White
  static const Color _lightError = Color(0xFFEF4444); // Red 500
  static const Color _lightOnPrimary = Colors.white;
  static const Color _lightOnBackground = Color(0xFF0F172A); // Slate 900
  static const Color _lightOnSurface = Color(0xFF1E293B); // Slate 800

  // Dark Theme Colors
  static const Color _darkPrimary = Color(0xFF818CF8); // Indigo 400
  static const Color _darkSecondary = Color(0xFFA78BFA); // Violet 400
  static const Color _darkBackground = Color(0xFF0F172A); // Slate 900
  static const Color _darkSurface = Color(0xFF1E293B); // Slate 800
  static const Color _darkError = Color(0xFFF87171); // Red 400
  static const Color _darkOnPrimary = Color(0xFF1E1B4B); // Indigo 950
  static const Color _darkOnBackground = Color(0xFFF1F5F9); // Slate 100
  static const Color _darkOnSurface = Color(0xFFE2E8F0); // Slate 200

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: _lightPrimary,
        onPrimary: _lightOnPrimary,
        secondary: _lightSecondary,
        onSecondary: Colors.white,
        error: _lightError,
        onError: Colors.white,
        surface: _lightSurface,
        onSurface: _lightOnSurface,
        surfaceContainerHighest: Color(
          0xFFF1F5F9,
        ), // Slate 100 for cards/containers
      ),
      scaffoldBackgroundColor: _lightBackground,
      textTheme: GoogleFonts.poppinsTextTheme(ThemeData.light().textTheme)
          .copyWith(
            displayLarge: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.bold,
            ),
            displayMedium: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.bold,
            ),
            displaySmall: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.w600,
            ),
            headlineLarge: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.bold,
            ),
            headlineMedium: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.w600,
            ),
            headlineSmall: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.w600,
            ),
            titleLarge: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.w600,
            ),
            titleMedium: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.w500,
            ),
            titleSmall: GoogleFonts.poppins(
              color: _lightOnBackground,
              fontWeight: FontWeight.w500,
            ),
          ),
      appBarTheme: AppBarTheme(
        backgroundColor: _lightBackground,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: _lightOnBackground),
        titleTextStyle: GoogleFonts.poppins(
          color: _lightOnBackground,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: _lightSurface,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
        ),
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _lightPrimary,
          foregroundColor: _lightOnPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _lightSurface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _lightPrimary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _lightError),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: Colors.grey.withValues(alpha: 0.1),
        thickness: 1,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme(
        brightness: Brightness.dark,
        primary: _darkPrimary,
        onPrimary: _darkOnPrimary,
        secondary: _darkSecondary,
        onSecondary: _darkOnPrimary,
        error: _darkError,
        onError: _darkOnPrimary,
        surface: _darkSurface,
        onSurface: _darkOnSurface,
        surfaceContainerHighest: Color(
          0xFF334155,
        ), // Slate 700 for cards/containers
      ),
      scaffoldBackgroundColor: _darkBackground,
      textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme)
          .copyWith(
            displayLarge: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.bold,
            ),
            displayMedium: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.bold,
            ),
            displaySmall: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.w600,
            ),
            headlineLarge: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.bold,
            ),
            headlineMedium: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.w600,
            ),
            headlineSmall: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.w600,
            ),
            titleLarge: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.w600,
            ),
            titleMedium: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.w500,
            ),
            titleSmall: GoogleFonts.poppins(
              color: _darkOnBackground,
              fontWeight: FontWeight.w500,
            ),
            bodyLarge: GoogleFonts.poppins(color: _darkOnSurface),
            bodyMedium: GoogleFonts.poppins(color: _darkOnSurface),
            bodySmall: GoogleFonts.poppins(
              color: _darkOnSurface.withValues(alpha: 0.7),
            ),
          ),
      appBarTheme: AppBarTheme(
        backgroundColor: _darkBackground,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: _darkOnBackground),
        titleTextStyle: GoogleFonts.poppins(
          color: _darkOnBackground,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: _darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
        ),
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _darkPrimary,
          foregroundColor: _darkOnPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _darkSurface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _darkPrimary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _darkError),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: Colors.white.withValues(alpha: 0.1),
        thickness: 1,
      ),
      iconTheme: const IconThemeData(color: _darkOnSurface),
    );
  }
}
