import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

// Define the ThemeModeExtension to easily save/load from string
extension ThemeModeExtension on ThemeMode {
  String toStringValue() {
    return toString().split('.').last;
  }

  static ThemeMode fromStringValue(String value) {
    return ThemeMode.values.firstWhere(
      (e) => e.toString().split('.').last == value,
      orElse: () => ThemeMode.system,
    );
  }
}

class ThemeNotifier extends Notifier<ThemeMode> {
  static const String _boxName = 'settings';
  static const String _key = 'theme_mode';

  @override
  ThemeMode build() {
    // Load theme asynchronously
    _loadTheme();
    return ThemeMode.system;
  }

  Future<void> _loadTheme() async {
    final box = await Hive.openBox(_boxName);
    final savedTheme = box.get(_key);
    if (savedTheme != null && savedTheme is String) {
      state = ThemeModeExtension.fromStringValue(savedTheme);
    }
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    final box = await Hive.openBox(_boxName);
    await box.put(_key, mode.toStringValue());
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(() {
  return ThemeNotifier();
});
