import 'package:flutter/material.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';
import 'package:flutter_svg/flutter_svg.dart';

class SmallButton extends StatelessWidget {
  const SmallButton({super.key, required this.text, required this.onPressed, required this.color});

  final String text;
  final VoidCallback onPressed;
  final Color color;

  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: onPressed,
    style: TextButton.styleFrom(
      backgroundColor: color,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
    ),
    child: Text(
      text,
      style: AppTypography.bodySmall.copyWith(color: AppColors.textLight),
    ),
  );
}

class SmallButtonWithIcon extends StatelessWidget {
  const SmallButtonWithIcon({
    super.key,
    required this.text,
    required this.svgIcon,
    required this.onPressed,
  });

  final String text;
  final String svgIcon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: onPressed,
    style: TextButton.styleFrom(
      backgroundColor: AppColors.primaryLight,
      padding: const EdgeInsets.fromLTRB(12, 0, 16, 0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SvgPicture.string(svgIcon, width: 15, height: 15),
        const SizedBox(width: 8),
        Text(
          text,
          style: AppTypography.bodySmall.copyWith(color: AppColors.textLight),
        ),
      ],
    ),
  );
}
