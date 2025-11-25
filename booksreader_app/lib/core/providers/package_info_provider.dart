import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

final packageInfoProvider = FutureProvider<PackageInfo>((ref) async {
  if (kDebugMode) {
    print('PackageInfoProvider: Fetching package info...');
  }
  try {
    final info = await PackageInfo.fromPlatform();
    if (kDebugMode) {
      print('PackageInfoProvider: Fetched info: ${info.version}');
    }
    return info;
  } catch (e) {
    if (kDebugMode) {
      print('PackageInfoProvider: Error fetching info: $e');
    }
    // Return a fallback PackageInfo to prevent UI errors
    return PackageInfo(
      appName: 'BooksReader',
      packageName: 'com.example.booksreader',
      version: '1.0.0',
      buildNumber: '1',
    );
  }
});
