import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/ui/widgets/button.dart';
import 'package:flutter_poc/core/auth/auth_provider.dart';

class Dashboard extends StatelessWidget {
  const Dashboard({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Padding(
      padding: const EdgeInsets.all(32.0),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          spacing: 24,
          children: [
            Text(
              "Cette option arrive bientôt, naviguez vers la page opportunités ou profil pour commencer à découvrir l'app !",
              style: AppTypography.subheadingMedium,
              textAlign: TextAlign.center,
            ),
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
    ),
  );
}
