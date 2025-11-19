import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
      appBar: AppBar(title: const Text('Analytics')),
      drawer: const AppDrawer(),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Reading Activity',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  // Time Range Selector
                  SegmentedButton<TimeRange>(
                    segments: const [
                      ButtonSegment(
                        value: TimeRange.day,
                        label: Text('Day'),
                        icon: Icon(Icons.today, size: 16),
                      ),
                      ButtonSegment(
                        value: TimeRange.week,
                        label: Text('Week'),
                        icon: Icon(Icons.calendar_view_week, size: 16),
                      ),
                      ButtonSegment(
                        value: TimeRange.month,
                        label: Text('Month'),
                        icon: Icon(Icons.calendar_month, size: 16),
                      ),
                      ButtonSegment(
                        value: TimeRange.year,
                        label: Text('Year'),
                        icon: Icon(Icons.calendar_today, size: 16),
                      ),
                    ],
                    selected: {state.timeRange},
                    onSelectionChanged: (Set<TimeRange> newSelection) {
                      notifier.setTimeRange(newSelection.first);
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    height: 200,
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY: _getMaxY(state),
                        barTouchData: BarTouchData(enabled: false),
                        titlesData: FlTitlesData(
                          show: true,
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                return _getBottomTitle(value, state.timeRange);
                              },
                            ),
                          ),
                          leftTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                        ),
                        gridData: const FlGridData(show: false),
                        borderData: FlBorderData(show: false),
                        barGroups: state.sessions.asMap().entries.map((entry) {
                          return BarChartGroupData(
                            x: entry.key,
                            barRods: [
                              BarChartRodData(
                                toY: entry.value.pagesRead.toDouble(),
                                color: Colors.blue,
                                width: 16,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Statistics',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildStatCard(
                    'Total Pages Read',
                    state.sessions
                        .fold<int>(0, (sum, s) => sum + s.pagesRead)
                        .toString(),
                    Icons.menu_book,
                    Colors.blue,
                  ),
                  const SizedBox(height: 8),
                  _buildStatCard(
                    'Total Time Reading',
                    '${(state.sessions.fold<int>(0, (sum, s) => sum + s.durationSeconds) / 3600).toStringAsFixed(1)} hrs',
                    Icons.timer,
                    Colors.orange,
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

  Widget _getBottomTitle(double value, TimeRange timeRange) {
    const style = TextStyle(
      color: Colors.grey,
      fontWeight: FontWeight.bold,
      fontSize: 10,
    );

    String text = '';
    final index = value.toInt();

    switch (timeRange) {
      case TimeRange.day:
        // Show hours (0-23)
        if (index % 4 == 0) {
          text = '${index}h';
        }
        break;
      case TimeRange.week:
        // Show days of week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        if (index < days.length) {
          text = days[index];
        }
        break;
      case TimeRange.month:
        // Show every 5 days
        if (index % 5 == 0) {
          text = '${index + 1}';
        }
        break;
      case TimeRange.year:
        // Show months
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
        if (index < months.length) {
          text = months[index];
        }
        break;
    }

    return SideTitleWidget(
      axisSide: AxisSide.bottom,
      space: 4,
      child: Text(text, style: style),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withAlpha(26),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.grey, fontSize: 14),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
