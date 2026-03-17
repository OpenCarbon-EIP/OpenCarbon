import 'package:flutter/material.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/core/svg/app_svg.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AppNavbar extends StatelessWidget {
  const AppNavbar({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  }) : assert(
         selectedIndex >= 0 && selectedIndex < 4,
         'selectedIndex must be between 0 and 3',
       );

  final int selectedIndex;
  final void Function(int) onItemSelected;

  Alignment _getAlignmentForIndex(int index) {
    switch (index) {
      case 0:
        return Alignment.centerLeft;
      case 1:
        return const Alignment(-0.33, 0.0);
      case 2:
        return const Alignment(0.33, 0.0);
      case 3:
        return Alignment.centerRight;
      default:
        return Alignment.centerLeft;
    }
  }

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 20),
    child: Center(
      heightFactor: 1,
      child: Container(
        width: 347,
        height: 71,
        padding: const EdgeInsets.symmetric(horizontal: 2.5),
        decoration: BoxDecoration(
          color: AppColors.backgroundLight,
          borderRadius: BorderRadius.circular(22.5),
          border: Border.all(color: AppColors.borderInput),
        ),
        child: Stack(
          children: [
            AnimatedAlign(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              alignment: _getAlignmentForIndex(selectedIndex),
              child: Container(
                width: 85,
                height: 65,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildNavItem(
                  selectedIndex == 0
                      ? AppSvg.svgHomeFilled
                      : AppSvg.svgHomeStroke,
                  0,
                ),
                _buildNavItem(
                  selectedIndex == 1
                      ? AppSvg.svgBriefcaseFilled
                      : AppSvg.svgBriefcaseStroke,
                  1,
                ),
                _buildNavItem(
                  selectedIndex == 2
                      ? AppSvg.svgMessageFilled
                      : AppSvg.svgMessageStroke,
                  2,
                ),
                _buildNavItem(
                  selectedIndex == 3
                      ? AppSvg.svgProfileFilled
                      : AppSvg.svgProfileStroke,
                  3,
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );

  Widget _buildNavItem(String svgData, int index) {
    final bool isCurrentSelected = selectedIndex == index;

    return GestureDetector(
      onTap: () => onItemSelected(index),
      child: Container(
        width: 85,
        height: 65,
        color: Colors.transparent,
        child: Center(
          child: SvgPicture.string(
            svgData,
            colorFilter: ColorFilter.mode(
              isCurrentSelected ? AppColors.textLight : AppColors.primaryLight,
              BlendMode.srcIn,
            ),
          ),
        ),
      ),
    );
  }
}
