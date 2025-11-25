import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AdvancedFilters {
  final List<String> genres;
  final String language;
  final String dateFrom;
  final String dateTo;
  final List<String> formats;
  final String sortBy;
  final String sortOrder; // 'asc' or 'desc'

  const AdvancedFilters({
    this.genres = const [],
    this.language = '',
    this.dateFrom = '',
    this.dateTo = '',
    this.formats = const [],
    this.sortBy = 'uploadedAt',
    this.sortOrder = 'desc',
  });

  AdvancedFilters copyWith({
    List<String>? genres,
    String? language,
    String? dateFrom,
    String? dateTo,
    List<String>? formats,
    String? sortBy,
    String? sortOrder,
  }) {
    return AdvancedFilters(
      genres: genres ?? this.genres,
      language: language ?? this.language,
      dateFrom: dateFrom ?? this.dateFrom,
      dateTo: dateTo ?? this.dateTo,
      formats: formats ?? this.formats,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  bool get hasActiveFilters {
    return genres.isNotEmpty ||
        language.isNotEmpty ||
        dateFrom.isNotEmpty ||
        dateTo.isNotEmpty ||
        formats.isNotEmpty;
  }

  int get activeFiltersCount {
    int count = 0;
    if (genres.isNotEmpty) count++;
    if (language.isNotEmpty) count++;
    if (dateFrom.isNotEmpty || dateTo.isNotEmpty) count++;
    if (formats.isNotEmpty) count++;
    return count;
  }

  void reset() {}
}

const List<String> genres = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Biography',
  'History',
  'Science',
  'Technology',
  'Self-Help',
  'Business',
  'Philosophy',
  'Poetry',
  'Drama',
  'Other',
];

const List<Map<String, String>> languages = [
  {'value': '', 'label': 'All Languages'},
  {'value': 'English', 'label': 'English'},
  {'value': 'Bangla', 'label': 'Bangla'},
  {'value': 'Hindi', 'label': 'Hindi'},
  {'value': 'Spanish', 'label': 'Spanish'},
  {'value': 'French', 'label': 'French'},
  {'value': 'German', 'label': 'German'},
  {'value': 'Italian', 'label': 'Italian'},
  {'value': 'Portuguese', 'label': 'Portuguese'},
  {'value': 'Russian', 'label': 'Russian'},
  {'value': 'Japanese', 'label': 'Japanese'},
  {'value': 'Chinese', 'label': 'Chinese'},
  {'value': 'Korean', 'label': 'Korean'},
];

const List<String> formats = ['PDF', 'EPUB', 'TXT'];

const List<Map<String, String>> sortOptions = [
  {'value': 'uploadedAt', 'label': 'Upload Date'},
  {'value': 'lastReadAt', 'label': 'Last Read'},
  {'value': 'title', 'label': 'Title'},
  {'value': 'author', 'label': 'Author'},
  {'value': 'progress', 'label': 'Reading Progress'},
];

class AdvancedFiltersBottomSheet extends StatefulWidget {
  final AdvancedFilters initialFilters;
  final Function(AdvancedFilters) onApply;

  const AdvancedFiltersBottomSheet({
    super.key,
    required this.initialFilters,
    required this.onApply,
  });

  @override
  State<AdvancedFiltersBottomSheet> createState() =>
      _AdvancedFiltersBottomSheetState();
}

class _AdvancedFiltersBottomSheetState
    extends State<AdvancedFiltersBottomSheet> {
  late AdvancedFilters _filters;

  @override
  void initState() {
    super.initState();
    _filters = widget.initialFilters;
  }

  void _toggleGenre(String genre) {
    setState(() {
      final newGenres = List<String>.from(_filters.genres);
      if (newGenres.contains(genre)) {
        newGenres.remove(genre);
      } else {
        newGenres.add(genre);
      }
      _filters = _filters.copyWith(genres: newGenres);
    });
  }

  void _toggleFormat(String format) {
    setState(() {
      final newFormats = List<String>.from(_filters.formats);
      if (newFormats.contains(format)) {
        newFormats.remove(format);
      } else {
        newFormats.add(format);
      }
      _filters = _filters.copyWith(formats: newFormats);
    });
  }

  void _reset() {
    setState(() {
      _filters = const AdvancedFilters();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              //color: Theme.of(context).cardColor,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              /* boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ], */
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.tune_rounded,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Advanced Filters',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.titleLarge?.color,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Refine your library search with advanced filtering options',
                  style: GoogleFonts.inter(
                    color: Theme.of(context).textTheme.bodyMedium?.color,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),

          // Filters Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Genres Section
                  _buildSectionHeader(
                    context,
                    'Genres',
                    Icons.local_offer_rounded,
                    showClear: _filters.genres.isNotEmpty,
                    onClear: () => setState(() {
                      _filters = _filters.copyWith(genres: []);
                    }),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: genres.map((genre) {
                      final isSelected = _filters.genres.contains(genre);
                      return FilterChip(
                        label: Text(genre),
                        selected: isSelected,
                        onSelected: (_) => _toggleGenre(genre),
                        backgroundColor: Theme.of(context).cardColor,
                        selectedColor: Theme.of(
                          context,
                        ).colorScheme.primaryContainer,
                        checkmarkColor: Theme.of(context).colorScheme.primary,
                        labelStyle: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.w500,
                          color: isSelected
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).textTheme.bodyMedium?.color,
                        ),
                      );
                    }).toList(),
                  ),
                  if (_filters.genres.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        '${_filters.genres.length} genre${_filters.genres.length > 1 ? 's' : ''} selected',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Theme.of(context).textTheme.bodySmall?.color,
                        ),
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Language Section
                  _buildSectionHeader(
                    context,
                    'Language',
                    Icons.language_rounded,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _filters.language.isEmpty
                            ? ''
                            : _filters.language,
                        isExpanded: true,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        borderRadius: BorderRadius.circular(12),
                        items: languages.map((lang) {
                          return DropdownMenuItem<String>(
                            value: lang['value']!,
                            child: Text(
                              lang['label']!,
                              style: GoogleFonts.inter(fontSize: 14),
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _filters = _filters.copyWith(language: value ?? '');
                          });
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Date Range Section
                  _buildSectionHeader(
                    context,
                    'Upload Date Range',
                    Icons.calendar_today_rounded,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildDateField(
                          context,
                          'From',
                          _filters.dateFrom,
                          (value) => setState(() {
                            _filters = _filters.copyWith(dateFrom: value);
                          }),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildDateField(
                          context,
                          'To',
                          _filters.dateTo,
                          (value) => setState(() {
                            _filters = _filters.copyWith(dateTo: value);
                          }),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Format Section
                  _buildSectionHeader(
                    context,
                    'Format',
                    Icons.description_rounded,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: formats.map((format) {
                      final isSelected = _filters.formats.contains(format);
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: OutlinedButton(
                            onPressed: () => _toggleFormat(format),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: isSelected
                                  ? Theme.of(
                                      context,
                                    ).colorScheme.primaryContainer
                                  : Theme.of(context).cardColor,
                              foregroundColor: isSelected
                                  ? Theme.of(context).colorScheme.primary
                                  : Theme.of(
                                      context,
                                    ).textTheme.bodyMedium?.color,
                              side: BorderSide(
                                color: isSelected
                                    ? Theme.of(context).colorScheme.primary
                                    : Theme.of(context).dividerColor,
                                width: isSelected ? 2 : 1,
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: Text(
                              format,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  if (_filters.formats.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        '${_filters.formats.length} format${_filters.formats.length > 1 ? 's' : ''} selected',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Theme.of(context).textTheme.bodySmall?.color,
                        ),
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Sort Section
                  _buildSectionHeader(context, 'Sort By', Icons.sort_rounded),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _filters.sortBy,
                        isExpanded: true,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        borderRadius: BorderRadius.circular(12),
                        items: sortOptions.map((option) {
                          return DropdownMenuItem<String>(
                            value: option['value']!,
                            child: Text(
                              option['label']!,
                              style: GoogleFonts.inter(fontSize: 14),
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() {
                            _filters = _filters.copyWith(
                              sortBy: value ?? 'uploadedAt',
                            );
                          });
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () {
                      setState(() {
                        _filters = _filters.copyWith(
                          sortOrder: _filters.sortOrder == 'asc'
                              ? 'desc'
                              : 'asc',
                        );
                      });
                    },
                    icon: Icon(
                      _filters.sortOrder == 'asc'
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 18,
                    ),
                    label: Text(
                      _filters.sortOrder == 'asc' ? 'Ascending' : 'Descending',
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                      minimumSize: const Size(double.infinity, 48),
                    ),
                  ),

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // Footer Buttons
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _reset,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      'Reset All',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onApply(_filters);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      'Apply Filters',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context,
    String title,
    IconData icon, {
    bool showClear = false,
    VoidCallback? onClear,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).textTheme.titleMedium?.color,
          ),
        ),
        if (showClear) ...[
          const Spacer(),
          TextButton(
            onPressed: onClear,
            child: Text(
              'Clear All',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDateField(
    BuildContext context,
    String label,
    String value,
    Function(String) onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: Theme.of(context).textTheme.bodySmall?.color,
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: value.isNotEmpty
                  ? DateTime.parse(value)
                  : DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime.now(),
            );
            if (date != null) {
              onChanged(date.toIso8601String().split('T')[0]);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: Theme.of(context).textTheme.bodySmall?.color,
                ),
                const SizedBox(width: 8),
                Text(
                  value.isEmpty ? 'Select date' : value,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: value.isEmpty
                        ? Theme.of(context).textTheme.bodySmall?.color
                        : Theme.of(context).textTheme.bodyMedium?.color,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
