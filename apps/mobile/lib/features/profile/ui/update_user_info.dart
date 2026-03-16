import 'package:flutter/material.dart';
import 'package:flutter_poc/ui/widgets/button.dart';
import 'package:flutter_poc/core/svg/app_svg.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class UpdateUserInfo extends StatefulWidget {
  const UpdateUserInfo({
    super.key,
    required this.title,
    this.currentValueLabel,
    this.currentValue,
    required this.inputHint,
    this.secondInputHint, // Ajout du hint pour le second champ
    required this.buttonText,
    this.isPassword = false,
    this.onSave,
    this.onSaveDual, // Ajout d'une fonction qui retourne deux Strings
  }) : assert(onSave != null || onSaveDual != null, 'Vous devez fournir onSave ou onSaveDual');

  final String title;
  final String? currentValueLabel;
  final String? currentValue;
  final String inputHint;
  final String? secondInputHint;
  final String buttonText;
  final bool isPassword;
  final Future<void> Function(String)? onSave;
  final Future<void> Function(String, String)? onSaveDual;

  @override
  State<UpdateUserInfo> createState() => _UpdateUserInfoState();
}

class _UpdateUserInfoState extends State<UpdateUserInfo> {
  late TextEditingController _controller;
  late TextEditingController _secondController; // Second contrôleur
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
    _secondController = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose();
    _secondController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (widget.onSaveDual != null) {
      if (_controller.text.isEmpty || _secondController.text.isEmpty) return;
    } else {
      if (_controller.text.isEmpty) return;
    }

    setState(() => _isLoading = true);
    try {
      if (widget.onSaveDual != null) {
        await widget.onSaveDual!(_controller.text, _secondController.text);
      } else if (widget.onSave != null) {
        await widget.onSave!(_controller.text);
      }
      if (mounted) Navigator.pop(context);
    } on Exception catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur lors de la sauvegarde: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
        child: Column(
          children: [
            Row(
              children: [
                GestureDetector(onTap: () => Navigator.pop(context), child: SvgPicture.string(AppSvg.arrowLeft)),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    widget.title,
                    style: AppTypography.subheadingLarge.copyWith(color: AppColors.primaryLight),
                  ),
                ),
              ],
            ),

            const Spacer(),

            if (widget.currentValueLabel != null) ...[
              Text(
                widget.currentValueLabel!,
                style: AppTypography.bodyMedium.copyWith(color: AppColors.primaryLight),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
            ],

            if (widget.currentValue != null) ...[
              Text(
                widget.currentValue!,
                style: AppTypography.subheadingMedium.copyWith(color: AppColors.primaryLight),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
            ],

            ShadInput(controller: _controller, placeholder: Text(widget.inputHint), obscureText: widget.isPassword),

            if (widget.secondInputHint != null) ...[
              const SizedBox(height: 16),
              ShadInput(
                controller: _secondController,
                placeholder: Text(widget.secondInputHint!),
                obscureText: widget.isPassword,
              ),
            ],

            const Spacer(),

            Center(
              child: _isLoading
                  ? const CircularProgressIndicator()
                  : SmallButton(text: widget.buttonText, onPressed: _handleSave, color: AppColors.primaryLight),
            ),
          ],
        ),
      ),
    ),
  );
}
