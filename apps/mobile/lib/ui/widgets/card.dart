import 'package:flutter/material.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';
import 'package:intl/intl.dart';

class CustomCard extends StatelessWidget {
  const CustomCard({
    super.key,
    required this.index,
    required this.title,
    required this.deadline,
    required this.description,
    this.companyName,
    required this.onCardSelected,
  });

  final int index;
  final String title;
  final DateTime deadline;
  final String description;
  final String? companyName;
  final ValueChanged<int> onCardSelected;

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => onCardSelected(index),
    child: Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 160),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.backgroundLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderInput),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 24.0,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                    Text(
                      DateFormat('dd/MM/yyyy').format(deadline),
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textDark),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              CircleAvatar(
                radius: 15,
                backgroundColor: AppColors.primaryLight,
                child: Text(
                  companyName != null && companyName!.length >= 2
                      ? companyName!.substring(0, 2).toUpperCase()
                      : companyName?.toUpperCase() ?? 'N/A',
                  style: AppTypography.bodySmall.copyWith(color: AppColors.textLight, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),

          Text(description, style: AppTypography.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ),
    ),
  );
}
