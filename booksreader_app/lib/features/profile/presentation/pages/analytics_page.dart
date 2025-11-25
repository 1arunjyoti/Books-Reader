import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/repositories/profile_repository.dart';
import '../providers/profile_provider.dart';
import '../widgets/app_drawer.dart';

class AnalyticsPage extends ConsumerWidget {
  const AnalyticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(analyticsProvider);
    final notifier = ref.read(analyticsProvider.notifier);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(
          'Analytics',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => notifier.loadSessions(),
          ),
        ],
        centerTitle: true,
      ),
      drawer: const AppDrawer(),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load analytics',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).textTheme.titleMedium?.color,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.error!,
                      style: GoogleFonts.inter(
                        color: Theme.of(context).textTheme.bodyMedium?.color,
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => notifier.loadSessions(),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Reading Activity',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).textTheme.titleLarge?.color,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Time Range Selector
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(4),
                    child: SegmentedButton<TimeRange>(
                      style: ButtonStyle(
                        backgroundColor: WidgetStateProperty.resolveWith<Color>(
                          (Set<WidgetState> states) {
                            if (states.contains(WidgetState.selected)) {
                              return Theme.of(context).colorScheme.primary;
                            }
                            return Colors.transparent;
                          },
                        ),
                        elevation: WidgetStateProperty.resolveWith<double>((
                          Set<WidgetState> states,
                        ) {
                          if (states.contains(WidgetState.selected)) {
                            return 2;
                          }
                          return 0;
                        }),
                        shape: WidgetStateProperty.all(
                          RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        padding: WidgetStateProperty.all(EdgeInsets.zero),
                        visualDensity: VisualDensity.compact,
                        side: WidgetStateProperty.all(BorderSide.none),
                      ),
                      segments: const [
                        ButtonSegment(
                          value: TimeRange.week,
                          label: Text('7D'),
                          icon: Icon(Icons.calendar_view_week, size: 16),
                        ),
                        ButtonSegment(
                          value: TimeRange.month,
                          label: Text('30D'),
                          icon: Icon(Icons.calendar_month, size: 16),
                        ),
                        ButtonSegment(
                          value: TimeRange.year,
                          label: Text('1Y'),
                          icon: Icon(Icons.calendar_today, size: 16),
                        ),
                        ButtonSegment(
                          value: TimeRange.all,
                          label: Text('All'),
                          icon: Icon(Icons.calendar_today, size: 16),
                        ),
                      ],
                      selected: {state.timeRange},
                      onSelectionChanged: (Set<TimeRange> newSelection) {
                        notifier.setTimeRange(newSelection.first);
                      },
                    ),
                  ),
                  const SizedBox(height: 32),

                  /* Reading Activity Chart */
                  Container(
                    height: 260,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY: _getMaxY(state),
                        barTouchData: BarTouchData(
                          enabled: true,
                          touchTooltipData: BarTouchTooltipData(
                            tooltipBgColor: Colors.blueGrey,
                            getTooltipItem: (group, groupIndex, rod, rodIndex) {
                              return BarTooltipItem(
                                '${rod.toY.toInt()} pages',
                                const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              );
                            },
                          ),
                        ),
                        titlesData: FlTitlesData(
                          show: true,
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                return _getBottomTitle(value, state);
                              },
                              reservedSize: 30,
                            ),
                          ),
                          leftTitles: const AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 30,
                            ),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                        ),
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          drawHorizontalLine: true,
                          horizontalInterval: _getMaxY(state) / 4,
                          getDrawingHorizontalLine: (value) {
                            return FlLine(
                              color: Theme.of(context).dividerColor,
                              strokeWidth: 1,
                              dashArray: const [6, 6],
                            );
                          },
                        ),
                        borderData: FlBorderData(show: false),
                        barGroups: state.sessions.asMap().entries.map((entry) {
                          return BarChartGroupData(
                            x: entry.key,
                            barRods: [
                              BarChartRodData(
                                toY: entry.value.pagesRead.toDouble(),
                                color: Theme.of(context).colorScheme.primary,
                                width: 12,
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(4),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  /* Statistics */
                  Text(
                    'Statistics',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).textTheme.titleLarge?.color,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // First Row - Pages and Time
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          context,
                          'Pages Read',
                          state.totalPagesRead.toString(),
                          Icons.menu_book_rounded,
                          Colors.blue,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildStatCard(
                          context,
                          'Time Reading',
                          '${(state.totalReadingTime / 3600).toStringAsFixed(1)}h',
                          Icons.timer_rounded,
                          Colors.orange,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Second Row - Books and Streak
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          context,
                          'Books Finished',
                          state.booksFinished.toString(),
                          Icons.check_circle_rounded,
                          Colors.green,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildStatCard(
                          context,
                          'Current Streak',
                          '${state.currentStreak} days',
                          Icons.local_fire_department_rounded,
                          Colors.red,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Third Row - Reading Speed and Sessions
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          context,
                          'Reading Speed',
                          '${state.readingSpeed.toStringAsFixed(1)} p/h',
                          Icons.speed_rounded,
                          Colors.purple,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildStatCard(
                          context,
                          'Sessions',
                          state.sessionsCount.toString(),
                          Icons.library_books_rounded,
                          Colors.teal,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  double _getMaxY(AnalyticsState state) {
    if (state.sessions.isEmpty) return 100;
    final maxPages = state.sessions
        .map((s) => s.pagesRead)
        .reduce((a, b) => a > b ? a : b);
    return (maxPages * 1.2).ceilToDouble();
  }

  Widget _getBottomTitle(double value, AnalyticsState state) {
    // Note: BuildContext is not available here, so we'll keep the style static
    final style = GoogleFonts.inter(
      color: Colors.grey[600],
      fontWeight: FontWeight.w500,
      fontSize: 10,
    );

    String text = '';
    final index = value.toInt();

    if (index >= 0 && index < state.sessions.length) {
      final session = state.sessions[index];

      switch (state.timeRange) {
        case TimeRange.week:
          // Format: Mon
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          if (session.date.weekday >= 1 && session.date.weekday <= 7) {
            text = days[session.date.weekday - 1];
          }
          break;
        case TimeRange.month:
          // Format: 1, 5, 10...
          if (index % 5 == 0) {
            text = '${session.date.day}';
          }
          break;
        case TimeRange.year:
          // Format: Jan
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          if (session.date.month >= 1 && session.date.month <= 12) {
            text = months[session.date.month - 1];
          }
          break;
        case TimeRange.all:
          // Format: 1, 5, 10...
          if (index % 5 == 0) {
            text = '${session.date.day}';
          }
          break;
      }
    }

    return SideTitleWidget(
      axisSide: AxisSide.bottom,
      space: 8,
      child: Text(text, style: style),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).textTheme.headlineSmall?.color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.inter(
              color: Theme.of(context).textTheme.bodySmall?.color,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
