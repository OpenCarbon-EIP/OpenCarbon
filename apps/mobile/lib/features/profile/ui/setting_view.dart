import 'package:flutter/material.dart';
import 'package:flutter_poc/core/auth/auth_provider.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/core/svg/app_svg.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';
import 'package:flutter_poc/features/profile/domain/entity/profile_entity.dart';
import 'package:flutter_poc/features/profile/ui/update_user_info.dart';
import 'package:flutter_poc/features/profile/viewmodels/profile_viewmodel.dart';
import 'package:flutter_poc/ui/widgets/button.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

class SettingView extends StatefulWidget {
  const SettingView({super.key, required this.profile, required this.viewModel});

  final Profile profile;
  final ProfileViewModel viewModel;

  @override
  State<SettingView> createState() => _SettingViewState();
}

class _SettingViewState extends State<SettingView> {
  final _newPasswordController = TextEditingController();

  @override
  void dispose() {
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isCompany = widget.profile.companyData != null;

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 46),
        child: Column(
          spacing: 24,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              spacing: 32,
              children: [
                GestureDetector(
                  onTap: () {
                    Navigator.pop(context);
                  },
                  child: SvgPicture.string(AppSvg.arrowLeft),
                ),
                Center(
                  child: Text('Paramètres', style: AppTypography.subheadingLarge.copyWith(color: AppColors.primaryLight)),
                ),
              ],
            ),
            const Divider(),

            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => isCompany
                        ? UpdateUserInfo(
                      title: 'Mettre à jour l\'entreprise',
                      currentValueLabel: 'Nom de l\'entreprise actuel :',
                      currentValue: widget.profile.companyData!.companyName,
                      inputHint: 'Nouveau nom de l\'entreprise',
                      buttonText: 'Sauvegarder',
                      onSave: (newCompanyName) async {
                        // TODO: Il faudra créer updateCompanyName dans ProfileViewModel et API Service
                        // await widget.viewModel.updateCompanyName(widget.profile.id, newCompanyName);
                        await widget.viewModel.fetchProfile();
                      },
                    )
                        : UpdateUserInfo(
                      title: 'Mettre à jour vos informations',
                      currentValueLabel: 'Votre nom et prénom actuels :',
                      currentValue:
                      '${widget.profile.consultantData!.firstName} ${widget.profile.consultantData!.lastName}',
                      inputHint: 'Nouveau prénom',
                      secondInputHint: 'Nouveau nom',
                      buttonText: 'Sauvegarder',
                      onSaveDual: (newFirstName, newLastName) async {
                        await widget.viewModel.updateFirstAndLastName(
                            widget.profile.id, newFirstName, newLastName);
                        await widget.viewModel.fetchProfile();
                      },
                    ),
                  ),
                );
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isCompany ? 'Modifier le nom de l\'entreprise' : 'Modifier votre nom et prénom',
                    style: AppTypography.subheadingMedium.copyWith(color: AppColors.primaryLight),
                  ),
                  SvgPicture.string(AppSvg.arrowRight),
                ],
              ),
            ),

            const Divider(),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => UpdateUserInfo(
                      title: 'Mettre à jour votre adresse mail',
                      currentValueLabel: 'Votre adresse mail actuelle :',
                      currentValue: widget.profile.email,
                      inputHint: 'Nouvelle adresse mail',
                      buttonText: 'Sauvegarder',
                      onSave: (newEmail) async {
                        await widget.viewModel.updateEmail(widget.profile.id, newEmail);
                        await widget.viewModel.fetchProfile();
                      },
                    ),
                  ),
                );
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Modifier votre adresse mail',
                    style: AppTypography.subheadingMedium.copyWith(color: AppColors.primaryLight),
                  ),
                  SvgPicture.string(AppSvg.arrowRight),
                ],
              ),
            ),
            const Divider(),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => UpdateUserInfo(
                      title: 'Mettre à jour votre mot de passe',
                      inputHint: 'Votre nouveau mot de passe',
                      buttonText: 'Sauvegarder',
                      isPassword: true,
                      onSave: (newPassword) async {
                        await widget.viewModel.updatePassword(widget.profile.id, newPassword);
                      },
                    ),
                  ),
                );
              },
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Modifier votre mot de passe',
                    style: AppTypography.subheadingMedium.copyWith(color: AppColors.primaryLight),
                  ),
                  SvgPicture.string(AppSvg.arrowRight),
                ],
              ),
            ),
            const Divider(),
            const Spacer(),
            Center(
              child: SmallButton(
                text: 'Se déconnecter',
                color: AppColors.danger,
                onPressed: () {
                  Navigator.pop(context);
                  context.read<AuthProvider>().logout();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}